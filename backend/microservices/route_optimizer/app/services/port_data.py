class PortService:
    """Port congestion and data service."""

    # Simulated port data (replace with real API later)
    PORT_DATA = {
        "USLAX": {"name": "Los Angeles", "utilization": 85, "avg_wait_days": 3.2},
        "USLGB": {"name": "Long Beach", "utilization": 62, "avg_wait_days": 1.1},
        "CNSZX": {"name": "Shenzhen Yantian", "utilization": 71, "avg_wait_days": 0.5},
        "CNSHA": {"name": "Shanghai", "utilization": 78, "avg_wait_days": 1.8},
        "SGSIN": {"name": "Singapore", "utilization": 55, "avg_wait_days": 0.3},
        "NLRTM": {"name": "Rotterdam", "utilization": 68, "avg_wait_days": 0.8},
    }

    async def get_congestion(self, port_code: str) -> dict:
        """Get port congestion data."""
        if port_code in self.PORT_DATA:
            data = self.PORT_DATA[port_code]
            return {
                "port_code": port_code,
                "name": data["name"],
                "utilization": data["utilization"],
                "status": self._get_status(data["utilization"]),
                "avg_wait_days": data["avg_wait_days"],
            }

        return {
            "port_code": port_code,
            "name": "Unknown Port",
            "utilization": 70,
            "status": "MEDIUM",
            "avg_wait_days": 1.0,
        }

    def _get_status(self, utilization: int) -> str:
        if utilization > 80:
            return "HIGH"
        if utilization > 60:
            return "MEDIUM"
        return "LOW"

    async def get_all_ports(self) -> list[dict]:
        """Get all port data."""
        return [{"code": code, **data} for code, data in self.PORT_DATA.items()]


port_service = PortService()
