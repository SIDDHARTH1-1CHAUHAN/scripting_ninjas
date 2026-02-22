import math

from pydantic import BaseModel, Field

from .live_data_service import live_data_service


class LandedCostRequest(BaseModel):
    hs_code: str
    product_value: float = Field(gt=0)
    quantity: int = Field(gt=0)
    origin_country: str
    destination_country: str
    shipping_mode: str = "ocean"
    incoterm: str = "FOB"
    currency: str = "USD"


class LandedCostResult(BaseModel):
    total_landed_cost: float
    cost_per_unit: float
    breakdown: dict
    effective_duty_rate: float
    warnings: list[str]


class LandedCostService:
    """Calculate landed cost using live tariff and policy data."""

    COUNTRY_HUBS = {
        "US": (34.0522, -118.2437),  # Los Angeles
        "CN": (31.2304, 121.4737),   # Shanghai
        "IN": (19.0760, 72.8777),    # Mumbai
        "JP": (35.6762, 139.6503),   # Tokyo
        "DE": (53.5511, 9.9937),     # Hamburg
        "GB": (51.5072, -0.1276),    # London
        "FR": (48.8566, 2.3522),     # Paris
        "IT": (45.4642, 9.1900),     # Milan
        "ES": (40.4168, -3.7038),    # Madrid
        "NL": (51.9244, 4.4777),     # Rotterdam
        "BE": (51.2194, 4.4025),     # Antwerp
        "CH": (47.3769, 8.5417),     # Zurich
        "SE": (59.3293, 18.0686),    # Stockholm
        "NO": (59.9139, 10.7522),    # Oslo
        "PL": (52.2297, 21.0122),    # Warsaw
        "TR": (41.0082, 28.9784),    # Istanbul
        "CA": (49.2827, -123.1207),  # Vancouver
        "MX": (19.4326, -99.1332),   # Mexico City
        "BR": (-23.5505, -46.6333),  # Sao Paulo
        "AR": (-34.6037, -58.3816),  # Buenos Aires
        "CL": (-33.4489, -70.6693),  # Santiago
        "CO": (4.7110, -74.0721),    # Bogota
        "VN": (10.8231, 106.6297),   # Ho Chi Minh City
        "TH": (13.7563, 100.5018),   # Bangkok
        "MY": (3.1390, 101.6869),    # Kuala Lumpur
        "ID": (-6.2088, 106.8456),   # Jakarta
        "KR": (37.5665, 126.9780),   # Seoul
        "TW": (25.0330, 121.5654),   # Taipei
        "SG": (1.3521, 103.8198),    # Singapore
        "AE": (25.2048, 55.2708),    # Dubai
        "SA": (24.7136, 46.6753),    # Riyadh
        "ZA": (-26.2041, 28.0473),   # Johannesburg
        "AU": (-33.8688, 151.2093),  # Sydney
        "NZ": (-36.8485, 174.7633),  # Auckland
    }

    COUNTRY_REGION = {
        "US": "NA", "CA": "NA", "MX": "NA",
        "BR": "SA", "AR": "SA", "CL": "SA", "CO": "SA",
        "GB": "EU", "DE": "EU", "FR": "EU", "IT": "EU", "ES": "EU",
        "NL": "EU", "BE": "EU", "CH": "EU", "SE": "EU", "NO": "EU", "PL": "EU",
        "TR": "ME", "AE": "ME", "SA": "ME",
        "CN": "APAC", "IN": "APAC", "JP": "APAC", "KR": "APAC", "TW": "APAC",
        "VN": "APAC", "TH": "APAC", "MY": "APAC", "ID": "APAC", "SG": "APAC",
        "AU": "APAC", "NZ": "APAC",
        "ZA": "AF",
    }

    MODE_PRICING = {
        "ocean": {
            "base_per_kg_km": 0.00005,
            "handling_fee": 280.0,
            "min_charge": 320.0,
            "fuel_surcharge": 0.08,
        },
        "air": {
            "base_per_kg_km": 0.00042,
            "handling_fee": 460.0,
            "min_charge": 900.0,
            "fuel_surcharge": 0.13,
        },
        "rail": {
            "base_per_kg_km": 0.00016,
            "handling_fee": 340.0,
            "min_charge": 550.0,
            "fuel_surcharge": 0.10,
        },
    }

    def _parse_rate(self, rate_value: str | float | int) -> float:
        if isinstance(rate_value, (int, float)):
            numeric = float(rate_value)
            return numeric / 100 if numeric > 1 else numeric

        normalized = rate_value.strip().lower()
        if not normalized or "free" in normalized:
            return 0.0

        cleaned = normalized.replace(",", "")
        numeric_chars = []
        seen_digit = False
        for char in cleaned:
            if char.isdigit() or (char == "." and seen_digit):
                numeric_chars.append(char)
                seen_digit = True
                continue
            if seen_digit:
                break

        if not numeric_chars:
            return 0.0

        try:
            return float("".join(numeric_chars)) / 100
        except ValueError:
            return 0.0

    def _haversine_km(self, origin: tuple[float, float], destination: tuple[float, float]) -> float:
        lat1, lon1 = origin
        lat2, lon2 = destination
        radius_km = 6371.0

        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        d_phi = math.radians(lat2 - lat1)
        d_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(d_phi / 2) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return radius_km * c

    def _lane_factor(self, origin_country: str, destination_country: str) -> float:
        if origin_country == destination_country:
            return 0.35

        origin_region = self.COUNTRY_REGION.get(origin_country)
        destination_region = self.COUNTRY_REGION.get(destination_country)
        if origin_region and destination_region and origin_region == destination_region:
            return 0.72

        remote_codes = {"AU", "NZ", "ZA", "CL"}
        if origin_country in remote_codes or destination_country in remote_codes:
            return 1.18

        return 1.0

    async def _resolve_country_hub(
        self,
        country_code: str,
        warnings: list[str],
    ) -> tuple[tuple[float, float] | None, str | None]:
        code = (country_code or "").strip().upper()
        hub = self.COUNTRY_HUBS.get(code)
        region = self.COUNTRY_REGION.get(code)
        if hub:
            return hub, region

        geo = await live_data_service.get_country_geo(code)
        if geo:
            derived_region = geo.get("region")
            # Map broad API regions into our internal buckets.
            region_map = {
                "EUROPE": "EU",
                "ASIA": "APAC",
                "AMERICAS": "NA",
                "AFRICA": "AF",
                "OCEANIA": "APAC",
            }
            mapped_region = region_map.get(str(derived_region or "").upper(), "OTHER")
            return (geo["lat"], geo["lon"]), mapped_region

        warnings.append(f"Country geo unavailable for {code}, using default lane estimate")
        return None, None

    async def _estimate_freight(
        self,
        shipping_mode: str,
        quantity: int,
        origin_country: str,
        destination_country: str,
        warnings: list[str],
    ) -> tuple[float, dict]:
        mode = (shipping_mode or "ocean").lower()
        if mode not in self.MODE_PRICING:
            warnings.append(f"Unsupported shipping mode '{shipping_mode}', defaulted to ocean")
            mode = "ocean"

        pricing = self.MODE_PRICING[mode]
        origin_code = (origin_country or "").upper()
        destination_code = (destination_country or "").upper()

        origin_hub, origin_region = await self._resolve_country_hub(origin_code, warnings)
        destination_hub, destination_region = await self._resolve_country_hub(destination_code, warnings)
        if not origin_hub or not destination_hub:
            distance_km = 8000.0
            warnings.append("Using default lane distance estimate for freight")
        else:
            distance_km = self._haversine_km(origin_hub, destination_hub)

        # Weight estimate from quantity (used when gross weight is unavailable).
        estimated_weight_kg = max(120.0, quantity * 1.6)
        lane_factor = self._lane_factor(origin_code, destination_code)
        if origin_region and destination_region and origin_region != destination_region:
            lane_factor *= 1.06

        variable_cost = (
            estimated_weight_kg * distance_km * pricing["base_per_kg_km"] * lane_factor
        )
        subtotal = variable_cost + pricing["handling_fee"]
        fuel = subtotal * pricing["fuel_surcharge"]
        freight = max(pricing["min_charge"], subtotal + fuel)

        return round(freight, 2), {
            "mode": mode,
            "distance_km": round(distance_km, 1),
            "estimated_weight_kg": round(estimated_weight_kg, 2),
            "lane_factor": lane_factor,
            "fuel_surcharge_rate": pricing["fuel_surcharge"],
            "origin_region": origin_region or "UNKNOWN",
            "destination_region": destination_region or "UNKNOWN",
        }

    async def calculate(self, request: LandedCostRequest) -> LandedCostResult:
        """Calculate complete landed cost"""
        warnings = []
        input_currency = (request.currency or "USD").upper().strip()
        input_product_value = request.product_value

        fx_rates = await live_data_service.get_exchange_rates()
        if not fx_rates.get("live"):
            warnings.append("Using fallback exchange rates")

        exchange_rate_to_usd = 1.0
        product_value_usd = request.product_value
        if input_currency != "USD":
            rates = fx_rates.get("rates", {})
            rate = rates.get(input_currency)
            if isinstance(rate, (int, float)) and rate > 0:
                exchange_rate_to_usd = float(rate)
                product_value_usd = request.product_value / exchange_rate_to_usd
            else:
                warnings.append(f"Unsupported currency '{input_currency}', treated as USD")
                input_currency = "USD"

        hts_data = await live_data_service.get_hts_data(request.hs_code)
        base_rate = self._parse_rate(hts_data.get("general_rate", "0%"))
        if not hts_data.get("live"):
            warnings.append("Using fallback HTS tariff data")

        section_301_status = await live_data_service.get_section_301_status(
            request.hs_code, request.origin_country
        )
        section_301_rate = section_301_status.get("rate", 0.0)
        if section_301_status.get("applies"):
            warnings.append(section_301_status.get("message", "Section 301 tariff applies"))

        # Calculate duties
        base_duty = product_value_usd * base_rate
        section_301 = product_value_usd * section_301_rate

        # Calculate fees
        mpf_rate = 0.003464
        mpf = max(31.67, min(614.35, product_value_usd * mpf_rate))

        hmf_rate = 0.00125
        hmf = product_value_usd * hmf_rate if request.shipping_mode == "ocean" else 0.0

        # Estimate shipping costs
        freight, freight_meta = await self._estimate_freight(
            shipping_mode=request.shipping_mode,
            quantity=request.quantity,
            origin_country=request.origin_country,
            destination_country=request.destination_country,
            warnings=warnings,
        )

        # Insurance (0.5% of CIF value)
        cif_value = product_value_usd + freight
        insurance = cif_value * 0.005

        # Total
        total_duties = base_duty + section_301 + mpf + hmf
        total_freight = freight + insurance
        total_landed = product_value_usd + total_duties + total_freight
        quantity = max(request.quantity, 1)

        return LandedCostResult(
            total_landed_cost=round(total_landed, 2),
            cost_per_unit=round(total_landed / quantity, 2),
            breakdown={
                "product_value": round(product_value_usd, 2),
                "input_product_value": input_product_value,
                "input_currency": input_currency,
                "exchange_rate_to_usd": exchange_rate_to_usd,
                "base_duty": round(base_duty, 2),
                "base_duty_rate": base_rate,
                "section_301": round(section_301, 2),
                "section_301_rate": section_301_rate,
                "mpf": round(mpf, 2),
                "hmf": round(hmf, 2),
                "freight": round(freight, 2),
                "insurance": round(insurance, 2),
                "total_duties": round(total_duties, 2),
                "total_freight": round(total_freight, 2),
                "lane_distance_km": freight_meta["distance_km"],
                "estimated_weight_kg": freight_meta["estimated_weight_kg"],
                "lane_factor": freight_meta["lane_factor"],
                "mode_used": freight_meta["mode"],
                "origin_region": freight_meta["origin_region"],
                "destination_region": freight_meta["destination_region"],
                "hts_description": hts_data.get("description", ""),
                "hts_source": hts_data.get("source", "Unknown"),
                "section_301_source": section_301_status.get("source", "Unknown"),
                "exchange_rates": fx_rates.get("rates", {}),
            },
            effective_duty_rate=round((total_duties / max(product_value_usd, 1)) * 100, 2),
            warnings=warnings,
        )


landed_cost_service = LandedCostService()
