"""
Routes du portail client.
"""

from fastapi import APIRouter, Depends
from auth.utils import get_current_user
from portal.dashboard import (
    get_client_metrics, get_client_projects,
    get_client_invoices, get_client_notifications
)

router = APIRouter()


@router.get("/dashboard")
async def dashboard(current_user: dict = Depends(get_current_user)):
    """Vue principale du dashboard client."""
    client_id = current_user["sub"]
    metrics = await get_client_metrics(client_id)
    projects = await get_client_projects(client_id)
    return {
        "metrics": metrics,
        "projects": projects,
        "welcome_message": f"Bienvenue sur votre portail BlackWayConnect",
    }


@router.get("/metrics")
async def metrics(period: str = "30d", current_user: dict = Depends(get_current_user)):
    """Métriques détaillées du client."""
    return await get_client_metrics(current_user["sub"], period)


@router.get("/projects")
async def projects(current_user: dict = Depends(get_current_user)):
    """Liste des projets du client."""
    return await get_client_projects(current_user["sub"])


@router.get("/invoices")
async def invoices(current_user: dict = Depends(get_current_user)):
    """Historique de facturation."""
    return await get_client_invoices(current_user["sub"])


@router.get("/notifications")
async def notifications(limit: int = 20, current_user: dict = Depends(get_current_user)):
    """Notifications du client."""
    return await get_client_notifications(current_user["sub"], limit)
