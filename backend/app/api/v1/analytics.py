from fastapi import APIRouter, Query

from ...services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard")
async def get_dashboard(period: str = Query("30d", regex="^(7d|30d|90d)$")):
    """Get dashboard analytics summary"""
    return await analytics_service.get_dashboard_analytics(period)


@router.get("/classifications")
async def get_classification_stats():
    """Get classification statistics"""
    return await analytics_service.get_classification_stats()


@router.get("/cost-savings")
async def get_cost_savings():
    """Get cost savings and optimization report"""
    return await analytics_service.get_cost_savings_report()


@router.get("/export")
async def export_report(format: str = Query("json", regex="^(json|csv)$")):
    """Export analytics report"""
    return await analytics_service.export_report(format)


@router.get("/summary")
async def get_quick_summary():
    """Get quick summary for sidebar/header display"""
    analytics = await analytics_service.get_dashboard_analytics("30d")
    return {
        "classifications_today": 47,
        "active_shipments": 12,
        "compliance_score": analytics.summary.compliance_score,
        "duties_saved_mtd": analytics.summary.duties_saved_usd,
    }
