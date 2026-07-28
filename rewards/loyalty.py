"""
Logique du programme de fidélité - Points, niveaux, récompenses.
"""

from typing import Optional
from datetime import datetime


class LoyaltyProgram:
    """Gère le programme de fidélité BlackWayConnect."""

    TIERS = {
        "bronze": {"min_points": 0, "multiplier": 1.0, "perks": ["Support prioritaire"]},
        "silver": {"min_points": 500, "multiplier": 1.5, "perks": ["Support prioritaire", "10% rabais"]},
        "gold": {"min_points": 1500, "multiplier": 2.0, "perks": ["Support VIP", "20% rabais", "Accès bêta"]},
        "platinum": {"min_points": 5000, "multiplier": 3.0, "perks": ["Support VIP", "30% rabais", "Accès bêta", "Consultation gratuite"]},
    }

    async def get_user_points(self, user_id: str) -> dict:
        """Récupère les points et le niveau d'un utilisateur."""
        # TODO: Requêter la DB
        return {
            "user_id": user_id,
            "points": 0,
            "tier": "bronze",
            "next_tier": "silver",
            "points_to_next": 500,
            "perks": self.TIERS["bronze"]["perks"],
        }

    async def add_points(self, user_id: str, points: int, reason: str) -> dict:
        """Ajoute des points de fidélité."""
        # TODO: Sauvegarder en DB
        return {
            "user_id": user_id,
            "points_added": points,
            "reason": reason,
            "new_total": points,
            "timestamp": datetime.utcnow().isoformat(),
        }

    async def redeem_reward(self, user_id: str, reward_id: str) -> dict:
        """Échange des points contre une récompense."""
        # TODO: Vérifier les points et appliquer
        return {"status": "redeemed", "reward_id": reward_id}

    async def get_leaderboard(self, limit: int = 10) -> dict:
        """Top utilisateurs par points."""
        # TODO: Requêter la DB
        return {"leaderboard": [], "total_participants": 0}


loyalty_program = LoyaltyProgram()
