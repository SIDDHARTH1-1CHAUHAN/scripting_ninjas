from pydantic import BaseModel


class LandedCostRequest(BaseModel):
    hs_code: str
    product_value: float
    quantity: int
    origin_country: str
    destination_country: str
    shipping_mode: str = "ocean"
    incoterm: str = "FOB"


class LandedCostResult(BaseModel):
    total_landed_cost: float
    cost_per_unit: float
    breakdown: dict
    effective_duty_rate: float
    warnings: list[str]


class LandedCostService:
    """Calculate landed cost with real duty rates"""

    # Section 301 tariff rates (China -> US)
    SECTION_301_RATES = {
        "8504": 0.25,  # Static converters
        "8518": 0.25,  # Headphones
        "8471": 0.25,  # Computers
        "9503": 0.25,  # Toys
        "6110": 0.075,  # Sweaters
        "default": 0.0,
    }

    # Base MFN duty rates
    MFN_RATES = {
        "8504.40": 0.0,
        "8518.30": 0.0,
        "6110.20": 0.165,
        "7323.93": 0.034,
        "default": 0.05,
    }

    async def calculate(self, request: LandedCostRequest) -> LandedCostResult:
        """Calculate complete landed cost"""
        warnings = []

        # Get duty rates
        hs_prefix_4 = request.hs_code[:4]
        hs_prefix_7 = request.hs_code[:7]

        mfn_rate = self.MFN_RATES.get(
            hs_prefix_7, self.MFN_RATES.get(hs_prefix_4, self.MFN_RATES["default"])
        )

        section_301_rate = 0.0
        if request.origin_country == "CN" and request.destination_country == "US":
            section_301_rate = self.SECTION_301_RATES.get(
                hs_prefix_4, self.SECTION_301_RATES["default"]
            )
            if section_301_rate > 0:
                warnings.append(
                    f"Section 301 tariff applies: {section_301_rate * 100:.0f}%"
                )

        # Calculate duties
        base_duty = request.product_value * mfn_rate
        section_301 = request.product_value * section_301_rate

        # Calculate fees
        mpf_rate = 0.003464
        mpf = max(31.67, min(614.35, request.product_value * mpf_rate))

        hmf_rate = 0.00125
        hmf = request.product_value * hmf_rate

        # Estimate shipping costs
        if request.shipping_mode == "ocean":
            freight = 1800 + (request.quantity * 0.5)
        elif request.shipping_mode == "air":
            freight = 5000 + (request.quantity * 2.0)
        else:
            freight = 2500 + (request.quantity * 1.0)

        # Insurance (0.5% of CIF value)
        cif_value = request.product_value + freight
        insurance = cif_value * 0.005

        # Total
        total_duties = base_duty + section_301 + mpf + hmf
        total_freight = freight + insurance
        total_landed = request.product_value + total_duties + total_freight

        return LandedCostResult(
            total_landed_cost=round(total_landed, 2),
            cost_per_unit=round(total_landed / request.quantity, 2),
            breakdown={
                "product_value": request.product_value,
                "base_duty": round(base_duty, 2),
                "base_duty_rate": mfn_rate,
                "section_301": round(section_301, 2),
                "section_301_rate": section_301_rate,
                "mpf": round(mpf, 2),
                "hmf": round(hmf, 2),
                "freight": round(freight, 2),
                "insurance": round(insurance, 2),
                "total_duties": round(total_duties, 2),
                "total_freight": round(total_freight, 2),
            },
            effective_duty_rate=round((total_duties / request.product_value) * 100, 2),
            warnings=warnings,
        )


landed_cost_service = LandedCostService()
