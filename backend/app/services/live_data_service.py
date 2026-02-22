import logging
import re
import csv
import io
import json
import os
import time
import unicodedata
from difflib import SequenceMatcher

import httpx

logger = logging.getLogger(__name__)


class LiveDataService:
    """Real-time data from government and public APIs with safe fallbacks."""

    USITC_BASE_URL = "https://hts.usitc.gov/reststop"
    EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/USD"
    OFAC_SDN_URL = "https://sanctionslistservice.ofac.treas.gov/api/publicationpreview/exports/sdn.csv"
    COUNTRY_GEO_URL = "https://restcountries.com/v3.1/alpha/{code}"
    OFAC_CACHE_TTL_SECONDS = 24 * 60 * 60
    SECTION_301_CACHE_TTL_SECONDS = 24 * 60 * 60
    COUNTRY_CODE_ALIASES = {
        "UK": "GB",
        "UAE": "AE",
        "USA": "US",
        "UNITED STATES": "US",
        "UNITED STATES OF AMERICA": "US",
        "PRC": "CN",
        "CHINA": "CN",
        "RUSSIA": "RU",
        "SOUTH KOREA": "KR",
        "NORTH KOREA": "KP",
    }

    def __init__(self) -> None:
        self._country_geo_cache: dict[str, dict] = {}
        self._ofac_entries_cache: list[dict] = []
        self._ofac_cache_fetched_at: float = 0.0
        rules = self._load_compliance_rules()
        self._base_required_documents = rules.get("base_required_documents", [])
        self._special_requirements = rules.get("special_requirements", {})
        self._section_301_rates_cache = rules.get("section_301_rates_by_hs4", {})
        self._country_route_rules = rules.get("country_route_rules", {})
        self._section_301_cache_fetched_at: float = 0.0

    async def get_hts_data(self, hs_code: str) -> dict:
        """Get live tariff data from USITC HTS API."""
        clean_code = re.sub(r"[^0-9]", "", hs_code)

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.USITC_BASE_URL}/search",
                    params={"keyword": clean_code, "release": "currentRelease"},
                    timeout=10.0,
                )
                response.raise_for_status()
                data = response.json()

                # Current USITC response is a list of rows from reststop/search.
                if isinstance(data, list) and data:
                    dotted_input = hs_code if "." in hs_code else self._format_hs(clean_code)
                    result = self._pick_best_result(data, dotted_input, clean_code)
                    return {
                        "hs_code": result.get("htsno", hs_code),
                        "description": result.get("description", ""),
                        "general_rate": result.get("general", "0%"),
                        "special_rate": result.get("special", ""),
                        "column_2_rate": result.get("other", ""),
                        "unit": result.get("units", ""),
                        "source": "USITC Official",
                        "live": True,
                    }

                # Backward compatibility in case response shape changes again.
                results = data.get("results") if isinstance(data, dict) else None
                if isinstance(results, list) and results:
                    result = results[0]
                    return {
                        "hs_code": result.get("htsno", hs_code),
                        "description": result.get("description", ""),
                        "general_rate": result.get("general", "0%"),
                        "special_rate": result.get("special", ""),
                        "column_2_rate": result.get("other", ""),
                        "unit": result.get("units", ""),
                        "source": "USITC Official",
                        "live": True,
                    }
            except Exception as exc:
                logger.warning("USITC API failed for %s: %s", hs_code, exc)

        return self._get_fallback_hts(hs_code)

    def _pick_best_result(self, rows: list[dict], dotted_input: str, clean_code: str) -> dict:
        # Prefer exact HTS number first, then best prefix match, then first row.
        for row in rows:
            if str(row.get("htsno", "")).strip() == dotted_input:
                return row

        for row in rows:
            hts = re.sub(r"[^0-9]", "", str(row.get("htsno", "")))
            if hts and clean_code.startswith(hts):
                return row

        return rows[0]

    def _format_hs(self, clean_code: str) -> str:
        if len(clean_code) >= 10:
            return f"{clean_code[:4]}.{clean_code[4:6]}.{clean_code[6:8]}.{clean_code[8:10]}"
        if len(clean_code) == 8:
            return f"{clean_code[:4]}.{clean_code[4:6]}.{clean_code[6:8]}"
        if len(clean_code) == 6:
            return f"{clean_code[:4]}.{clean_code[4:6]}"
        return clean_code

    def _get_fallback_hts(self, hs_code: str) -> dict:
        fallback_rates = {
            "8504.40": {"rate": "0%", "desc": "Static converters"},
            "8518.30": {"rate": "0%", "desc": "Headphones and earphones"},
            "6110.20": {"rate": "16.5%", "desc": "Cotton sweaters"},
            "7323.93": {"rate": "3.4%", "desc": "Stainless steel articles"},
            "9503.00": {"rate": "0%", "desc": "Toys"},
        }

        prefix = hs_code[:7]
        if prefix in fallback_rates:
            return {
                "hs_code": hs_code,
                "description": fallback_rates[prefix]["desc"],
                "general_rate": fallback_rates[prefix]["rate"],
                "source": "Fallback",
                "live": False,
            }

        return {
            "hs_code": hs_code,
            "description": "Unknown",
            "general_rate": "5%",
            "source": "Default",
            "live": False,
        }

    def _load_compliance_rules(self) -> dict:
        default_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "data", "compliance_rules.json")
        )
        rules_path = os.getenv("COMPLIANCE_RULES_FILE", default_path)

        try:
            with open(rules_path, "r", encoding="utf-8") as file:
                payload = json.load(file)
        except Exception as exc:
            logger.warning("Compliance rules file unavailable (%s): %s", rules_path, exc)
            return {
                "base_required_documents": [],
                "special_requirements": {},
                "section_301_rates_by_hs4": {},
                "country_route_rules": {},
            }

        base_required = payload.get("base_required_documents", [])
        special_requirements = payload.get("special_requirements", {})
        section_301 = payload.get("section_301_rates_by_hs4", {})
        country_route_rules = payload.get("country_route_rules", {})
        if (
            not isinstance(base_required, list)
            or not isinstance(special_requirements, dict)
            or not isinstance(section_301, dict)
            or not isinstance(country_route_rules, dict)
        ):
            logger.warning("Compliance rules file has invalid shape: %s", rules_path)
            return {
                "base_required_documents": [],
                "special_requirements": {},
                "section_301_rates_by_hs4": {},
                "country_route_rules": {},
            }
        return payload

    def get_base_required_documents(self) -> list[dict]:
        documents = []
        for item in self._base_required_documents:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name", "")).strip()
            status = str(item.get("status", "")).strip().lower()
            if not name:
                continue
            if status not in {"required", "recommended"}:
                status = "required"
            documents.append({"name": name, "status": status})

        if documents:
            return documents

        return [
            {"name": "Commercial Invoice", "status": "required"},
            {"name": "Bill of Lading", "status": "required"},
            {"name": "Packing List", "status": "required"},
            {"name": "Certificate of Origin", "status": "recommended"},
        ]

    def get_special_requirements(self, hs_code: str) -> list[str]:
        hs_prefix = re.sub(r"[^0-9]", "", hs_code)[:4]
        requirements = self._special_requirements.get(hs_prefix, [])
        if not isinstance(requirements, list):
            return []
        return [str(item).strip() for item in requirements if str(item).strip()]

    async def get_exchange_rates(self) -> dict:
        """Get live exchange rates from exchangerate-api with fallback values."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.EXCHANGE_API_URL, timeout=5.0)
                response.raise_for_status()
                data = response.json()
                rates = data.get("rates", {})

                return {
                    "base": "USD",
                    "rates": {
                        "CNY": rates.get("CNY", 7.24),
                        "EUR": rates.get("EUR", 0.92),
                        "GBP": rates.get("GBP", 0.79),
                        "INR": rates.get("INR", 83.12),
                        "JPY": rates.get("JPY", 149.50),
                    },
                    "timestamp": data.get("time_last_updated"),
                    "source": "exchangerate-api",
                    "live": True,
                }
            except Exception as exc:
                logger.warning("Exchange rate API failed: %s", exc)

        return {
            "base": "USD",
            "rates": {"CNY": 7.24, "EUR": 0.92, "GBP": 0.79, "INR": 83.12, "JPY": 149.50},
            "source": "Fallback",
            "live": False,
        }

    async def screen_ofac(self, entity_name: str) -> dict:
        """Screen entity against OFAC SDN data with cached live list + fallback."""
        entity_normalized = self._normalize_entity_name(entity_name)
        if not entity_normalized:
            return {
                "entity": entity_name,
                "status": "CLEAR",
                "risk": "LOW",
                "message": "No valid entity name provided",
                "source": "OFAC SDN",
            }

        entries = await self._get_ofac_entries()
        if entries:
            for entry in entries:
                name = entry["name"]
                normalized_name = entry["normalized"]
                ratio = SequenceMatcher(None, entity_normalized, normalized_name).ratio()
                if (
                    entity_normalized == normalized_name
                    or entity_normalized in normalized_name
                    or normalized_name in entity_normalized
                    or ratio >= 0.93
                ):
                    return {
                        "entity": entity_name,
                        "status": "POTENTIAL_MATCH",
                        "risk": "HIGH",
                        "message": f"Potential OFAC SDN match: {name}",
                        "action": "Manual sanctions review required",
                        "source": "OFAC SDN CSV",
                    }

            return {
                "entity": entity_name,
                "status": "CLEAR",
                "risk": "LOW",
                "message": "No OFAC SDN matches found",
                "source": "OFAC SDN CSV",
            }

        return self._fallback_ofac_screen(entity_name)

    async def get_section_301_status(self, hs_code: str, origin: str) -> dict:
        """Check whether product may be subject to Section 301 tariffs."""
        normalized_origin = (origin or "").strip().upper()
        if normalized_origin not in {"CN", "CHINA", "PRC", "PEOPLE'S REPUBLIC OF CHINA"}:
            return {
                "applies": False,
                "rate": 0.0,
                "message": "Section 301 only applies to China origin",
                "source": "Configured Section 301 rules",
            }

        rates = await self._get_section_301_rates()
        hs_prefix = re.sub(r"[^0-9]", "", hs_code)[:4]
        rate = rates.get(hs_prefix)
        if rate is not None:
            return {
                "applies": True,
                "rate": float(rate),
                "rate_percent": f"{float(rate) * 100:.1f}%",
                "list": "List 1-4A",
                "message": f"Product subject to Section 301 tariff: {float(rate) * 100:.1f}%",
                "source": "Configured Section 301 rules",
            }

        return {
            "applies": False,
            "rate": 0.0,
            "message": "Product not on configured Section 301 list",
            "source": "Configured Section 301 rules",
        }

    async def get_country_geo(self, country_code: str) -> dict | None:
        code = (country_code or "").strip().upper()
        if len(code) != 2:
            return None

        cached = self._country_geo_cache.get(code)
        if cached:
            return cached

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    self.COUNTRY_GEO_URL.format(code=code),
                    params={"fields": "cca2,latlng,region,subregion"},
                    timeout=6.0,
                )
                response.raise_for_status()
                payload = response.json()
                record = payload[0] if isinstance(payload, list) and payload else payload
                latlng = record.get("latlng", []) if isinstance(record, dict) else []
                if not isinstance(latlng, list) or len(latlng) < 2:
                    return None

                result = {
                    "code": code,
                    "lat": float(latlng[0]),
                    "lon": float(latlng[1]),
                    "region": str(record.get("region", "")).strip().upper(),
                    "subregion": str(record.get("subregion", "")).strip().upper(),
                    "source": "restcountries",
                }
                self._country_geo_cache[code] = result
                return result
            except Exception as exc:
                logger.warning("Country geo lookup failed for %s: %s", code, exc)
                return None

    async def get_country_route_risk(self, origin_country: str, destination_country: str) -> dict:
        origin = self._normalize_country_code(origin_country)
        destination = self._normalize_country_code(destination_country)

        if not origin or not destination:
            return {
                "status": "WARNING",
                "score_penalty": 10,
                "details": "Could not normalize origin/destination country codes for risk assessment",
                "action_required": "Use ISO-2 country codes",
                "source": "Country route risk model",
            }

        if origin == destination:
            return {
                "status": "CLEAR",
                "score_penalty": 0,
                "details": "Domestic lane: no cross-border geopolitical constraint detected",
                "source": "Country route risk model",
            }

        live_risk = await self._get_live_country_route_risk(origin, destination)
        if live_risk is not None:
            return live_risk

        blocked_pairs = self._country_route_rules.get("blocked_pairs", [])
        for item in blocked_pairs:
            if not isinstance(item, dict):
                continue
            item_origin = self._normalize_country_code(item.get("origin", ""))
            item_destination = self._normalize_country_code(item.get("destination", ""))
            if item_origin == origin and item_destination == destination:
                penalty = self._safe_int(item.get("score_penalty"), default=85)
                return {
                    "status": "BLOCKED",
                    "score_penalty": max(60, penalty),
                    "details": str(
                        item.get(
                            "reason",
                            f"Trade lane {origin}->{destination} is highly restricted",
                        )
                    ),
                    "action_required": str(
                        item.get("action_required", "Escalate to legal/compliance before shipment")
                    ),
                    "source": str(
                        item.get("source", "Configured sanctions and geopolitics restrictions")
                    ),
                }

        high_risk_pairs = self._country_route_rules.get("high_risk_pairs", [])
        for item in high_risk_pairs:
            if not isinstance(item, dict):
                continue
            item_origin = self._normalize_country_code(item.get("origin", ""))
            item_destination = self._normalize_country_code(item.get("destination", ""))
            if item_origin == origin and item_destination == destination:
                penalty = self._safe_int(item.get("score_penalty"), default=35)
                return {
                    "status": "WARNING",
                    "score_penalty": max(20, penalty),
                    "details": str(
                        item.get(
                            "reason",
                            f"Trade lane {origin}->{destination} has elevated regulatory and sanctions risk",
                        )
                    ),
                    "action_required": str(
                        item.get(
                            "action_required",
                            "Perform enhanced denied-party and licensing checks",
                        )
                    ),
                    "source": str(
                        item.get("source", "Configured sanctions and geopolitics restrictions")
                    ),
                }

        watchlist = self._country_route_rules.get("watchlist_countries", {})
        watchlist_penalties = self._country_route_rules.get("watchlist_penalties", {})
        if isinstance(watchlist, dict):
            origin_level = str(watchlist.get(origin, "")).strip().lower()
            destination_level = str(watchlist.get(destination, "")).strip().lower()
            penalty = 0

            if origin_level:
                penalty += self._safe_int(watchlist_penalties.get(origin_level), default=10)
            if destination_level:
                penalty += self._safe_int(watchlist_penalties.get(destination_level), default=10)

            if penalty > 0:
                return {
                    "status": "WARNING",
                    "score_penalty": min(45, penalty),
                    "details": (
                        f"Lane involves watchlist country risk (origin={origin_level or 'low'}, "
                        f"destination={destination_level or 'low'})"
                    ),
                    "action_required": "Run enhanced documentary and licensing review",
                    "source": "Configured sanctions and geopolitics restrictions",
                }

        return {
            "status": "CLEAR",
            "score_penalty": 0,
            "details": "No country-lane restrictions detected in current model",
            "source": "Configured sanctions and geopolitics restrictions",
        }

    async def _get_ofac_entries(self) -> list[dict]:
        now = time.time()
        if self._ofac_entries_cache and (now - self._ofac_cache_fetched_at) < self.OFAC_CACHE_TTL_SECONDS:
            return self._ofac_entries_cache

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    self.OFAC_SDN_URL,
                    timeout=20.0,
                    follow_redirects=True,
                )
                response.raise_for_status()
                entries = self._parse_ofac_csv(response.text)
                if entries:
                    self._ofac_entries_cache = entries
                    self._ofac_cache_fetched_at = now
                return self._ofac_entries_cache
            except Exception as exc:
                logger.warning("OFAC CSV fetch failed: %s", exc)
                return self._ofac_entries_cache

    async def _get_section_301_rates(self) -> dict:
        now = time.time()
        if (
            self._section_301_rates_cache
            and (now - self._section_301_cache_fetched_at) < self.SECTION_301_CACHE_TTL_SECONDS
        ):
            return self._section_301_rates_cache

        rules_url = os.getenv("SECTION_301_RULES_URL", "").strip()
        if not rules_url:
            return self._section_301_rates_cache

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(rules_url, timeout=10.0)
                response.raise_for_status()
                payload = response.json()
                if isinstance(payload, dict) and "section_301_rates_by_hs4" in payload:
                    payload = payload["section_301_rates_by_hs4"]
                if isinstance(payload, dict):
                    parsed = {}
                    for key, value in payload.items():
                        hs_prefix = re.sub(r"[^0-9]", "", str(key))[:4]
                        if len(hs_prefix) != 4:
                            continue
                        try:
                            parsed[hs_prefix] = float(value)
                        except Exception:
                            continue

                    if parsed:
                        self._section_301_rates_cache = parsed
                        self._section_301_cache_fetched_at = now
            except Exception as exc:
                logger.warning("Live Section 301 rules fetch failed: %s", exc)

        return self._section_301_rates_cache

    async def _get_live_country_route_risk(self, origin: str, destination: str) -> dict | None:
        risk_url = os.getenv("COUNTRY_ROUTE_RISK_URL", "").strip()
        if not risk_url:
            return None

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    risk_url,
                    params={"origin": origin, "destination": destination},
                    timeout=8.0,
                    follow_redirects=True,
                )
                response.raise_for_status()
                payload = response.json()
                if not isinstance(payload, dict):
                    return None

                status = str(payload.get("status", "WARNING")).strip().upper()
                if status not in {"CLEAR", "WARNING", "BLOCKED"}:
                    status = "WARNING"

                return {
                    "status": status,
                    "score_penalty": self._safe_int(payload.get("score_penalty"), default=20),
                    "details": str(
                        payload.get(
                            "details",
                            f"Live lane risk signal for {origin}->{destination}",
                        )
                    ),
                    "action_required": str(payload.get("action_required", "Review route compliance")),
                    "source": str(payload.get("source", "Live country route risk API")),
                }
            except Exception as exc:
                logger.warning("Live country route risk fetch failed: %s", exc)
                return None

    def _parse_ofac_csv(self, csv_text: str) -> list[dict]:
        entries = []
        seen = set()

        # OFAC SDN CSV currently has no header; name is usually the second column.
        try:
            for row in csv.reader(io.StringIO(csv_text)):
                if not row or len(row) < 2:
                    continue
                if str(row[0]).strip().upper() in {"ENT_NUM", "UID"}:
                    continue

                name = str(row[1]).strip().strip('"')
                normalized = self._normalize_entity_name(name)
                if not normalized or normalized in seen:
                    continue
                seen.add(normalized)
                entries.append({"name": name, "normalized": normalized})
        except Exception:
            return []

        return entries

    def _normalize_entity_name(self, value: str) -> str:
        normalized = unicodedata.normalize("NFKD", str(value or ""))
        ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
        cleaned = re.sub(r"[^A-Za-z0-9 ]+", " ", ascii_text.upper())
        return re.sub(r"\s+", " ", cleaned).strip()

    def _normalize_country_code(self, value: str) -> str:
        raw = str(value or "").strip().upper()
        if not raw:
            return ""
        if raw in self.COUNTRY_CODE_ALIASES:
            return self.COUNTRY_CODE_ALIASES[raw]
        if len(raw) == 2:
            return raw
        normalized = self._normalize_entity_name(raw)
        return self.COUNTRY_CODE_ALIASES.get(normalized, "")

    def _safe_int(self, value, default: int = 0) -> int:
        try:
            return int(value)
        except Exception:
            return default

    def _fallback_ofac_screen(self, entity_name: str) -> dict:
        high_risk_keywords = ["IRAN", "NORTH KOREA", "DPRK", "SYRIA", "CUBA", "WAGNER", "HAMAS", "HEZBOLLAH"]
        entity_upper = self._normalize_entity_name(entity_name)
        for keyword in high_risk_keywords:
            if keyword in entity_upper:
                return {
                    "entity": entity_name,
                    "status": "POTENTIAL_MATCH",
                    "risk": "HIGH",
                    "message": f"Entity contains high-risk keyword: {keyword}",
                    "action": "Manual sanctions review required",
                    "source": "Fallback keyword screening",
                }

        return {
            "entity": entity_name,
            "status": "CLEAR",
            "risk": "LOW",
            "message": "No matches found in fallback screening",
            "source": "Fallback keyword screening",
        }


live_data_service = LiveDataService()
