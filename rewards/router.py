"""
Routes du programme de fidélité.
"""

from fastapi import APIRouter, Depends
from auth.utils import get_current_user
from rewards.loyalty import loyalty_program

router = APIRouter()


@router.get("/points")
async def get_points(current_user: dict = Depends(get_current_user)):
    """Points et niveau de fidélité de l'utilisateur."""
    return await loyalty_program.get_user_points(current_user["sub"])


@router.post("/earn")
async def earn_points(
    points: int,
    reason: str = "action",
    current_user: dict = Depends(get_current_user)
):
    """Gagner des points (appelé par les autres modules)."""
    return await loyalty_program.add_points(current_user["sub"], points, reason)


@router.post("/redeem/{reward_id}")
async def redeem_reward(
    reward_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Échanger des points contre une récompense."""
    return await loyalty_program.redeem_reward(current_user["sub"], reward_id)


@router.get("/leaderboard")
async def leaderboard(limit: int = 10):
    """Classement des meilleurs utilisateurs."""
    return await loyalty_program.get_leaderboard(limit)
