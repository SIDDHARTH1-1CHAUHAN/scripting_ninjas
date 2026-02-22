class BusinessService:
    """Static SaaS business-model brief aligned to hackathon context."""

    def get_business_model(self) -> dict:
        return {
            "product": "TradeOptimize AI",
            "positioning": "AI-powered tariff, compliance, and routing copilot for importers",
            "target_customers": [
                "SMB importers (100-5,000 shipments/year)",
                "Freight forwarders and customs brokers",
                "E-commerce brands importing from Asia to the US",
            ],
            "pricing": [
                {
                    "tier": "Free",
                    "price_monthly_usd": 0,
                    "price_yearly_usd": 0,
                    "who_for": "Evaluation and individual users",
                    "includes": [
                        "25 text HS classifications / month",
                        "10 image classifications / month",
                        "30 assistant messages / month",
                        "15 landed-cost calculations / month",
                        "5 compliance checks / month",
                    ],
                },
                {
                    "tier": "Starter",
                    "price_monthly_usd": 149,
                    "price_yearly_usd": 1490,
                    "who_for": "Small importers",
                    "includes": [
                        "800 text HS classifications / month",
                        "150 image classifications / month",
                        "500 landed-cost calculations / month",
                        "200 compliance checks / month",
                        "3 team seats + CSV exports",
                    ],
                },
                {
                    "tier": "Growth",
                    "price_monthly_usd": 499,
                    "price_yearly_usd": 4990,
                    "who_for": "Scaling import teams",
                    "includes": [
                        "Everything in Starter",
                        "4,000 text HS classifications / month",
                        "600 image classifications / month",
                        "1,000 compliance checks / month",
                        "API access + webhook support",
                        "10 team seats",
                    ],
                },
                {
                    "tier": "Enterprise",
                    "price_monthly_usd": 1499,
                    "price_yearly_usd": 14990,
                    "who_for": "High-volume import ops",
                    "includes": [
                        "Everything in Growth",
                        "SLA + SSO/SAML",
                        "Custom workflows",
                        "Dedicated compliance support",
                        "Advanced audit logs + custom integrations",
                    ],
                },
            ],
            "revenue_model": [
                "SaaS subscriptions (primary)",
                "Usage-based AI credits beyond plan limits",
                "Enterprise onboarding / integration fees",
                "Optional TradeOptimize Membership add-on",
            ],
            "go_to_market": [
                "Partner with customs brokers and 3PLs for channel sales",
                "Target high-duty categories (electronics, batteries, apparel)",
                "Ship ROI calculator showing duty savings vs plan cost",
                "Use free plan + in-app upgrade prompts for product-led conversion",
            ],
            "competitive_edge": [
                "Fast LLM-first workflows with practical compliance tooling",
                "Unified stack: classification + cost + route + compliance in one UI",
                "Caching and model routing reduce cost and improve gross margin",
            ],
            "usp": [
                "Single workspace for HS classification, landed cost, compliance, routing, and cargo visibility",
                "US import-focused decisioning with tariff and sanctions context embedded",
                "Clear ROI framing: duties saved and compliance risk reduced per account",
            ],
            "overage_pricing": [
                {"feature": "Text classification", "unit": "request", "price_usd": 0.03},
                {"feature": "Image classification", "unit": "request", "price_usd": 0.08},
                {"feature": "Compliance check", "unit": "request", "price_usd": 0.05},
                {"feature": "API usage", "unit": "10,000 calls", "price_usd": 2.0},
            ],
            "membership_addon": {
                "name": "TradeOptimize Membership",
                "price_monthly_usd": 99,
                "includes": [
                    "Monthly compliance clinic",
                    "Importer playbooks and templates",
                    "Regulation and tariff change digest",
                    "Private office-hours Q&A",
                ],
            },
            "revenue_scenarios": [
                {
                    "name": "Conservative",
                    "mix": "30 Starter + 8 Growth + 2 Enterprise",
                    "mrr_usd": 11460,
                    "arr_usd": 137520,
                },
                {
                    "name": "Base Case",
                    "mix": "80 Starter + 25 Growth + 6 Enterprise",
                    "mrr_usd": 33389,
                    "arr_usd": 400668,
                },
                {
                    "name": "Aggressive",
                    "mix": "180 Starter + 60 Growth + 15 Enterprise",
                    "mrr_usd": 79245,
                    "arr_usd": 950940,
                },
            ],
            "north_star_metric": "Monthly duties saved for active customers",
        }


business_service = BusinessService()
