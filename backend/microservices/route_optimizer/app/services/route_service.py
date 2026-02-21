from typing import Optional

from pydantic import BaseModel

from ..algorithms.pareto import pareto_front_indices, select_best_index
from .emissions import calculate_emissions
from .port_data import port_service


class RouteRequest(BaseModel):
    origin_port: str
    destination_port: str
    cargo_weight_kg: float
    cargo_value_usd: float
    hs_code: Optional[str] = None


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

    CARRIERS = {
        "COSCO": {"base_rate": 0.12, "reliability": 0.85},
        "Evergreen": {"base_rate": 0.11, "reliability": 0.88},
        "MSC": {"base_rate": 0.10, "reliability": 0.82},
        "Maersk": {"base_rate": 0.13, "reliability": 0.90},
    }

    ROUTES = [
        {
            "id": "direct_sea",
            "name": "Direct Sea Freight",
            "mode": "ocean",
            "base_days": 18,
            "base_cost_per_kg": 1.50,
        },
        {
            "id": "via_transship",
            "name": "Via Transshipment Hub",
            "mode": "ocean",
            "base_days": 22,
            "base_cost_per_kg": 1.20,
        },
        {
            "id": "express_air",
            "name": "Express Air Freight",
            "mode": "air",
            "base_days": 4,
            "base_cost_per_kg": 6.50,
        },
    ]

    async def compare_routes(self, request: RouteRequest) -> list[Route]:
        """Compare available routes for given shipment."""
        routes: list[Route] = []
        baseline_cost: float | None = None

        for i, route_template in enumerate(self.ROUTES):
            dest_congestion = await port_service.get_congestion(request.destination_port)

            base_cost = route_template["base_cost_per_kg"] * request.cargo_weight_kg
            congestion_multiplier = 1 + (dest_congestion.get("utilization", 70) / 200)
            total_cost = base_cost * congestion_multiplier

            transit_days = route_template["base_days"]
            if dest_congestion.get("utilization", 70) > 80:
                transit_days += int((dest_congestion["utilization"] - 80) / 10)

            emissions = calculate_emissions(
                request.cargo_weight_kg,
                route_template["mode"],
                transit_days,
            )

            util = dest_congestion.get("utilization", 70)
            congestion_risk = "HIGH" if util > 80 else "MEDIUM" if util > 60 else "LOW"

            if i == 0:
                baseline_cost = total_cost

            carrier = list(self.CARRIERS.keys())[i % len(self.CARRIERS)]

            route = Route(
                id=route_template["id"],
                name=route_template["name"],
                carrier=carrier,
                transit_days=transit_days,
                cost_usd=round(total_cost, 2),
                emissions_kg_co2=round(emissions, 2),
                congestion_risk=congestion_risk,
                recommended=False,
                savings=round(baseline_cost - total_cost, 2)
                if baseline_cost and total_cost < baseline_cost
                else None,
                waypoints=[
                    {"port": request.origin_port, "type": "origin"},
                    {"port": request.destination_port, "type": "destination"},
                ],
            )
            routes.append(route)

        return self._mark_recommended(routes)

    def _mark_recommended(self, routes: list[Route]) -> list[Route]:
        """Mark a Pareto-optimal route as recommended."""
        if not routes:
            return routes

        objectives = [
            lambda route: route.cost_usd,
            lambda route: route.transit_days,
            lambda route: route.emissions_kg_co2,
            lambda route: self._risk_score(route.congestion_risk),
            lambda route: self._reliability_penalty(route.carrier),
        ]

        pareto_indices = pareto_front_indices(routes, objectives)
        weights = [1 / 1000, 50, 1 / 100, 200, 500]
        best_idx = select_best_index(routes, pareto_indices, objectives, weights)

        routes[best_idx].recommended = True
        return routes

    def _risk_score(self, risk: str) -> int:
        if risk == "HIGH":
            return 2
        if risk == "MEDIUM":
            return 1
        return 0

    def _reliability_penalty(self, carrier: str) -> float:
        reliability = self.CARRIERS.get(carrier, {}).get("reliability", 0.85)
        return 1 - reliability


route_service = RouteService()
