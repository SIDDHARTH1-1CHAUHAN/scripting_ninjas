from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import random


class Position(BaseModel):
    latitude: float
    longitude: float
    location_name: str
    speed_knots: float
    heading: int
    timestamp: datetime


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


class CargoService:
    """Cargo tracking service with simulated real-time data"""

    # Demo shipments database
    DEMO_SHIPMENTS = {
        "TCLU1234567": {
            "container_id": "TCLU1234567",
            "bill_of_lading": "COSCO2024SZX0815",
            "vessel": "CSCL Saturn",
            "voyage": "034W",
            "carrier": "COSCO Shipping",
            "origin_port": "Yantian, Shenzhen",
            "origin_country": "CN",
            "destination_port": "Long Beach, CA",
            "destination_country": "US",
            "cargo_description": "Solar Portable Chargers",
            "hs_code": "8504.40.95",
            "weight_kg": 1250,
            "value_usd": 62500,
            "route": [
                {"lat": 22.5431, "lon": 114.0579, "name": "Yantian Port"},
                {"lat": 21.3069, "lon": 121.5, "name": "Taiwan Strait"},
                {"lat": 25.0, "lon": 140.0, "name": "Pacific Ocean"},
                {"lat": 30.0, "lon": -150.0, "name": "Mid-Pacific"},
                {"lat": 33.7701, "lon": -118.1937, "name": "Long Beach Port"},
            ],
            "transit_days": 18,
        },
        "MSCU9876543": {
            "container_id": "MSCU9876543",
            "bill_of_lading": "MSC2024HKG0922",
            "vessel": "MSC Oscar",
            "voyage": "AE7-WEST",
            "carrier": "MSC",
            "origin_port": "Hong Kong",
            "origin_country": "HK",
            "destination_port": "Rotterdam",
            "destination_country": "NL",
            "cargo_description": "Electronics Components",
            "hs_code": "8542.31.00",
            "weight_kg": 2400,
            "value_usd": 185000,
            "route": [
                {"lat": 22.3193, "lon": 114.1694, "name": "Hong Kong Port"},
                {"lat": 10.0, "lon": 100.0, "name": "South China Sea"},
                {"lat": 5.0, "lon": 80.0, "name": "Indian Ocean"},
                {"lat": 12.0, "lon": 45.0, "name": "Gulf of Aden"},
                {"lat": 30.0, "lon": 32.0, "name": "Suez Canal"},
                {"lat": 36.0, "lon": 5.0, "name": "Mediterranean Sea"},
                {"lat": 51.9244, "lon": 4.4777, "name": "Rotterdam Port"},
            ],
            "transit_days": 28,
        },
        "EGLV5551234": {
            "container_id": "EGLV5551234",
            "bill_of_lading": "EVG2024TPE0301",
            "vessel": "Ever Given",
            "voyage": "1234E",
            "carrier": "Evergreen Marine",
            "origin_port": "Kaohsiung",
            "origin_country": "TW",
            "destination_port": "Los Angeles",
            "destination_country": "US",
            "cargo_description": "Semiconductor Equipment",
            "hs_code": "8486.20.00",
            "weight_kg": 890,
            "value_usd": 450000,
            "route": [
                {"lat": 22.6273, "lon": 120.3014, "name": "Kaohsiung Port"},
                {"lat": 28.0, "lon": 140.0, "name": "Pacific Ocean"},
                {"lat": 33.9425, "lon": -118.4081, "name": "Los Angeles Port"},
            ],
            "transit_days": 14,
        },
    }

    async def track_shipment(self, container_id: str) -> Optional[CargoTrackingResult]:
        """Track a shipment by container ID"""

        # Check if it's a demo shipment
        shipment_data = self.DEMO_SHIPMENTS.get(container_id.upper())

        if not shipment_data:
            # Generate random shipment for any container ID
            shipment_data = self._generate_random_shipment(container_id)

        # Calculate current position based on simulated transit
        departed = datetime.utcnow() - timedelta(days=random.randint(5, 15))
        eta = departed + timedelta(days=shipment_data["transit_days"])

        progress = self._calculate_progress(departed, eta)
        current_position = self._interpolate_position(shipment_data["route"], progress)

        # Build timeline
        timeline = self._build_timeline(departed, eta, progress, shipment_data)

        # Generate alerts
        alerts = self._generate_alerts(progress, shipment_data)

        return CargoTrackingResult(
            shipment=ShipmentDetails(
                container_id=shipment_data["container_id"],
                bill_of_lading=shipment_data["bill_of_lading"],
                vessel=shipment_data["vessel"],
                voyage=shipment_data["voyage"],
                carrier=shipment_data["carrier"],
                origin_port=shipment_data["origin_port"],
                origin_country=shipment_data["origin_country"],
                destination_port=shipment_data["destination_port"],
                destination_country=shipment_data["destination_country"],
                departed=departed,
                eta=eta,
                cargo_description=shipment_data["cargo_description"],
                hs_code=shipment_data["hs_code"],
                weight_kg=shipment_data["weight_kg"],
                value_usd=shipment_data["value_usd"],
            ),
            current_position=current_position,
            timeline=timeline,
            alerts=alerts,
            progress_percent=int(progress * 100),
        )

    async def get_all_shipments(self) -> List[dict]:
        """Get all tracked shipments (demo data)"""
        shipments = []
        for container_id in self.DEMO_SHIPMENTS.keys():
            result = await self.track_shipment(container_id)
            shipments.append(
                {
                    "container_id": result.shipment.container_id,
                    "vessel": result.shipment.vessel,
                    "origin": result.shipment.origin_port,
                    "destination": result.shipment.destination_port,
                    "eta": result.shipment.eta.isoformat(),
                    "progress_percent": result.progress_percent,
                    "status": self._get_status_from_progress(result.progress_percent),
                }
            )
        return shipments

    async def search_shipments(self, query: str) -> List[dict]:
        """Search shipments by container ID, B/L, or vessel"""
        query_upper = query.upper()
        results = []

        for container_id, data in self.DEMO_SHIPMENTS.items():
            if (
                query_upper in container_id
                or query_upper in data["bill_of_lading"].upper()
                or query_upper in data["vessel"].upper()
            ):
                result = await self.track_shipment(container_id)
                results.append(
                    {
                        "container_id": result.shipment.container_id,
                        "bill_of_lading": result.shipment.bill_of_lading,
                        "vessel": result.shipment.vessel,
                        "status": self._get_status_from_progress(
                            result.progress_percent
                        ),
                    }
                )

        return results

    def _calculate_progress(self, departed: datetime, eta: datetime) -> float:
        """Calculate transit progress (0.0 to 1.0)"""
        now = datetime.utcnow()
        total_duration = (eta - departed).total_seconds()
        elapsed = (now - departed).total_seconds()
        progress = elapsed / total_duration if total_duration > 0 else 0
        return max(0.0, min(1.0, progress))

    def _interpolate_position(self, route: List[dict], progress: float) -> Position:
        """Interpolate current position along route"""
        if progress <= 0:
            point = route[0]
        elif progress >= 1:
            point = route[-1]
        else:
            # Find which segment we're on
            segment_progress = progress * (len(route) - 1)
            segment_index = int(segment_progress)
            segment_fraction = segment_progress - segment_index

            if segment_index >= len(route) - 1:
                point = route[-1]
            else:
                p1 = route[segment_index]
                p2 = route[segment_index + 1]

                # Linear interpolation
                lat = p1["lat"] + (p2["lat"] - p1["lat"]) * segment_fraction
                lon = p1["lon"] + (p2["lon"] - p1["lon"]) * segment_fraction

                # Determine location name
                if segment_fraction < 0.3:
                    name = f"Near {p1['name']}"
                elif segment_fraction > 0.7:
                    name = f"Approaching {p2['name']}"
                else:
                    name = f"Between {p1['name']} and {p2['name']}"

                point = {"lat": lat, "lon": lon, "name": name}

        # Calculate heading (simplified)
        heading = random.randint(0, 359)

        return Position(
            latitude=round(point.get("lat", point["lat"]), 4),
            longitude=round(point.get("lon", point["lon"]), 4),
            location_name=point.get("name", "At Sea"),
            speed_knots=round(random.uniform(14.0, 22.0), 1),
            heading=heading,
            timestamp=datetime.utcnow(),
        )

    def _build_timeline(
        self, departed: datetime, eta: datetime, progress: float, data: dict
    ) -> List[TimelineEvent]:
        """Build shipment timeline"""
        timeline = []

        # Departed
        timeline.append(
            TimelineEvent(
                status="DEPARTED_ORIGIN",
                location=data["origin_port"],
                timestamp=departed,
                completed=True,
                current=False,
            )
        )

        # In transit
        if progress < 1.0:
            timeline.append(
                TimelineEvent(
                    status="IN_TRANSIT",
                    location="At Sea",
                    timestamp=datetime.utcnow(),
                    completed=True,
                    current=True,
                )
            )

        # Arrival
        timeline.append(
            TimelineEvent(
                status="ARRIVAL_AT_DESTINATION",
                location=data["destination_port"],
                timestamp=eta,
                completed=progress >= 0.95,
                current=progress >= 0.95 and progress < 1.0,
                estimated=progress < 0.95,
            )
        )

        # Customs clearance
        customs_time = eta + timedelta(hours=24)
        timeline.append(
            TimelineEvent(
                status="CUSTOMS_CLEARANCE",
                location=data["destination_port"],
                timestamp=customs_time,
                completed=False,
                estimated=True,
            )
        )

        # Delivery
        delivery_time = eta + timedelta(days=3)
        timeline.append(
            TimelineEvent(
                status="DELIVERED",
                location=f"{data['destination_port']} Warehouse",
                timestamp=delivery_time,
                completed=False,
                estimated=True,
            )
        )

        return timeline

    def _generate_alerts(self, progress: float, data: dict) -> List[CargoAlert]:
        """Generate shipment alerts"""
        alerts = []

        # On schedule alert
        alerts.append(
            CargoAlert(
                type="INFO",
                message="Vessel on schedule - ETA unchanged",
                timestamp=datetime.utcnow() - timedelta(hours=6),
            )
        )

        # Random port congestion warning
        if random.random() > 0.6:
            alerts.append(
                CargoAlert(
                    type="WARNING",
                    message=(
                        f"Port of {data['destination_port'].split(',')[0]} congestion "
                        "expected - possible 1-day delay"
                    ),
                    timestamp=datetime.utcnow() - timedelta(hours=18),
                )
            )

        # Weather alert for mid-transit
        if 0.3 < progress < 0.7 and random.random() > 0.7:
            alerts.append(
                CargoAlert(
                    type="WARNING",
                    message="Weather advisory: Rough seas expected, minor delay possible",
                    timestamp=datetime.utcnow() - timedelta(hours=12),
                )
            )

        return alerts

    def _get_status_from_progress(self, progress_percent: int) -> str:
        """Get status string from progress percentage"""
        if progress_percent < 5:
            return "DEPARTED"
        if progress_percent < 95:
            return "IN_TRANSIT"
        if progress_percent < 100:
            return "ARRIVING"
        return "ARRIVED"

    def _generate_random_shipment(self, container_id: str) -> dict:
        """Generate random shipment data for unknown container IDs"""
        carriers = ["COSCO", "MSC", "Maersk", "Evergreen", "CMA CGM"]
        vessels = [
            "Ocean Star",
            "Pacific Voyager",
            "Atlantic Express",
            "Global Carrier",
            "Sea Fortune",
        ]

        return {
            "container_id": container_id.upper(),
            "bill_of_lading": f"BL{random.randint(100000, 999999)}",
            "vessel": random.choice(vessels),
            "voyage": f"{random.randint(100, 999)}W",
            "carrier": random.choice(carriers),
            "origin_port": "Shanghai",
            "origin_country": "CN",
            "destination_port": "Los Angeles",
            "destination_country": "US",
            "cargo_description": "General Cargo",
            "hs_code": "8471.30.00",
            "weight_kg": random.randint(500, 5000),
            "value_usd": random.randint(10000, 100000),
            "route": [
                {"lat": 31.2304, "lon": 121.4737, "name": "Shanghai Port"},
                {"lat": 30.0, "lon": -150.0, "name": "Pacific Ocean"},
                {"lat": 33.9425, "lon": -118.4081, "name": "Los Angeles Port"},
            ],
            "transit_days": random.randint(14, 25),
        }


cargo_service = CargoService()
