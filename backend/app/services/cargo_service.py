from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import math
import random
from typing import List, Optional

import httpx
from pydantic import BaseModel

from .live_data_service import live_data_service


class Position(BaseModel):
    latitude: float
    longitude: float
    location_name: str
    speed_knots: float
    heading: int
    timestamp: datetime


class RoutePoint(BaseModel):
    lat: float
    lon: float
    name: str
    kind: str = "waypoint"


class TimelineEvent(BaseModel):
    status: str
    location: str
    timestamp: datetime
    completed: bool
    current: bool = False
    estimated: bool = False


class CargoAlert(BaseModel):
    type: str  # INFO, WARNING, CRITICAL
    message: str
    timestamp: datetime


class ShipmentDetails(BaseModel):
    container_id: str
    bill_of_lading: str
    vessel: str
    voyage: str
    carrier: str
    origin_port: str
    origin_country: str
    destination_port: str
    destination_country: str
    departed: datetime
    eta: datetime
    cargo_description: str
    hs_code: str
    weight_kg: float
    value_usd: float


class CargoTrackingResult(BaseModel):
    shipment: ShipmentDetails
    current_position: Position
    timeline: List[TimelineEvent]
    alerts: List[CargoAlert]
    progress_percent: int
    route_points: List[RoutePoint]
    reliability_score: int
    delay_risk: str


