class BusinessService:
    """Static SaaS business-model brief aligned to hackathon context."""

    def get_business_model(self) -> dict:
        return {
            "product": "TradeOptimize AI",
            "positioning": "An operator-first AI control layer that improves import margins by reducing duty leakage, compliance exposure, and FX timing loss.",
            "pricing": [
                {
                    "tier": "Free",
                    "price_monthly_usd": 0,
                    "price_yearly_usd": 0,
                    "who_for": "Pilot and proof-of-value teams",
                    "includes": [
                        "40 text HS classifications / month",
                        "15 image classifications / month",
                        "25 landed-cost simulations / month",
                        "20 assistant workflows / month",
                        "10 compliance checks / month",
                    ],
                },
                {
                    "tier": "Starter",
                    "price_monthly_usd": 99,
                    "price_yearly_usd": 990,
                    "who_for": "Lean import teams",
                    "includes": [
                        "900 text HS classifications / month",
                        "180 image classifications / month",
                        "350 landed-cost simulations / month",
                        "220 compliance checks / month",
                        "Cargo + FX modules and 3 seats",
                    ],
                },
                {
                    "tier": "Growth",
                    "price_monthly_usd": 299,
                    "price_yearly_usd": 2990,
                    "who_for": "Scaling multi-lane operations",
                    "includes": [
                        "Everything in Starter",
                        "4,500 text HS classifications / month",
                        "750 image classifications / month",
                        "1,200 compliance checks / month",
                        "API access, webhooks, and analytics exports",
                        "10 team seats + priority support",
                    ],
                },
                {
                    "tier": "Enterprise",
                    "price_monthly_usd": 899,
                    "price_yearly_usd": 8990,
                    "who_for": "High-volume and regulated import networks",
                    "includes": [
                        "Everything in Growth",
                        "SLA + SSO/SAML + audit logs",
                        "Custom policies, workflow automation, and model routing",
                        "Dedicated compliance success manager",
                        "Integration support with ERP/TMS/custom broker stack",
                    ],
                },
            ],
            "revenue_model": [
                "Tiered subscription SaaS priced by workflow depth and operational scale.",
                "Usage-linked overages for intensive AI workflows at high shipment volume.",
                "Enterprise implementation and integration fees for custom deployments.",
                "Strategic add-ons for advanced trade intelligence and policy advisory.",
                "Channel revenue share with customs brokers and logistics advisory partners.",
            ],
            "competitive_edge": [
                "End-to-end trade decision workflow in one product, not point tools.",
                "Explainable recommendations tied to operator actions and approvals.",
                "Model-routing + caching architecture that keeps response fast and unit economics strong.",
            ],
            "usp": [
                "Single control tower replacing fragmented spreadsheets, broker chats, and siloed apps.",
                "Trade-aware intelligence that gives concrete actions, not generic model output.",
                "ROI-native reporting so finance, compliance, and ops align on measurable outcomes.",
            ],
            "overage_pricing": [
                {"feature": "Text classification", "unit": "request", "price_usd": 0.02},
                {"feature": "Image classification", "unit": "request", "price_usd": 0.05},
                {"feature": "Compliance workflow", "unit": "check", "price_usd": 0.035},
                {"feature": "Route simulation API", "unit": "10,000 calls", "price_usd": 2.0},
            ],
            "membership_addon": {
                "name": "Trade Intelligence Briefing",
                "price_monthly_usd": 59,
                "includes": [
                    "Monthly tariff and sanctions update call",
                    "Playbooks for high-risk import categories",
                    "Regulatory change digest with recommended actions",
                    "Private office-hours with trade specialists",
                ],
            },
            "revenue_scenarios": [
                {
                    "name": "Conservative",
                    "mix": "35 Starter + 9 Growth + 2 Enterprise + 15 Add-on",
                    "mrr_usd": 8839,
                    "arr_usd": 106068,
                },
                {
                    "name": "Base Case",
                    "mix": "95 Starter + 30 Growth + 7 Enterprise + 40 Add-on",
                    "mrr_usd": 27028,
                    "arr_usd": 324336,
                },
                {
                    "name": "Aggressive",
                    "mix": "220 Starter + 72 Growth + 18 Enterprise + 90 Add-on",
                    "mrr_usd": 64800,
                    "arr_usd": 777600,
                },
            ],
            "north_star_metric": "Net landed-cost savings realized per active customer per month",
            "hackathon_pitch": {
                "one_liner": "TradeOptimize AI gives import teams one clear, explainable plan from classification to payment timing so every shipment protects margin.",
                "problem": [
                    "Import decisions are fragmented across spreadsheets, broker emails, and disconnected tools.",
                    "Wrong HS codes, hidden duty exposure, and delayed compliance checks create preventable cost and delay.",
                    "Finance teams miss FX timing windows that materially impact landed margin.",
                ],
                "solution": [
                    "A unified control tower across HS classification, landed cost, compliance, routing, cargo visibility, and FX settlement timing.",
                    "Actionable recommendations with confidence + rationale so teams approve faster and execute with less risk.",
                    "Shared workflow for ops, finance, and compliance to run one aligned shipment playbook.",
                ],
                "demo_story": [
                    "Step 1: Classify product with confidence score, alternatives, and reasoning.",
                    "Step 2: Simulate landed cost and compliance exposure before booking.",
                    "Step 3: Forecast FX movement and optimize pay-low / receive-high timing.",
                    "Step 4: Monitor cargo and risk alerts through delivery.",
                ],
                "business_model_summary": [
                    "Recurring SaaS tiers for predictable revenue and expansion paths.",
                    "Usage overages align monetization with customer value at scale.",
                    "Enterprise setup + partner channels improve high-ACV growth.",
                ],
                "why_we_win": [
                    "Single workflow replaces disconnected point solutions.",
                    "Clear ROI: duties saved, risks reduced, and faster decision cycles.",
                    "Built for operator execution, not passive analytics.",
                ],
                "ask": "Run pilots with duty-sensitive import lanes, prove 30-day margin impact, then convert winning accounts to annual Growth and Enterprise contracts.",
            },
        }


business_service = BusinessService()
