"""
Logique de planification - Créneaux, disponibilités, réservations.
"""

from typing import Optional, List
from datetime import datetime, timedelta
from utils.logger import logger


class FlexScheduler:
    """Gère la planification flexible des services BlackWayConnect."""

    SERVICES = {
        "consultation": {"duration_min": 30, "max_per_day": 8},
        "onboarding": {"duration_min": 60, "max_per_day": 4},
        "strategy_call": {"duration_min": 90, "max_per_day": 3},
        "training": {"duration_min": 120, "max_per_day": 2},
    }

    async def get_user_schedule(self, user_id: str) -> dict:
        """Récupère le planning d'un utilisateur."""
        # TODO: Requêter la DB
        return {
            "user_id": user_id,
            "upcoming": [],
            "past": [],
        }

    async def book_slot(
        self,
        user_id: str,
        service_type: str,
        date: str,
        time: str
    ) -> dict:
        """Réserve un créneau."""
        if service_type not in self.SERVICES:
            return {"status": "error", "message": f"Service inconnu: {service_type}"}

        # TODO: Vérifier la disponibilité et sauvegarder en DB
        booking_id = f"bk_{user_id}_{date}_{time}".replace(":", "")
        logger.info(f"Booking: {booking_id} | {service_type} | {date} {time}")

        return {
            "status": "confirmed",
            "booking_id": booking_id,
            "service": service_type,
            "date": date,
            "time": time,
            "duration_min": self.SERVICES[service_type]["duration_min"],
        }

    async def cancel_booking(self, user_id: str, booking_id: str) -> dict:
        """Annule une réservation."""
        # TODO: Vérifier l'ownership et annuler en DB
        logger.info(f"Cancellation: {booking_id} by {user_id}")
        return {"status": "cancelled", "booking_id": booking_id}

    async def get_availability(self, service_type: str, date: str) -> dict:
        """Retourne les créneaux disponibles pour un service à une date."""
        if service_type not in self.SERVICES:
            return {"status": "error", "message": f"Service inconnu: {service_type}"}

        # TODO: Calculer les vrais créneaux dispo depuis la DB
        slots = [
            f"{h:02d}:00" for h in range(9, 17)
        ]
        return {
            "service": service_type,
            "date": date,
            "available_slots": slots,
            "duration_min": self.SERVICES[service_type]["duration_min"],
        }

    async def get_upcoming_bookings(self, limit: int = 10) -> list:
        """Récupère les prochaines réservations (admin)."""
        # TODO: Requêter la DB
        return []


flex_scheduler = FlexScheduler()
