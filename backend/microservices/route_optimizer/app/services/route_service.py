import logging
import math
from typing import Callable, Optional

import httpx
from pydantic import BaseModel

from ..algorithms.pareto import pareto_front_indices
from .emissions import calculate_emissions
from .port_data import port_service

logger = logging.getLogger(__name__)


class RouteRequest(BaseModel):
    origin_port: str
    destination_port: str
    cargo_weight_kg: float
    cargo_value_usd: float
    hs_code: Optional[str] = None
    origin_location: Optional[str] = None
    destination_location: Optional[str] = None


class Route(BaseModel):
    id: str
    name: str
    carrier: str
    transit_days: int
    cost_usd: float
    emissions_kg_co2: float
    congestion_risk: str
    recommended: bool
    savings: Optional[float] = None
    waypoints: list[dict]


class RouteService:
    """Calculate and compare shipping routes."""

    OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving"
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
    GEO_HEADERS = {
        "User-Agent": "tradeoptimize-route-optimizer/1.0 (hackathon-demo)"
    }

    # Known ports help bootstrap for common lanes without geocoding ambiguity.
    KNOWN_PORT_COORDS = {
        "CNSZX": {"lat": 22.5431, "lon": 114.0579, "label": "Yantian, Shenzhen", "country_code": "cn"},
        "USLAX": {"lat": 33.7701, "lon": -118.1937, "label": "Los Angeles", "country_code": "us"},
        "USLGB": {"lat": 33.7544, "lon": -118.2166, "label": "Long Beach", "country_code": "us"},
        "HKHKG": {"lat": 22.3193, "lon": 114.1694, "label": "Hong Kong", "country_code": "hk"},
        "SGSIN": {"lat": 1.2644, "lon": 103.8222, "label": "Singapore", "country_code": "sg"},
        "NLRTM": {"lat": 51.9244, "lon": 4.4777, "label": "Rotterdam", "country_code": "nl"},
        "DEHAM": {"lat": 53.5461, "lon": 9.9661, "label": "Hamburg", "country_code": "de"},
        "JPTYO": {"lat": 35.6167, "lon": 139.8000, "label": "Tokyo", "country_code": "jp"},
        "INNSA": {"lat": 18.9500, "lon": 72.9500, "label": "Nhava Sheva", "country_code": "in"},
        "AUMEL": {"lat": -37.8140, "lon": 144.9633, "label": "Melbourne", "country_code": "au"},
        "BRSSZ": {"lat": -23.9608, "lon": -46.3336, "label": "Santos", "country_code": "br"},
    }

    CARRIERS = {
        "COSCO": {"reliability": 0.85},
        "Evergreen": {"reliability": 0.88},
        "MSC": {"reliability": 0.82},
        "Maersk": {"reliability": 0.90},
        "Lufthansa Cargo": {"reliability": 0.91},
        "Emirates SkyCargo": {"reliability": 0.89},
        "RoadLink": {"reliability": 0.80},
        "FastFreight": {"reliability": 0.84},
        "EcoTransit": {"reliability": 0.86},
        "PrimeLogix": {"reliability": 0.83},
        "DHL Global Forwarding": {"reliability": 0.90},
    }

    ROAD_CARRIERS = ["RoadLink", "FastFreight", "EcoTransit", "PrimeLogix"]

    TRANSHIPMENT_HUBS = [
        {"label": "Singapore", "lat": 1.3521, "lon": 103.8198},
        {"label": "Dubai", "lat": 25.2048, "lon": 55.2708},
        {"label": "Rotterdam", "lat": 51.9244, "lon": 4.4777},
        {"label": "Panama City", "lat": 8.9833, "lon": -79.5167},
        {"label": "Hong Kong", "lat": 22.3193, "lon": 114.1694},
    ]

    async def compare_routes(self, request: RouteRequest) -> list[Route]:
        """Compare available routes for given shipment using live web APIs."""
        origin_query = (request.origin_location or request.origin_port or "").strip()
        destination_query = (request.destination_location or request.destination_port or "").strip()
        if not origin_query or not destination_query:
            return []

        origin = await self._resolve_endpoint(origin_query, request.origin_port)
        destination = await self._resolve_endpoint(destination_query, request.destination_port)
        if origin is None or destination is None:
            return []

        routes: list[Route] = []
        routes.extend(await self._build_sea_routes(request, origin, destination))
        routes.extend(await self._build_multimodal_routes(request, origin, destination))
        routes.extend(self._build_air_routes(request, origin, destination))
        routes.extend(await self._build_road_routes(request, origin, destination))

        routes = self._dedupe_route_ids(routes)
        if not routes:
            routes = self._build_distance_fallback_routes(request, origin, destination)

        self._attach_savings(routes)
        return self._mark_recommended(routes, request)

    async def _build_road_routes(self, request: RouteRequest, origin: dict, destination: dict) -> list[Route]:
        osrm_routes = await self._fetch_osrm_routes(origin, destination)
        if not osrm_routes:
            return []

        road_routes: list[Route] = []
        labels = ["Road Freight - Fastest", "Road Freight - Balanced", "Road Freight - Economy"]

        for idx, route_data in enumerate(osrm_routes[:3]):
            distance_m = float(route_data.get("distance", 0.0))
            duration_s = float(route_data.get("duration", 0.0))
            if distance_m <= 0 or duration_s <= 0:
                continue

            distance_km = distance_m / 1000
            duration_hours = duration_s / 3600
            transit_days = max(1, int(math.ceil(duration_hours / 10.0)))
            total_cost = self._estimate_road_cost(distance_km, request.cargo_weight_kg, idx)
            emissions = calculate_emissions(
                request.cargo_weight_kg,
                "truck",
                transit_days,
                distance_km=distance_km,
            )

            avg_speed_kmh = distance_km / max(duration_hours, 0.1)
            road_routes.append(
                Route(
                    id=f"road_{idx + 1}",
                    name=labels[idx % len(labels)],
                    carrier=self.ROAD_CARRIERS[idx % len(self.ROAD_CARRIERS)],
                    transit_days=transit_days,
                    cost_usd=round(total_cost, 2),
                    emissions_kg_co2=round(emissions, 2),
                    congestion_risk=self._speed_to_risk(avg_speed_kmh),
                    recommended=False,
                    waypoints=self._build_waypoints(route_data, origin["label"], destination["label"]),
                )
            )

        return road_routes

    def _build_air_routes(self, request: RouteRequest, origin: dict, destination: dict) -> list[Route]:
        distance_km = self._haversine_km(origin["lat"], origin["lon"], destination["lat"], destination["lon"]) * 1.08
        tons = max(request.cargo_weight_kg / 1000, 0.1)

        economy_cost = 240 + (distance_km * tons * 0.66)
        express_cost = 320 + (distance_km * tons * 0.80)

        economy_days = max(1, int(math.ceil(distance_km / 6000))) + 1
        express_days = max(1, int(math.ceil(distance_km / 7500)))

        midpoint = self._midpoint(origin, destination)

        return [
            Route(
                id="air_economy",
                name="Air Freight - Economy",
                carrier="Lufthansa Cargo",
                transit_days=economy_days,
                cost_usd=round(economy_cost, 2),
                emissions_kg_co2=round(
                    calculate_emissions(
                        request.cargo_weight_kg,
                        "air",
                        economy_days,
                        distance_km=distance_km,
                    ),
                    2,
                ),
                congestion_risk=self._distance_to_risk(distance_km, high_threshold=12000),
                recommended=False,
                waypoints=[
                    {"lat": origin["lat"], "lon": origin["lon"], "name": origin["label"]},
                    midpoint,
                    {"lat": destination["lat"], "lon": destination["lon"], "name": destination["label"]},
                ],
            ),
            Route(
                id="air_express",
                name="Air Freight - Express",
                carrier="Emirates SkyCargo",
                transit_days=express_days,
                cost_usd=round(express_cost, 2),
                emissions_kg_co2=round(
                    calculate_emissions(
                        request.cargo_weight_kg,
                        "air",
                        express_days,
                        distance_km=distance_km * 1.03,
                    ),
                    2,
                ),
                congestion_risk=self._distance_to_risk(distance_km * 1.03, high_threshold=14000),
                recommended=False,
                waypoints=[
                    {"lat": origin["lat"], "lon": origin["lon"], "name": origin["label"]},
                    midpoint,
                    {"lat": destination["lat"], "lon": destination["lon"], "name": destination["label"]},
                ],
            ),
        ]

    async def _build_sea_routes(self, request: RouteRequest, origin: dict, destination: dict) -> list[Route]:
        origin_gateway = await self._resolve_sea_gateway(origin)
        destination_gateway = await self._resolve_sea_gateway(destination)

        road_to_port_km = await self._road_distance_km(origin, origin_gateway)
        road_from_port_km = await self._road_distance_km(destination_gateway, destination)
        ocean_distance_km = self._haversine_km(
            origin_gateway["lat"],
            origin_gateway["lon"],
            destination_gateway["lat"],
            destination_gateway["lon"],
        ) * 1.22

        tons = max(request.cargo_weight_kg / 1000, 0.1)

        origin_congestion = await self._resolve_port_congestion(origin_gateway, request.origin_port)
        destination_congestion = await self._resolve_port_congestion(destination_gateway, request.destination_port)
        avg_wait_days = float(origin_congestion.get("avg_wait_days", 1.0)) + float(destination_congestion.get("avg_wait_days", 1.0))

        direct_transit_days = max(2, int(math.ceil((road_to_port_km + road_from_port_km) / 700 + ocean_distance_km / 760 + avg_wait_days)))
        direct_cost = (
            310
            + (road_to_port_km + road_from_port_km) * tons * 0.11
            + ocean_distance_km * tons * 0.14
            + avg_wait_days * 38
        )
        direct_emissions = (
            calculate_emissions(request.cargo_weight_kg, "truck", direct_transit_days, distance_km=road_to_port_km + road_from_port_km)
            + calculate_emissions(request.cargo_weight_kg, "ocean", direct_transit_days, distance_km=ocean_distance_km)
        )

        sea_routes = [
            Route(
                id="sea_direct",
                name="Direct Sea Freight",
                carrier="COSCO",
                transit_days=direct_transit_days,
                cost_usd=round(direct_cost, 2),
                emissions_kg_co2=round(direct_emissions, 2),
                congestion_risk=self._congestion_to_risk(
                    max(
                        int(origin_congestion.get("utilization", 70)),
                        int(destination_congestion.get("utilization", 70)),
                    )
                ),
                recommended=False,
                waypoints=self._compact_waypoints(
                    [
                        {"lat": origin["lat"], "lon": origin["lon"], "name": origin["label"]},
                        {"lat": origin_gateway["lat"], "lon": origin_gateway["lon"], "name": origin_gateway["label"]},
                        {"lat": destination_gateway["lat"], "lon": destination_gateway["lon"], "name": destination_gateway["label"]},
                        {"lat": destination["lat"], "lon": destination["lon"], "name": destination["label"]},
                    ]
                ),
            )
        ]

        hub = self._pick_transshipment_hub(origin_gateway, destination_gateway)
        if hub is not None:
            ocean_leg_1 = self._haversine_km(origin_gateway["lat"], origin_gateway["lon"], hub["lat"], hub["lon"]) * 1.18
            ocean_leg_2 = self._haversine_km(hub["lat"], hub["lon"], destination_gateway["lat"], destination_gateway["lon"]) * 1.18
            via_hub_days = max(
                3,
                int(math.ceil((road_to_port_km + road_from_port_km) / 700 + (ocean_leg_1 + ocean_leg_2) / 730 + avg_wait_days + 1.5)),
            )
            via_hub_cost = (
                370
                + (road_to_port_km + road_from_port_km) * tons * 0.11
                + (ocean_leg_1 + ocean_leg_2) * tons * 0.128
                + avg_wait_days * 42
                + 145
            )
            via_hub_emissions = (
                calculate_emissions(
                    request.cargo_weight_kg,
                    "truck",
                    via_hub_days,
                    distance_km=road_to_port_km + road_from_port_km,
                )
                + calculate_emissions(
                    request.cargo_weight_kg,
                    "ocean",
                    via_hub_days,
                    distance_km=ocean_leg_1 + ocean_leg_2,
                )
            )
            sea_routes.append(
                Route(
                    id="sea_transship",
                    name=f"Sea Freight via {hub['label']}",
                    carrier="Evergreen",
                    transit_days=via_hub_days,
                    cost_usd=round(via_hub_cost, 2),
                    emissions_kg_co2=round(via_hub_emissions, 2),
                    congestion_risk=self._distance_to_risk(ocean_leg_1 + ocean_leg_2, high_threshold=15000),
                    recommended=False,
                    waypoints=self._compact_waypoints(
                        [
                            {"lat": origin["lat"], "lon": origin["lon"], "name": origin["label"]},
                            {"lat": origin_gateway["lat"], "lon": origin_gateway["lon"], "name": origin_gateway["label"]},
                            {"lat": hub["lat"], "lon": hub["lon"], "name": hub["label"]},
                            {"lat": destination_gateway["lat"], "lon": destination_gateway["lon"], "name": destination_gateway["label"]},
                            {"lat": destination["lat"], "lon": destination["lon"], "name": destination["label"]},
                        ]
                    ),
                )
            )

        return sea_routes

    async def _build_multimodal_routes(self, request: RouteRequest, origin: dict, destination: dict) -> list[Route]:
        origin_gateway = await self._resolve_sea_gateway(origin)
        hub = self._pick_transshipment_hub(origin_gateway, destination)
        if hub is None:
            return []

        road_km = await self._road_distance_km(origin, origin_gateway)
        sea_km = self._haversine_km(origin_gateway["lat"], origin_gateway["lon"], hub["lat"], hub["lon"]) * 1.16
        air_km = self._haversine_km(hub["lat"], hub["lon"], destination["lat"], destination["lon"]) * 1.08
        tons = max(request.cargo_weight_kg / 1000, 0.1)

        transit_days = max(2, int(math.ceil(road_km / 700 + sea_km / 760 + air_km / 7200 + 1.25)))
        cost = 390 + road_km * tons * 0.11 + sea_km * tons * 0.126 + air_km * tons * 0.58
        emissions = (
            calculate_emissions(request.cargo_weight_kg, "truck", transit_days, distance_km=road_km)
            + calculate_emissions(request.cargo_weight_kg, "ocean", transit_days, distance_km=sea_km)
            + calculate_emissions(request.cargo_weight_kg, "air", transit_days, distance_km=air_km)
        )

        return [
            Route(
                id="multi_sea_air",
                name=f"Multimodal Sea + Air via {hub['label']}",
                carrier="DHL Global Forwarding",
                transit_days=transit_days,
                cost_usd=round(cost, 2),
                emissions_kg_co2=round(emissions, 2),
                congestion_risk=self._distance_to_risk(sea_km + air_km, high_threshold=14000),
                recommended=False,
                waypoints=self._compact_waypoints(
                    [
                        {"lat": origin["lat"], "lon": origin["lon"], "name": origin["label"]},
                        {"lat": origin_gateway["lat"], "lon": origin_gateway["lon"], "name": origin_gateway["label"]},
                        {"lat": hub["lat"], "lon": hub["lon"], "name": hub["label"]},
                        {"lat": destination["lat"], "lon": destination["lon"], "name": destination["label"]},
                    ]
                ),
            )
        ]

    def _build_distance_fallback_routes(self, request: RouteRequest, origin: dict, destination: dict) -> list[Route]:
        """Fallback that is still dynamic by geocoded distance."""
        distance_km = self._haversine_km(origin["lat"], origin["lon"], destination["lat"], destination["lon"])
        tons = max(request.cargo_weight_kg / 1000, 0.1)

        sea_days = max(3, int(math.ceil(distance_km * 1.2 / 760)))
        sea_cost = 300 + distance_km * 1.2 * tons * 0.14

        air_days = max(1, int(math.ceil(distance_km * 1.08 / 7000)))
        air_cost = 260 + distance_km * 1.08 * tons * 0.68

        return [
            Route(
                id="sea_direct",
                name="Direct Sea Freight",
                carrier="COSCO",
                transit_days=sea_days,
                cost_usd=round(sea_cost, 2),
                emissions_kg_co2=round(calculate_emissions(request.cargo_weight_kg, "ocean", sea_days, distance_km=distance_km * 1.2), 2),
                congestion_risk=self._distance_to_risk(distance_km, high_threshold=14000),
                recommended=False,
                waypoints=self._compact_waypoints(
                    [
                        {"lat": origin["lat"], "lon": origin["lon"], "name": origin["label"]},
                        {"lat": destination["lat"], "lon": destination["lon"], "name": destination["label"]},
                    ]
                ),
            ),
            Route(
                id="air_economy",
                name="Air Freight - Economy",
                carrier="Lufthansa Cargo",
                transit_days=air_days,
                cost_usd=round(air_cost, 2),
                emissions_kg_co2=round(calculate_emissions(request.cargo_weight_kg, "air", air_days, distance_km=distance_km * 1.08), 2),
                congestion_risk=self._distance_to_risk(distance_km, high_threshold=12000),
                recommended=False,
                waypoints=self._compact_waypoints(
                    [
                        {"lat": origin["lat"], "lon": origin["lon"], "name": origin["label"]},
                        {"lat": destination["lat"], "lon": destination["lon"], "name": destination["label"]},
                    ]
                ),
            ),
        ]

    async def _resolve_endpoint(self, query: str, port_code: str) -> Optional[dict]:
        code = str(port_code or "").strip().upper()
        if code in self.KNOWN_PORT_COORDS:
            known = self.KNOWN_PORT_COORDS[code]
            return {
                "lat": known["lat"],
                "lon": known["lon"],
                "label": known["label"],
                "country_code": known.get("country_code"),
            }
        return await self._geocode_location(query)

    async def _geocode_location(self, query: str) -> Optional[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.NOMINATIM_URL,
                params={
                    "q": query,
                    "format": "jsonv2",
                    "addressdetails": 1,
                    "limit": 1,
                },
                headers=self.GEO_HEADERS,
                timeout=8.0,
                follow_redirects=True,
            )
            response.raise_for_status()
            payload = response.json()
            if not isinstance(payload, list) or not payload:
                return None

            top = payload[0]
            lat = float(top.get("lat"))
            lon = float(top.get("lon"))
            display_name = str(top.get("display_name", query))
            label = display_name.split(",")[0].strip() or query
            address = top.get("address", {}) if isinstance(top.get("address", {}), dict) else {}
            country_code = str(address.get("country_code", "")).lower() or None
            return {
                "lat": lat,
                "lon": lon,
                "label": label,
                "country_code": country_code,
            }

    async def _resolve_sea_gateway(self, endpoint: dict) -> dict:
        location = endpoint.get("label", "")
        queries = [
            f"major seaport near {location}",
            f"container port {location}",
            f"harbor {location}",
        ]

        for query in queries:
            try:
                candidate = await self._geocode_location(query)
                if candidate is None:
                    continue
                gap = self._haversine_km(endpoint["lat"], endpoint["lon"], candidate["lat"], candidate["lon"])
                if gap <= 1200:
                    return candidate
            except Exception:
                continue

        return endpoint

    async def _resolve_port_congestion(self, endpoint: dict, fallback_port_code: str) -> dict:
        fallback_code = str(fallback_port_code or "").upper()
        if fallback_code in self.KNOWN_PORT_COORDS:
            return await port_service.get_congestion(fallback_code)

        closest_code = None
        closest_km = float("inf")
        for code, data in self.KNOWN_PORT_COORDS.items():
            km = self._haversine_km(endpoint["lat"], endpoint["lon"], data["lat"], data["lon"])
            if km < closest_km:
                closest_km = km
                closest_code = code

        if closest_code and closest_km <= 420:
            return await port_service.get_congestion(closest_code)

        return {
            "utilization": 68,
            "avg_wait_days": 1.2,
            "status": "MEDIUM",
        }

    async def _road_distance_km(self, origin: dict, destination: dict) -> float:
        linear_km = self._haversine_km(origin["lat"], origin["lon"], destination["lat"], destination["lon"])
        if linear_km <= 15:
            return linear_km

        osrm_routes = await self._fetch_osrm_routes(origin, destination)
        if osrm_routes:
            distance_m = float(osrm_routes[0].get("distance", 0.0))
            if distance_m > 0:
                return distance_m / 1000

        return linear_km * 1.25

    async def _fetch_osrm_routes(self, origin: dict, destination: dict) -> list[dict]:
        coords = f"{origin['lon']},{origin['lat']};{destination['lon']},{destination['lat']}"
        url = f"{self.OSRM_BASE_URL}/{coords}"
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                params={
                    "alternatives": "true",
                    "overview": "full",
                    "geometries": "geojson",
                    "steps": "false",
                },
                timeout=12.0,
                follow_redirects=True,
            )
            response.raise_for_status()
            payload = response.json()
            waypoints = payload.get("waypoints", []) if isinstance(payload, dict) else []
            if isinstance(waypoints, list):
                for point in waypoints:
                    if not isinstance(point, dict):
                        continue
                    snapped_distance = float(point.get("distance", 0.0))
                    # OSRM public dataset can snap extremely far when lane isn't routable.
                    if snapped_distance > 50000:
                        return []

            routes = payload.get("routes", []) if isinstance(payload, dict) else []
            return routes if isinstance(routes, list) else []

    def _build_waypoints(self, route_data: dict, origin_label: str, destination_label: str) -> list[dict]:
        geometry = route_data.get("geometry", {})
        coordinates = geometry.get("coordinates", []) if isinstance(geometry, dict) else []
        if not isinstance(coordinates, list) or len(coordinates) < 2:
            return [
                {"name": origin_label},
                {"name": destination_label},
            ]

        sampled = self._sample_coordinates(coordinates)
        waypoints = []
        for idx, (lon, lat) in enumerate(sampled):
            if idx == 0:
                name = origin_label
            elif idx == len(sampled) - 1:
                name = destination_label
            else:
                name = f"Route Point {idx}"
            waypoints.append({"lat": float(lat), "lon": float(lon), "name": name})
        return waypoints

    def _sample_coordinates(self, coordinates: list) -> list[tuple[float, float]]:
        if len(coordinates) <= 6:
            return [
                (float(point[0]), float(point[1]))
                for point in coordinates
                if isinstance(point, list) and len(point) >= 2
            ]

        indexes = [
            0,
            len(coordinates) // 4,
            len(coordinates) // 2,
            (3 * len(coordinates)) // 4,
            len(coordinates) - 1,
        ]
        unique: list[tuple[float, float]] = []
        seen = set()
        for idx in indexes:
            point = coordinates[idx]
            if not isinstance(point, list) or len(point) < 2:
                continue
            key = (round(float(point[0]), 5), round(float(point[1]), 5))
            if key in seen:
                continue
            seen.add(key)
            unique.append((float(point[0]), float(point[1])))
        return unique

    def _estimate_road_cost(self, distance_km: float, cargo_weight_kg: float, route_index: int) -> float:
        tons = max(cargo_weight_kg / 1000, 0.1)
        base_cost = 140 + (distance_km * tons * 0.12)
        service_factor = [1.09, 1.00, 0.93, 0.88][route_index % 4]
        return base_cost * service_factor

    def _speed_to_risk(self, avg_speed_kmh: float) -> str:
        if avg_speed_kmh < 35:
            return "HIGH"
        if avg_speed_kmh < 55:
            return "MEDIUM"
        return "LOW"

    def _distance_to_risk(self, distance_km: float, high_threshold: float) -> str:
        if distance_km >= high_threshold:
            return "HIGH"
        if distance_km >= high_threshold * 0.65:
            return "MEDIUM"
        return "LOW"

    def _congestion_to_risk(self, utilization: int) -> str:
        if utilization >= 82:
            return "HIGH"
        if utilization >= 62:
            return "MEDIUM"
        return "LOW"

    def _midpoint(self, origin: dict, destination: dict) -> dict:
        return {
            "lat": round((origin["lat"] + destination["lat"]) / 2, 6),
            "lon": round((origin["lon"] + destination["lon"]) / 2, 6),
            "name": "Midpoint",
        }

    def _pick_transshipment_hub(self, origin: dict, destination: dict) -> Optional[dict]:
        best_hub = None
        best_km = float("inf")
        for hub in self.TRANSHIPMENT_HUBS:
            km = (
                self._haversine_km(origin["lat"], origin["lon"], hub["lat"], hub["lon"])
                + self._haversine_km(hub["lat"], hub["lon"], destination["lat"], destination["lon"])
            )
            if km < best_km:
                best_km = km
                best_hub = hub
        return best_hub

    def _compact_waypoints(self, waypoints: list[dict]) -> list[dict]:
        compacted = []
        seen = set()
        for wp in waypoints:
            lat = float(wp["lat"])
            lon = float(wp["lon"])
            key = (round(lat, 4), round(lon, 4))
            if key in seen:
                continue
            seen.add(key)
            compacted.append({"lat": lat, "lon": lon, "name": wp["name"]})
        return compacted

    def _dedupe_route_ids(self, routes: list[Route]) -> list[Route]:
        seen: set[str] = set()
        unique_routes: list[Route] = []
        for route in routes:
            if route.id in seen:
                continue
            seen.add(route.id)
            unique_routes.append(route)
        return unique_routes

    def _attach_savings(self, routes: list[Route]) -> None:
        if not routes:
            return

        baseline = next((route.cost_usd for route in routes if route.id == "sea_direct"), routes[0].cost_usd)
        for route in routes:
            if route.cost_usd < baseline:
                route.savings = round(baseline - route.cost_usd, 2)
            else:
                route.savings = None

    def _haversine_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
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

    def _mark_recommended(self, routes: list[Route], request: RouteRequest) -> list[Route]:
        """Mark a Pareto-optimal route as recommended."""
        if not routes:
            return routes

        objective_funcs = [
            lambda route: route.cost_usd,
            lambda route: float(route.transit_days),
            lambda route: route.emissions_kg_co2,
            lambda route: float(self._risk_score(route.congestion_risk)),
            lambda route: self._reliability_penalty(route.carrier),
        ]

        pareto_indices = pareto_front_indices(routes, objective_funcs)
        best_idx = self._pick_balanced_best(routes, pareto_indices, objective_funcs, request)

        routes[best_idx].recommended = True
        return routes

    def _pick_balanced_best(
        self,
        routes: list[Route],
        candidate_indices: list[int],
        objective_funcs: list[Callable[[Route], float]],
        request: RouteRequest,
    ) -> int:
        if not candidate_indices:
            return 0
        if len(candidate_indices) == 1:
            return candidate_indices[0]

        objective_values: list[list[float]] = []
        for idx in candidate_indices:
            objective_values.append([float(fn(routes[idx])) for fn in objective_funcs])

        mins = [min(values[i] for values in objective_values) for i in range(len(objective_funcs))]
        maxs = [max(values[i] for values in objective_values) for i in range(len(objective_funcs))]

        cargo_value_per_kg = 0.0
        if request.cargo_weight_kg > 0:
            cargo_value_per_kg = request.cargo_value_usd / request.cargo_weight_kg

        # Default SMB profile: prioritize cost, then time, then emissions.
        weights = [0.42, 0.26, 0.20, 0.08, 0.04]

        # Shift modestly toward time/reliability for high-value cargo.
        if cargo_value_per_kg >= 120:
            weights = [0.34, 0.32, 0.18, 0.08, 0.08]
        elif cargo_value_per_kg >= 60:
            weights = [0.38, 0.29, 0.19, 0.08, 0.06]

        best_idx = candidate_indices[0]
        best_score = float("inf")

        for local_idx, route_idx in enumerate(candidate_indices):
            normalized_score = 0.0
            for dim, weight in enumerate(weights):
                spread = maxs[dim] - mins[dim]
                raw_value = objective_values[local_idx][dim]
                normalized = 0.0 if spread <= 0 else (raw_value - mins[dim]) / spread
                normalized_score += weight * normalized
            if normalized_score < best_score:
                best_score = normalized_score
                best_idx = route_idx

        return best_idx

    def _risk_score(self, risk: str) -> int:
        if risk == "HIGH":
            return 2
        if risk == "MEDIUM":
            return 1
        return 0

    def _reliability_penalty(self, carrier: str) -> float:
        reliability = self.CARRIERS.get(carrier, {}).get("reliability", 0.82)
        return 1 - reliability


route_service = RouteService()