class CargoService:
    """Container tracking with deterministic, non-hardcoded shipment generation."""

    WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

    PORTS = [
        {"code": "CNSZX", "name": "Yantian, Shenzhen", "country": "CN", "lat": 22.5431, "lon": 114.0579, "region": "APAC"},
        {"code": "CNSHA", "name": "Shanghai", "country": "CN", "lat": 31.2304, "lon": 121.4737, "region": "APAC"},
        {"code": "SGSIN", "name": "Singapore", "country": "SG", "lat": 1.2644, "lon": 103.8222, "region": "APAC"},
        {"code": "JPTYO", "name": "Tokyo", "country": "JP", "lat": 35.6762, "lon": 139.6503, "region": "APAC"},
        {"code": "INNSA", "name": "Nhava Sheva", "country": "IN", "lat": 18.95, "lon": 72.95, "region": "APAC"},
        {"code": "NLRTM", "name": "Rotterdam", "country": "NL", "lat": 51.9244, "lon": 4.4777, "region": "EU"},
        {"code": "DEHAM", "name": "Hamburg", "country": "DE", "lat": 53.5461, "lon": 9.9661, "region": "EU"},
        {"code": "ESBCN", "name": "Barcelona", "country": "ES", "lat": 41.3851, "lon": 2.1734, "region": "EU"},
        {"code": "USEWR", "name": "Newark", "country": "US", "lat": 40.7357, "lon": -74.1724, "region": "US"},
        {"code": "USLAX", "name": "Los Angeles", "country": "US", "lat": 33.7701, "lon": -118.1937, "region": "US"},
        {"code": "USLGB", "name": "Long Beach", "country": "US", "lat": 33.7544, "lon": -118.2166, "region": "US"},
        {"code": "AUMEL", "name": "Melbourne", "country": "AU", "lat": -37.8136, "lon": 144.9631, "region": "APAC"},
        {"code": "BRSSZ", "name": "Santos", "country": "BR", "lat": -23.9608, "lon": -46.3336, "region": "LATAM"},
        {"code": "PAPAC", "name": "Panama Canal", "country": "PA", "lat": 9.081, "lon": -79.68, "region": "HUB"},
        {"code": "AEJEA", "name": "Jebel Ali", "country": "AE", "lat": 25.0657, "lon": 55.1713, "region": "HUB"},
    ]

    CARRIERS = ["COSCO", "MSC", "Maersk", "Evergreen", "CMA CGM", "Hapag-Lloyd", "ONE", "ZIM"]

    CARGO_CATALOG = [
        {"description": "Solar power modules", "hs_code": "8541.43.00", "weight": (900, 3000), "value": (70000, 250000)},
        {"description": "Consumer electronics accessories", "hs_code": "8504.40.95", "weight": (600, 2200), "value": (30000, 120000)},
        {"description": "Lithium battery components", "hs_code": "8507.60.00", "weight": (500, 1600), "value": (45000, 180000)},
        {"description": "Industrial control boards", "hs_code": "8537.10.91", "weight": (400, 1400), "value": (60000, 210000)},
        {"description": "Packaging machinery parts", "hs_code": "8422.90.06", "weight": (1200, 3800), "value": (85000, 260000)},
    ]

    SAMPLE_PREFIXES = ["TCLU", "MSCU", "MAEU", "CMAU", "EGLV", "HLCU", "OOLU", "YMLU"]

    async def track_shipment(
        self,
        container_id: str,
        include_live_signals: bool = True,
    ) -> Optional[CargoTrackingResult]:
        """Track a shipment by container ID with deterministic live-like behavior."""
        container = self._normalize_container_id(container_id)
        if len(container) < 6:
            return None

        seed = self._seed_int(container)
        rng = random.Random(seed)

        profile = self._build_shipment_profile(container, rng)
        route_points = self._build_route_points(profile["origin"], profile["destination"], rng)
        schedule = self._build_schedule(profile["transit_days"], seed)

        progress = schedule["progress"]
        current_position = self._interpolate_position(route_points, progress, schedule["now"], seed)
        timeline = self._build_timeline(schedule, profile, progress)

        if include_live_signals:
            weather_snapshot = await self._fetch_weather_snapshot(
                current_position.latitude,
                current_position.longitude,
            )
            route_risk = await live_data_service.get_country_route_risk(
                profile["origin"]["country"],
                profile["destination"]["country"],
            )
        else:
            weather_snapshot = None
            route_risk = {
                "status": "CLEAR",
                "score_penalty": 0,
                "details": "Live route risk disabled for lightweight listing.",
                "source": "CargoService",
            }

        delay_risk = self._compute_delay_risk(route_risk, weather_snapshot)
        reliability_score = self._compute_reliability_score(
            carrier=profile["carrier"],
            route_risk=route_risk,
            weather_snapshot=weather_snapshot,
            delay_risk=delay_risk,
        )
        alerts = self._generate_alerts(
            profile=profile,
            progress=progress,
            route_risk=route_risk,
            weather_snapshot=weather_snapshot,
            delay_risk=delay_risk,
            now=schedule["now"],
        )

        route_payload = [
            RoutePoint(
                lat=round(point["lat"], 5),
                lon=round(point["lon"], 5),
                name=point["name"],
                kind=point["kind"],
            )
            for point in route_points
        ]

        shipment = ShipmentDetails(
            container_id=container,
            bill_of_lading=profile["bill_of_lading"],
            vessel=profile["vessel"],
            voyage=profile["voyage"],
            carrier=profile["carrier"],
            origin_port=profile["origin"]["name"],
            origin_country=profile["origin"]["country"],
            destination_port=profile["destination"]["name"],
            destination_country=profile["destination"]["country"],
            departed=schedule["departed"],
            eta=schedule["eta"],
            cargo_description=profile["cargo_description"],
            hs_code=profile["hs_code"],
            weight_kg=profile["weight_kg"],
            value_usd=profile["value_usd"],
        )

        return CargoTrackingResult(
            shipment=shipment,
            current_position=current_position,
            timeline=timeline,
            alerts=alerts,
            progress_percent=int(round(progress * 100)),
            route_points=route_payload,
            reliability_score=reliability_score,
            delay_risk=delay_risk,
        )

    async def get_all_shipments(self) -> List[dict]:
        """Return deterministic sample shipments for dashboard use."""
        results: List[dict] = []
        for idx, prefix in enumerate(self.SAMPLE_PREFIXES):
            container_id = f"{prefix}{(1000000 + (idx * 13719)) % 9000000:07d}"
            tracking = await self.track_shipment(container_id, include_live_signals=False)
            if not tracking:
                continue
            results.append(
                {
                    "container_id": tracking.shipment.container_id,
                    "vessel": tracking.shipment.vessel,
                    "origin": tracking.shipment.origin_port,
                    "destination": tracking.shipment.destination_port,
                    "eta": tracking.shipment.eta.isoformat(),
                    "progress_percent": tracking.progress_percent,
                    "status": self._status_from_timeline(tracking.timeline),
                }
            )
        return results

    async def search_shipments(self, query: str) -> List[dict]:
        """Search deterministic samples and also container-like direct tracking."""
        normalized_query = "".join(ch for ch in query.upper() if ch.isalnum())
        results: List[dict] = []

        if len(normalized_query) >= 6:
            direct = await self.track_shipment(normalized_query, include_live_signals=False)
            if direct:
                results.append(
                    {
                        "container_id": direct.shipment.container_id,
                        "bill_of_lading": direct.shipment.bill_of_lading,
                        "vessel": direct.shipment.vessel,
                        "status": self._status_from_timeline(direct.timeline),
                    }
                )

        sample_shipments = await self.get_all_shipments()
        for item in sample_shipments:
            haystack = " ".join(
                [
                    item.get("container_id", ""),
                    item.get("vessel", ""),
                    item.get("origin", ""),
                    item.get("destination", ""),
                ]
            ).upper()
            if normalized_query and normalized_query not in haystack:
                continue
            if any(existing["container_id"] == item["container_id"] for existing in results):
                continue
            results.append(
                {
                    "container_id": item["container_id"],
                    "bill_of_lading": "N/A",
                    "vessel": item["vessel"],
                    "status": item["status"],
                }
            )

        return results[:10]

    def _normalize_container_id(self, value: str) -> str:
        return "".join(ch for ch in (value or "").upper() if ch.isalnum())

    def _seed_int(self, container_id: str) -> int:
        digest = hashlib.sha256(container_id.encode("utf-8")).hexdigest()
        return int(digest[:16], 16)

    def _build_shipment_profile(self, container_id: str, rng: random.Random) -> dict:
        origin_choices = [port for port in self.PORTS if port["region"] in {"APAC", "EU", "LATAM"}]
        origin = rng.choice(origin_choices)

        destination_choices = [
            port
            for port in self.PORTS
            if port["country"] != origin["country"] and port["region"] != "HUB"
        ]
        destination = rng.choice(destination_choices)

        cargo = rng.choice(self.CARGO_CATALOG)
        carrier = self._carrier_for_container(container_id, rng)

        distance_km = self._haversine_km(origin["lat"], origin["lon"], destination["lat"], destination["lon"]) * 1.18
        transit_days = max(6, min(38, int(round(distance_km / 780)) + rng.randint(1, 4)))

        vessel = self._build_vessel_name(carrier, rng)
        voyage = f"{rng.randint(100, 999)}{chr(65 + rng.randint(0, 25))}"
        now = datetime.now(timezone.utc)
        bill = f"{carrier[:3].upper()}{now.strftime('%y%m')}{rng.randint(100000, 999999)}"

        weight_min, weight_max = cargo["weight"]
        value_min, value_max = cargo["value"]

        return {
            "container_id": container_id,
            "bill_of_lading": bill,
            "vessel": vessel,
            "voyage": voyage,
            "carrier": carrier,
            "origin": origin,
            "destination": destination,
            "cargo_description": cargo["description"],
            "hs_code": cargo["hs_code"],
            "weight_kg": float(rng.randint(weight_min, weight_max)),
            "value_usd": float(rng.randint(value_min, value_max)),
            "transit_days": transit_days,
        }

    def _carrier_for_container(self, container_id: str, rng: random.Random) -> str:
        prefix_map = {
            "MSCU": "MSC",
            "MAEU": "Maersk",
            "EGLV": "Evergreen",
            "CMAU": "CMA CGM",
            "HLCU": "Hapag-Lloyd",
            "TCLU": "COSCO",
            "OOLU": "ONE",
        }
        prefix = container_id[:4]
        if prefix in prefix_map:
            return prefix_map[prefix]
        return rng.choice(self.CARRIERS)

    def _build_vessel_name(self, carrier: str, rng: random.Random) -> str:
        fleet = {
            "COSCO": ["CSCL Saturn", "COSCO Pegasus", "COSCO Pacific"],
            "MSC": ["MSC Oscar", "MSC Zoe", "MSC Aurora"],
            "Maersk": ["Maersk Madrid", "Maersk Essen", "Maersk Elba"],
            "Evergreen": ["Ever Ace", "Ever Alot", "Ever Balance"],
            "CMA CGM": ["CMA CGM Jacques Saade", "CMA CGM Marco Polo", "CMA CGM Titan"],
            "Hapag-Lloyd": ["Berlin Express", "Hamburg Express", "Frankfurt Express"],
            "ONE": ["ONE Minato", "ONE Olympus", "ONE Integrity"],
            "ZIM": ["ZIM Mount Denali", "ZIM Pacific", "ZIM Kingston"],
        }
        choices = fleet.get(carrier, ["Ocean Trader", "Global Horizon", "Sea Pioneer"])
        return rng.choice(choices)

    def _build_route_points(self, origin: dict, destination: dict, rng: random.Random) -> List[dict]:
        points = [
            {"lat": origin["lat"], "lon": origin["lon"], "name": origin["name"], "kind": "origin"}
        ]

        distance = self._haversine_km(origin["lat"], origin["lon"], destination["lat"], destination["lon"])
        hub_points = [port for port in self.PORTS if port["region"] == "HUB"]

        if distance > 8000 and hub_points:
            hub = min(
                hub_points,
                key=lambda item: (
                    self._haversine_km(origin["lat"], origin["lon"], item["lat"], item["lon"]) +
                    self._haversine_km(item["lat"], item["lon"], destination["lat"], destination["lon"])
                ),
            )
            points.append({"lat": hub["lat"], "lon": hub["lon"], "name": hub["name"], "kind": "hub"})

        points.append({"lat": destination["lat"], "lon": destination["lon"], "name": destination["name"], "kind": "destination"})

        dense: List[dict] = []
        for idx in range(len(points) - 1):
            start = points[idx]
            end = points[idx + 1]
            segment_km = self._haversine_km(start["lat"], start["lon"], end["lat"], end["lon"])
            segments = max(2, min(8, int(segment_km / 1400) + 1))

            for step in range(segments):
                ratio = step / segments
                lat = start["lat"] + (end["lat"] - start["lat"]) * ratio
                lon = start["lon"] + (end["lon"] - start["lon"]) * ratio
                name = start["name"] if step == 0 else f"Sea Lane {idx + 1}.{step}"
                kind = start["kind"] if step == 0 else "waypoint"
                dense.append({"lat": lat, "lon": lon, "name": name, "kind": kind})

        dense.append(points[-1])

        # Add subtle deterministic wave to mid-ocean points for a more realistic path.
        nudged: List[dict] = []
        for idx, point in enumerate(dense):
            if point["kind"] in {"origin", "destination", "hub"}:
                nudged.append(point)
                continue
            phase = math.sin((idx + (rng.randint(1, 9))) * 0.75)
            nudged.append(
                {
                    **point,
                    "lat": point["lat"] + phase * 0.35,
                    "lon": point["lon"] + phase * 0.45,
                }
            )
        return nudged

    def _build_schedule(self, transit_days: int, seed: int) -> dict:
        now = datetime.now(timezone.utc)
        transit_seconds = max(1, int(transit_days * 24 * 3600))
        post_arrival_seconds = 4 * 24 * 3600
        cycle_seconds = transit_seconds + post_arrival_seconds

        phase_seconds = (int(now.timestamp()) + seed) % cycle_seconds
        progress = min(phase_seconds / transit_seconds, 1.0)

        departed = now - timedelta(seconds=phase_seconds)
        eta = departed + timedelta(seconds=transit_seconds)
        arrived_seconds = max(0, phase_seconds - transit_seconds)

        return {
            "now": now,
            "departed": departed,
            "eta": eta,
            "progress": progress,
            "arrived_seconds": arrived_seconds,
        }

    def _interpolate_position(self, route_points: List[dict], progress: float, now: datetime, seed: int) -> Position:
        if not route_points:
            return Position(
                latitude=0.0,
                longitude=0.0,
                location_name="Unknown",
                speed_knots=0.0,
                heading=0,
                timestamp=now,
            )

        if progress <= 0:
            point = route_points[0]
            return Position(
                latitude=round(point["lat"], 5),
                longitude=round(point["lon"], 5),
                location_name=f"Departed {point['name']}",
                speed_knots=9.5,
                heading=90,
                timestamp=now,
            )

        if progress >= 1:
            point = route_points[-1]
            return Position(
                latitude=round(point["lat"], 5),
                longitude=round(point["lon"], 5),
                location_name=f"At {point['name']}",
                speed_knots=0.8,
                heading=0,
                timestamp=now,
            )

        cumulative = [0.0]
        for idx in range(len(route_points) - 1):
            current = route_points[idx]
            nxt = route_points[idx + 1]
            cumulative.append(
                cumulative[-1] + self._haversine_km(current["lat"], current["lon"], nxt["lat"], nxt["lon"])
            )

        total = cumulative[-1] if cumulative[-1] > 0 else 1.0
        target = total * progress

        segment_index = 0
        for idx in range(len(cumulative) - 1):
            if cumulative[idx + 1] >= target:
                segment_index = idx
                break

        start = route_points[segment_index]
        end = route_points[min(segment_index + 1, len(route_points) - 1)]
        segment_total = max(0.001, cumulative[segment_index + 1] - cumulative[segment_index])
        segment_offset = target - cumulative[segment_index]
        fraction = max(0.0, min(1.0, segment_offset / segment_total))

        lat = start["lat"] + (end["lat"] - start["lat"]) * fraction
        lon = start["lon"] + (end["lon"] - start["lon"]) * fraction

        heading = self._bearing(start["lat"], start["lon"], end["lat"], end["lon"])
        speed_knots = 13.8 + ((seed + int(now.timestamp() // 600)) % 80) / 10

        if fraction < 0.25:
            location = f"Near {start['name']}"
        elif fraction > 0.75:
            location = f"Approaching {end['name']}"
        else:
            location = f"Between {start['name']} and {end['name']}"

        return Position(
            latitude=round(lat, 5),
            longitude=round(lon, 5),
            location_name=location,
            speed_knots=round(speed_knots, 1),
            heading=heading,
            timestamp=now,
        )

    def _build_timeline(self, schedule: dict, profile: dict, progress: float) -> List[TimelineEvent]:
        now = schedule["now"]
        departed = schedule["departed"]
        eta = schedule["eta"]
        arrived_seconds = schedule["arrived_seconds"]

        customs_at = eta + timedelta(hours=18)
        delivered_at = eta + timedelta(days=3)

        in_transit_current = progress < 1.0
        arrival_current = progress >= 1.0 and arrived_seconds < 18 * 3600
        customs_current = arrived_seconds >= 18 * 3600 and arrived_seconds < 72 * 3600
        delivered_current = arrived_seconds >= 72 * 3600

        events = [
            TimelineEvent(
                status="DEPARTED_ORIGIN",
                location=profile["origin"]["name"],
                timestamp=departed,
                completed=True,
            ),
            TimelineEvent(
                status="IN_TRANSIT",
                location="At Sea",
                timestamp=now,
                completed=True,
                current=in_transit_current,
            ),
            TimelineEvent(
                status="ARRIVAL_AT_DESTINATION",
                location=profile["destination"]["name"],
                timestamp=eta,
                completed=progress >= 1.0,
                current=arrival_current,
                estimated=progress < 1.0,
            ),
            TimelineEvent(
                status="CUSTOMS_CLEARANCE",
                location=profile["destination"]["name"],
                timestamp=customs_at,
                completed=arrived_seconds >= 18 * 3600,
                current=customs_current,
                estimated=arrived_seconds < 18 * 3600,
            ),
            TimelineEvent(
                status="DELIVERED",
                location=f"{profile['destination']['name']} Warehouse",
                timestamp=delivered_at,
                completed=arrived_seconds >= 72 * 3600,
                current=delivered_current,
                estimated=arrived_seconds < 72 * 3600,
            ),
        ]

        return events

    async def _fetch_weather_snapshot(self, lat: float, lon: float) -> Optional[dict]:
        params = {
            "latitude": round(lat, 3),
            "longitude": round(lon, 3),
            "current": "wind_speed_10m,wind_direction_10m,wave_height",
        }

        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                response = await client.get(self.WEATHER_URL, params=params)
                response.raise_for_status()
                payload = response.json()
        except Exception:
            return None

        current = payload.get("current", {}) if isinstance(payload, dict) else {}
        if not isinstance(current, dict):
            return None

        wind_speed = current.get("wind_speed_10m")
        wave_height = current.get("wave_height")
        if wind_speed is None and wave_height is None:
            return None

        return {
            "wind_speed_10m": float(wind_speed) if wind_speed is not None else None,
            "wave_height": float(wave_height) if wave_height is not None else None,
            "wind_direction_10m": int(float(current.get("wind_direction_10m", 0))),
        }

    def _compute_delay_risk(self, route_risk: dict, weather_snapshot: Optional[dict]) -> str:
        score = 0
        status = str(route_risk.get("status", "CLEAR")).upper()
        if status == "BLOCKED":
            score += 3
        elif status == "WARNING":
            score += 2

        if weather_snapshot:
            wind = weather_snapshot.get("wind_speed_10m") or 0.0
            waves = weather_snapshot.get("wave_height") or 0.0
            if wind >= 55:
                score += 2
            elif wind >= 38:
                score += 1
            if waves >= 4.5:
                score += 2
            elif waves >= 2.8:
                score += 1

        if score >= 4:
            return "HIGH"
        if score >= 2:
            return "MEDIUM"
        return "LOW"

    def _compute_reliability_score(
        self,
        carrier: str,
        route_risk: dict,
        weather_snapshot: Optional[dict],
        delay_risk: str,
    ) -> int:
        base = {
            "COSCO": 84,
            "MSC": 82,
            "Maersk": 90,
            "Evergreen": 86,
            "CMA CGM": 84,
            "Hapag-Lloyd": 87,
            "ONE": 85,
            "ZIM": 81,
        }.get(carrier, 82)

        status = str(route_risk.get("status", "CLEAR")).upper()
        if status == "BLOCKED":
            base -= 18
        elif status == "WARNING":
            base -= 10

        if delay_risk == "HIGH":
            base -= 14
        elif delay_risk == "MEDIUM":
            base -= 8

        if weather_snapshot:
            wind = weather_snapshot.get("wind_speed_10m") or 0.0
            base -= min(8, int(wind // 12))

        return max(40, min(98, int(base)))

    def _generate_alerts(
        self,
        profile: dict,
        progress: float,
        route_risk: dict,
        weather_snapshot: Optional[dict],
        delay_risk: str,
        now: datetime,
    ) -> List[CargoAlert]:
        alerts: List[CargoAlert] = [
            CargoAlert(
                type="INFO",
                message=(
                    f"Tracking synced for lane {profile['origin']['country']} -> "
                    f"{profile['destination']['country']}"
                ),
                timestamp=now - timedelta(minutes=6),
            )
        ]

        status = str(route_risk.get("status", "CLEAR")).upper()
        if status in {"WARNING", "BLOCKED"}:
            alerts.append(
                CargoAlert(
                    type="WARNING",
                    message=str(
                        route_risk.get("details", "Geopolitical route watch triggered; monitor compliance requirements"),
                    ),
                    timestamp=now - timedelta(hours=2),
                )
            )

        if weather_snapshot:
            wind = weather_snapshot.get("wind_speed_10m") or 0.0
            waves = weather_snapshot.get("wave_height") or 0.0
            if wind >= 40 or waves >= 3.5:
                alerts.append(
                    CargoAlert(
                        type="WARNING",
                        message=(
                            "Marine weather advisory on current leg "
                            f"(wind {wind:.0f} km/h, waves {waves:.1f} m)."
                        ),
                        timestamp=now - timedelta(minutes=42),
                    )
                )

        if progress >= 0.9:
            alerts.append(
                CargoAlert(
                    type="INFO",
                    message="Shipment entering destination approach window; prepare destination documents.",
                    timestamp=now - timedelta(minutes=20),
                )
            )

        if delay_risk == "HIGH":
            alerts.append(
                CargoAlert(
                    type="CRITICAL",
                    message="High delay risk detected. Review ETA buffers and customer commitments.",
                    timestamp=now - timedelta(minutes=10),
                )
            )

        return alerts[:4]

    def _status_from_timeline(self, timeline: List[TimelineEvent]) -> str:
        current = next((event for event in timeline if event.current), None)
        if current:
            return current.status

        completed = [event for event in timeline if event.completed]
        if completed:
            return completed[-1].status

        return "IN_TRANSIT"

    def _haversine_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        radius = 6371.0
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        d_phi = math.radians(lat2 - lat1)
        d_lambda = math.radians(lon2 - lon1)

        a = (
            math.sin(d_phi / 2) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return radius * c

    def _bearing(self, lat1: float, lon1: float, lat2: float, lon2: float) -> int:
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        d_lambda = math.radians(lon2 - lon1)

        x = math.sin(d_lambda) * math.cos(phi2)
        y = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(d_lambda)
        bearing = math.degrees(math.atan2(x, y))
        return int((bearing + 360) % 360)


cargo_service = CargoService()
