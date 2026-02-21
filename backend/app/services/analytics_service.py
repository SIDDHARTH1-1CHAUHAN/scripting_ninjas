from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import random


class AnalyticsSummary(BaseModel):
    total_classifications: int
    total_shipments: int
    total_value_usd: float
    duties_paid_usd: float
    duties_saved_usd: float
    compliance_score: float
    period: str


class ChapterBreakdown(BaseModel):
    chapter: str
    count: int
    percentage: float


class TradeRoute(BaseModel):
    route: str
    shipments: int
    value: float


class MonthlyTrend(BaseModel):
    month: str
    classifications: int
    shipments: int
    value: float


class AIAccuracy(BaseModel):
    overall: float
    by_confidence: List[dict]


class AnalyticsResult(BaseModel):
    summary: AnalyticsSummary
    classifications_by_chapter: List[ChapterBreakdown]
    top_trade_routes: List[TradeRoute]
    monthly_trend: List[MonthlyTrend]
    ai_accuracy: AIAccuracy
    recent_activity: List[dict]


class AnalyticsService:
    """Analytics and reporting service"""

    async def get_dashboard_analytics(self, period: str = "30d") -> AnalyticsResult:
        """Get comprehensive dashboard analytics"""

        # In production, this would query the database
        # For hackathon demo, we generate realistic mock data

        days = 30 if period == "30d" else 7 if period == "7d" else 90

        # Generate summary
        base_classifications = random.randint(700, 900)
        base_shipments = random.randint(100, 150)
        base_value = random.randint(2000000, 3000000)

        summary = AnalyticsSummary(
            total_classifications=base_classifications,
            total_shipments=base_shipments,
            total_value_usd=base_value,
            duties_paid_usd=round(base_value * 0.08, 2),
            duties_saved_usd=round(base_value * 0.018, 2),
            compliance_score=round(random.uniform(92, 98), 1),
            period=f"Last {days} Days",
        )

        # Classifications by chapter
        chapters = [
            ("Chapter 85 - Electrical", 36.8),
            ("Chapter 84 - Machinery", 23.4),
            ("Chapter 39 - Plastics", 17.1),
            ("Chapter 73 - Iron/Steel", 10.5),
            ("Chapter 94 - Furniture", 6.2),
            ("Other", 6.0),
        ]

        classifications_by_chapter = []
        for chapter, pct in chapters:
            count = int(base_classifications * pct / 100)
            classifications_by_chapter.append(
                ChapterBreakdown(
                    chapter=chapter,
                    count=count,
                    percentage=pct,
                )
            )

        # Top trade routes
        top_trade_routes = [
            TradeRoute(route="CN -> US", shipments=67, value=1450000),
            TradeRoute(route="VN -> US", shipments=23, value=340000),
            TradeRoute(route="IN -> US", shipments=18, value=280000),
            TradeRoute(route="DE -> US", shipments=16, value=270000),
            TradeRoute(route="TW -> US", shipments=12, value=420000),
        ]

        # Monthly trend (last 6 months)
        monthly_trend = []
        months = [
            "Sep 2025",
            "Oct 2025",
            "Nov 2025",
            "Dec 2025",
            "Jan 2026",
            "Feb 2026",
        ]
        for i, month in enumerate(months):
            growth = 1 + (i * 0.05)  # 5% monthly growth
            monthly_trend.append(
                MonthlyTrend(
                    month=month,
                    classifications=int(600 * growth),
                    shipments=int(80 * growth),
                    value=int(1500000 * growth),
                )
            )

        # AI accuracy metrics
        ai_accuracy = AIAccuracy(
            overall=94.2,
            by_confidence=[
                {"range": "90-100%", "accuracy": 98.7, "count": 512},
                {"range": "80-90%", "accuracy": 91.3, "count": 234},
                {"range": "70-80%", "accuracy": 84.6, "count": 101},
                {"range": "< 70%", "accuracy": 72.1, "count": 53},
            ],
        )

        # Recent activity
        recent_activity = [
            {
                "type": "classification",
                "description": "Solar Portable Charger classified as 8504.40.95",
                "confidence": 94,
                "timestamp": (datetime.utcnow() - timedelta(minutes=15)).isoformat(),
            },
            {
                "type": "shipment",
                "description": "Container TCLU1234567 departed Yantian",
                "status": "IN_TRANSIT",
                "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
            },
            {
                "type": "compliance",
                "description": "Compliance check passed for Shenzhen Tech Co",
                "risk_level": "LOW",
                "timestamp": (datetime.utcnow() - timedelta(hours=4)).isoformat(),
            },
            {
                "type": "landed_cost",
                "description": "Landed cost calculated: $81,634 for 5000 units",
                "savings": "$2,340",
                "timestamp": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
            },
            {
                "type": "classification",
                "description": "Wireless Earbuds classified as 8518.30.20",
                "confidence": 97,
                "timestamp": (datetime.utcnow() - timedelta(hours=8)).isoformat(),
            },
        ]

        return AnalyticsResult(
            summary=summary,
            classifications_by_chapter=classifications_by_chapter,
            top_trade_routes=top_trade_routes,
            monthly_trend=monthly_trend,
            ai_accuracy=ai_accuracy,
            recent_activity=recent_activity,
        )

    async def get_classification_stats(self) -> dict:
        """Get classification-specific statistics"""
        return {
            "total_today": random.randint(20, 50),
            "total_week": random.randint(150, 250),
            "total_month": random.randint(700, 900),
            "avg_confidence": round(random.uniform(88, 95), 1),
            "avg_processing_time_ms": random.randint(1800, 2500),
            "cache_hit_rate": round(random.uniform(35, 55), 1),
            "top_chapters": [
                {"chapter": "85", "name": "Electrical", "count": 312},
                {"chapter": "84", "name": "Machinery", "count": 198},
                {"chapter": "39", "name": "Plastics", "count": 145},
            ],
        }

    async def get_cost_savings_report(self) -> dict:
        """Get cost savings and optimization report"""
        return {
            "period": "Last 30 Days",
            "total_imports_value": 2340000,
            "total_duties_paid": 187200,
            "optimized_duties": 144850,
            "total_savings": 42350,
            "savings_percentage": 22.6,
            "optimization_methods": [
                {"method": "FTA Utilization", "savings": 18500, "count": 23},
                {"method": "HS Code Optimization", "savings": 12400, "count": 45},
                {"method": "Route Optimization", "savings": 8200, "count": 31},
                {"method": "Duty Drawback", "savings": 3250, "count": 8},
            ],
            "recommendations": [
                "Consider Vietnam sourcing for Chapter 61-62 products",
                "Apply for C-TPAT certification for reduced inspections",
                "Utilize Foreign Trade Zone for deferred duties",
            ],
        }

    async def export_report(self, format: str = "json") -> dict:
        """Export analytics report"""
        analytics = await self.get_dashboard_analytics("30d")
        cost_report = await self.get_cost_savings_report()

        return {
            "generated_at": datetime.utcnow().isoformat(),
            "format": format,
            "analytics": analytics.model_dump(),
            "cost_savings": cost_report,
            "export_note": "Full PDF/Excel export available in frontend",
        }


analytics_service = AnalyticsService()
