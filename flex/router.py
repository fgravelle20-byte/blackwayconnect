"""
Routes du module Flex - Planification et scheduling.
"""

from fastapi import APIRouter, Depends
from auth.utils import get_current_user
from flex.scheduler import flex_scheduler

router = APIRouter()


@router.get("/schedule")
async def get_schedule(current_user: dict = Depends(get_current_user)):
    """Récupère le planning de l'utilisateur."""
    return await flex_scheduler.get_user_schedule(current_user["sub"])


@router.post("/book")
async def book_slot(
    service_type: str,
    preferred_date: str,
    preferred_time: str = "10:00",
    current_user: dict = Depends(get_current_user)
):
    """Réserve un créneau pour un service."""
    return await flex_scheduler.book_slot(
        current_user["sub"], service_type, preferred_date, preferred_time
    )


@router.delete("/cancel/{booking_id}")
async def cancel_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Annule une réservation."""
    return await flex_scheduler.cancel_booking(current_user["sub"], booking_id)


@router.get("/availability")
async def check_availability(service_type: str, date: str):
    """Vérifie les disponibilités pour un service."""
    return await flex_scheduler.get_availability(service_type, date)
