"""
Service de notifications push - APNS (iOS) + FCM (Android).
"""

import os
from typing import Optional, List
from utils.logger import logger


class PushNotificationService:
    """Gère l'envoi de notifications push multi-plateforme."""

    def __init__(self):
        self.apns_key_id = os.environ.get("APNS_KEY_ID")
        self.apns_team_id = os.environ.get("APNS_TEAM_ID")
        self.fcm_server_key = os.environ.get("FCM_SERVER_KEY")

    async def send_push(
        self,
        user_id: str,
        title: str,
        body: str,
        data: Optional[dict] = None,
        platform: str = "all"
    ) -> dict:
        """Envoie une notification push à un utilisateur."""
        logger.info(f"Push notification -> {user_id}: {title}")
        # TODO: Implémenter avec firebase-admin et aioapns
        return {"status": "sent", "user_id": user_id, "platform": platform}

    async def send_bulk_push(
        self,
        user_ids: List[str],
        title: str,
        body: str,
        data: Optional[dict] = None
    ) -> dict:
        """Envoi de masse pour campagnes ou alertes."""
        results = []
        for uid in user_ids:
            result = await self.send_push(uid, title, body, data)
            results.append(result)
        return {"total": len(user_ids), "sent": len(results)}

    async def register_device(self, user_id: str, device_token: str, platform: str) -> dict:
        """Enregistre un device token pour un utilisateur."""
        # TODO: Sauvegarder en DB
        logger.info(f"Device registered: {user_id} ({platform})")
        return {"status": "registered", "platform": platform}


push_service = PushNotificationService()
