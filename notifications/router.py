"""
Routes des notifications.
"""

from fastapi import APIRouter, Depends
from auth.utils import get_current_user
from notifications.push_service import push_service

router = APIRouter()


@router.post("/register-device")
async def register_device(
    device_token: str,
    platform: str = "ios",
    current_user: dict = Depends(get_current_user)
):
    """Enregistre un device pour les push notifications."""
    result = await push_service.register_device(
        current_user["sub"], device_token, platform
    )
    return result


@router.post("/send")
async def send_notification(
    title: str,
    body: str,
    current_user: dict = Depends(get_current_user)
):
    """Envoie une notification push à l'utilisateur courant."""
    result = await push_service.send_push(current_user["sub"], title, body)
    return result


@router.get("/history")
async def notification_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Historique des notifications de l'utilisateur."""
    # TODO: Récupérer de la DB
    return {"notifications": [], "total": 0}
