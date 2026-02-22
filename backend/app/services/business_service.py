class BusinessService:
    """Static SaaS business-model brief aligned to hackathon context."""

    def get_business_model(self) -> dict:
        return {
            "product": "TradeOptimize AI",
            "positioning": "AI decision layer for import teams to reduce landed cost, compliance risk, and payment timing loss",
            "target_customers": [
                "SMB and mid-market importers (50-8,000 shipments/year)",
                "Import operations teams in electronics, consumer goods, and industrial parts",
                "Customs brokers and freight partners offering managed compliance services",
            ],
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
                    "price_monthly_usd": 129,
                    "price_yearly_usd": 1290,
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
                    "price_monthly_usd": 399,
                    "price_yearly_usd": 3990,
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
                    "price_monthly_usd": 1299,
                    "price_yearly_usd": 12990,
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
                "Primary: subscription SaaS by team size and shipment complexity",
                "Secondary: usage overages for high-volume AI workflows (classification, compliance, route simulations)",
                "Premium: implementation and integration setup fee for enterprise deployments",
                "Add-on: FX settlement intelligence pack for treasury-heavy importers",
                "Channel: revenue-share partnerships with brokers and 3PL advisory partners",
            ],
            "go_to_market": [
                "Land lighthouse pilots in high-duty import categories and prove 30-day savings",
                "Product-led conversion from Free to Starter via usage/limit nudges",
                "Broker and forwarder partnerships as channel accelerators",
                "Publish ROI snapshots: duties saved, delays avoided, and compliance incidents prevented",
            ],
            "competitive_edge": [
                "Unified workflow across HS, landed cost, compliance, routing, cargo, and FX timing",
                "Decision-grade outputs with explainability and operational context",
                "Hybrid model routing + caching to keep response fast and margins healthy",
            ],
            "usp": [
                "One control tower for trade decisions that are usually spread across multiple tools",
                "Embedded trade logic with actionable recommendations, not generic AI answers",
                "ROI-native reporting so finance and operations can measure value continuously",
            ],
            "overage_pricing": [
                {"feature": "Text classification", "unit": "request", "price_usd": 0.025},
                {"feature": "Image classification", "unit": "request", "price_usd": 0.07},
                {"feature": "Compliance workflow", "unit": "check", "price_usd": 0.045},
                {"feature": "Route simulation API", "unit": "10,000 calls", "price_usd": 2.5},
            ],
            "membership_addon": {
                "name": "Trade Intelligence Briefing",
                "price_monthly_usd": 79,
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
                    "mrr_usd": 11939,
                    "arr_usd": 143268,
                },
                {
                    "name": "Base Case",
                    "mix": "95 Starter + 30 Growth + 7 Enterprise + 40 Add-on",
                    "mrr_usd": 33843,
                    "arr_usd": 406116,
                },
                {
                    "name": "Aggressive",
                    "mix": "220 Starter + 72 Growth + 18 Enterprise + 90 Add-on",
                    "mrr_usd": 84742,
                    "arr_usd": 1016904,
                },
            ],
            "north_star_metric": "Net landed-cost savings realized per active customer per month",
            "hackathon_pitch": {
                "one_liner": "TradeOptimize AI helps import teams decide what to classify, what it will cost, what can block clearance, and when to settle FX payments.",
                "problem": [
                    "Import decisions are fragmented across spreadsheets, brokers, and siloed tools.",
                    "Wrong HS, hidden duty exposure, and delayed compliance checks cause preventable losses.",
                    "Teams also miss FX timing opportunities that directly impact landed margin.",
                ],
                "solution": [
                    "A unified control tower for HS classification, landed cost, compliance, routing, cargo visibility, and FX settlement timing.",
                    "Action-oriented recommendations with confidence and rationale for faster approvals.",
                    "Cross-functional view for ops, finance, and compliance to execute one aligned plan.",
                ],
                "demo_story": [
                    "Step 1: Classify product and quantify confidence + alternatives.",
                    "Step 2: Simulate landed cost and compliance risk before booking shipment.",
                    "Step 3: Forecast FX window and schedule pay-low/receive-high settlement timing.",
                    "Step 4: Track shipment and monitor alerts until destination.",
                ],
                "business_model_summary": [
                    "Subscription tiers for recurring platform revenue.",
                    "Usage overages for heavy AI workflows.",
                    "Enterprise integration fees and partner channels for expansion.",
                ],
                "why_we_win": [
                    "Single workflow replaces multiple disconnected tools.",
                    "Measurable ROI: duties saved, risks reduced, and faster decision cycles.",
                    "Built for practical operator execution, not just analytics dashboards.",
                ],
                "ask": "Pilot with import teams handling duty-sensitive lanes and convert high-ROI accounts into annual Growth/Enterprise plans.",
            },
        }


business_service = BusinessService()
