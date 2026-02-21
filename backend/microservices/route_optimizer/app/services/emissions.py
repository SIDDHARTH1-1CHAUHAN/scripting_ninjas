# CO2 emissions factors (kg CO2 per ton-km)
EMISSION_FACTORS = {
    "ocean": 0.015,  # Container ship
    "air": 0.50,  # Air cargo
    "rail": 0.028,  # Rail freight
    "truck": 0.062,  # Road freight
}

# Average distances (km) for route types
ROUTE_DISTANCES = {
    "ocean": 18000,  # Trans-Pacific
    "air": 12000,
    "rail": 10000,
}


def calculate_emissions(weight_kg: float, mode: str, transit_days: int) -> float:
    """Calculate CO2 emissions for shipment."""
    weight_tons = weight_kg / 1000
    factor = EMISSION_FACTORS.get(mode, 0.015)
    distance = ROUTE_DISTANCES.get(mode, 15000)

    emissions = weight_tons * distance * factor

    return emissions
