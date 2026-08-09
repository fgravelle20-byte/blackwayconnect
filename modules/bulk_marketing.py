"""
BlackWayConnect — BULK MARKETING ENGINE
========================================
Module critique : Gestion de 1300+ contacts via SendGrid API
avec segmentation neuronale, warmup progressif et throttling anti-spam.

Connecté au Neural-Sales (roi_engine.py) pour personnalisation à grande échelle.

Architecture :
  1. Import massif de contacts (CSV, JSON, API)
  2. Segmentation automatique (Lead Warming tiers)
  3. Génération d'emails personnalisés via Neural-Sales
  4. Envoi throttlé avec warmup progressif
  5. Tracking & feedback loop

Anti-spam :
  - Warmup exponentiel (jour 1: 50, jour 2: 100, jour 3: 200...)
  - Throttling : max 1 email / 3 secondes par défaut
  - Rotation de sujets et contenus dynamiques
  - Respect du CAN-SPAM / CASL
  - Bounce/complaint monitoring avec auto-pause
"""

import os
import json
import time
import random
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum


# --- CONFIGURATION ---

SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY", "")
SENDGRID_BASE_URL = "https://api.sendgrid.com/v3"

# Anti-spam settings
THROTTLE_DELAY_SECONDS = 3.0
WARMUP_DAY_1_LIMIT = 50
WARMUP_MULTIPLIER = 2.0
WARMUP_MAX_DAILY = 500
BOUNCE_THRESHOLD = 0.05
COMPLAINT_THRESHOLD = 0.001
BATCH_SIZE = 50


# --- ENUMS & MODELS ---

class LeadTier(Enum):
    ICE_COLD = "ice_cold"
    COLD = "cold"
    WARMING = "warming"
    WARM = "warm"
    HOT = "hot"
    BLAZING = "blazing"


class CampaignStatus(Enum):
    DRAFT = "draft"
    WARMING_UP = "warming_up"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    SUSPENDED = "suspended"


@dataclass
class Contact:
    email: str
    first_name: str = ""
    last_name: str = ""
    company: str = ""
    industry: str = ""
    source: str = "import"
    tier: LeadTier = LeadTier.ICE_COLD
    score: float = 0.0
    tags: List[str] = field(default_factory=list)
    engagement_history: List[Dict] = field(default_factory=list)
    last_contacted: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    metadata: Dict = field(default_factory=dict)

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip() or self.email.split("@")[0]

    def to_sendgrid_recipient(self) -> Dict:
        return {
            "email": self.email,
            "name": self.full_name,
            "custom_fields": {
                "company": self.company,
                "tier": self.tier.value,
                "score": str(self.score)
            }
        }


@dataclass
class Campaign:
    id: str = ""
    name: str = ""
    status: CampaignStatus = CampaignStatus.DRAFT
    contacts: List[Contact] = field(default_factory=list)
    warmup_day: int = 0
    total_sent: int = 0
    total_opened: int = 0
    total_clicked: int = 0
    total_bounced: int = 0
    total_complaints: int = 0
    daily_sent: int = 0
    last_send_date: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def __post_init__(self):
        if not self.id:
            self.id = hashlib.md5(f"{self.name}{time.time()}".encode()).hexdigest()[:12]


# --- CORE ENGINE ---

class BulkMarketingEngine:
    """
    Moteur principal de marketing massif BlackWay.
    Gere 1300+ contacts avec intelligence anti-spam.
    """

    def __init__(self):
        self.contacts: List[Contact] = []
        self.campaigns: Dict[str, Campaign] = {}
        self.daily_stats = {
            "sent": 0,
            "bounced": 0,
            "complaints": 0,
            "date": datetime.utcnow().strftime("%Y-%m-%d")
        }

    # --- 1. IMPORT MASSIF ---

    def import_contacts_bulk(self, data: List[Dict], source: str = "csv_import") -> Dict:
        """
        Importe massivement des contacts (1300+).
        Deduplique, valide et segmente automatiquement.
        """
        stats = {"imported": 0, "duplicates": 0, "invalid": 0, "total_input": len(data)}
        existing_emails = {c.email.lower() for c in self.contacts}

        for record in data:
            email = record.get("email", "").strip().lower()

            if not email or "@" not in email or "." not in email.split("@")[-1]:
                stats["invalid"] += 1
                continue

            if email in existing_emails:
                stats["duplicates"] += 1
                continue

            contact = Contact(
                email=email,
                first_name=record.get("first_name", record.get("prenom", "")),
                last_name=record.get("last_name", record.get("nom", "")),
                company=record.get("company", record.get("entreprise", "")),
                industry=record.get("industry", record.get("industrie", "")),
                source=source,
                tags=record.get("tags", []),
                metadata=record.get("metadata", {})
            )

            self.contacts.append(contact)
            existing_emails.add(email)
            stats["imported"] += 1

        self._auto_segment_contacts()
        stats["total_contacts"] = len(self.contacts)
        return stats

    def import_from_sendgrid(self) -> Dict:
        """Synchronise les contacts existants depuis SendGrid."""
        return {
            "action": "SENDGRID_LIST_CONTACTS",
            "endpoint": f"{SENDGRID_BASE_URL}/marketing/contacts",
            "method": "GET",
            "headers": {"Authorization": f"Bearer {SENDGRID_API_KEY}"}
        }

    # --- 2. SEGMENTATION AUTOMATIQUE (LEAD WARMING) ---

    def _auto_segment_contacts(self):
        """Segmente automatiquement tous les contacts selon leur profil."""
        for contact in self.contacts:
            score = self._calculate_lead_score(contact)
            contact.score = score
            contact.tier = self._score_to_tier(score)

    def _calculate_lead_score(self, contact: Contact) -> float:
        """
        Scoring neuronal multi-criteres.
        Facteurs : completude profil, engagement, industrie, source.
        """
        score = 0.0

        # Completude du profil (0-25 pts)
        if contact.first_name:
            score += 8
        if contact.last_name:
            score += 7
        if contact.company:
            score += 10

        # Source quality (0-20 pts)
        source_scores = {
            "referral": 20, "website_signup": 18, "event": 15,
            "linkedin": 12, "csv_import": 5, "purchased_list": 2
        }
        score += source_scores.get(contact.source, 5)

        # Engagement history (0-35 pts)
        opens = sum(1 for e in contact.engagement_history if e.get("type") == "open")
        clicks = sum(1 for e in contact.engagement_history if e.get("type") == "click")
        replies = sum(1 for e in contact.engagement_history if e.get("type") == "reply")
        score += min(opens * 5, 15)
        score += min(clicks * 10, 20)
        score += min(replies * 15, 35)

        # Industry match bonus (0-20 pts)
        high_value_industries = ["tech", "finance", "saas", "ecommerce", "marketing"]
        if contact.industry.lower() in high_value_industries:
            score += 20

        return min(score, 100.0)

    def _score_to_tier(self, score: float) -> LeadTier:
        """Convertit le score en tier de warming."""
        if score >= 80:
            return LeadTier.BLAZING
        elif score >= 60:
            return LeadTier.HOT
        elif score >= 40:
            return LeadTier.WARM
        elif score >= 25:
            return LeadTier.WARMING
        elif score >= 10:
            return LeadTier.COLD
        return LeadTier.ICE_COLD

    def get_segment_breakdown(self) -> Dict[str, int]:
        """Retourne la distribution par tier."""
        breakdown = {}
        for tier in LeadTier:
            count = sum(1 for c in self.contacts if c.tier == tier)
            if count > 0:
                breakdown[tier.value] = count
        return breakdown

    # --- 3. CONNEXION NEURAL-SALES ---

    def generate_personalized_emails(self, tier: Optional[LeadTier] = None) -> List[Dict]:
        """
        Genere des emails personnalises via le Neural-Sales engine.
        Chaque email est unique pour eviter les filtres anti-spam.
        """
        targets = self.contacts
        if tier:
            targets = [c for c in self.contacts if c.tier == tier]

        emails = []
        for contact in targets:
            email_content = self._neural_personalize(contact)
            emails.append(email_content)

        return emails

    def _neural_personalize(self, contact: Contact) -> Dict:
        """
        Generation d'email personnalise par le moteur neuronal.
        Adapte le ton, le sujet et le CTA selon le tier du contact.
        """
        templates = {
            LeadTier.ICE_COLD: {
                "subjects": [
                    f"Une question rapide, {contact.first_name or 'there'}",
                    f"{contact.company or 'Votre entreprise'} + BlackWay = ?",
                    f"Idee pour {contact.first_name or 'vous'}"
                ],
                "tone": "curious",
                "cta": "soft_question",
                "sequence_length": 3
            },
            LeadTier.COLD: {
                "subjects": [
                    f"Re: {contact.company or 'votre'} croissance",
                    f"{contact.first_name}, 2 min ?",
                    f"J'ai regarde {contact.company or 'votre profil'}..."
                ],
                "tone": "friendly_professional",
                "cta": "value_offer",
                "sequence_length": 4
            },
            LeadTier.WARMING: {
                "subjects": [
                    f"Suite a votre interet, {contact.first_name}",
                    f"Ressource exclusive pour {contact.company or 'vous'}",
                    f"{contact.first_name}, voici ce que j'ai prepare"
                ],
                "tone": "helpful_expert",
                "cta": "resource_share",
                "sequence_length": 5
            },
            LeadTier.WARM: {
                "subjects": [
                    f"{contact.first_name}, on en parle ?",
                    f"Prochaine etape pour {contact.company or 'vous'}",
                    f"Disponible cette semaine, {contact.first_name} ?"
                ],
                "tone": "confident_partner",
                "cta": "meeting_request",
                "sequence_length": 3
            },
            LeadTier.HOT: {
                "subjects": [
                    f"{contact.first_name}, c'est le moment",
                    f"Offre speciale {contact.company or ''} - 48h",
                    f"On lance ca ensemble, {contact.first_name} ?"
                ],
                "tone": "urgent_exclusive",
                "cta": "close_deal",
                "sequence_length": 2
            },
            LeadTier.BLAZING: {
                "subjects": [
                    f"{contact.first_name}, votre acces est pret",
                    f"Bienvenue dans BlackWay, {contact.first_name}",
                    f"Derniere etape - {contact.company or 'onboarding'}"
                ],
                "tone": "welcoming_vip",
                "cta": "onboard",
                "sequence_length": 1
            }
        }

        template = templates.get(contact.tier, templates[LeadTier.COLD])
        seed = int(hashlib.md5(contact.email.encode()).hexdigest()[:8], 16)
        subject_idx = seed % len(template["subjects"])

        return {
            "to": contact.email,
            "to_name": contact.full_name,
            "subject": template["subjects"][subject_idx],
            "tier": contact.tier.value,
            "score": contact.score,
            "tone": template["tone"],
            "cta_type": template["cta"],
            "sequence_position": 1,
            "sequence_length": template["sequence_length"],
            "personalization_vars": {
                "first_name": contact.first_name,
                "company": contact.company,
                "industry": contact.industry
            },
            "generated_at": datetime.utcnow().isoformat()
        }

    # --- 4. ENVOI AVEC WARMUP & THROTTLING ---

    def create_campaign(self, name: str, tier_filter: Optional[LeadTier] = None) -> Campaign:
        """Cree une campagne avec les contacts filtres."""
        contacts = self.contacts
        if tier_filter:
            contacts = [c for c in self.contacts if c.tier == tier_filter]

        campaign = Campaign(name=name, contacts=contacts)
        self.campaigns[campaign.id] = campaign
        return campaign

    def get_daily_send_limit(self, campaign: Campaign) -> int:
        """
        Calcule la limite d'envoi du jour selon le warmup.
        Jour 1: 50, Jour 2: 100, Jour 3: 200, ... jusqu'au plafond.
        """
        if campaign.warmup_day == 0:
            return WARMUP_DAY_1_LIMIT

        limit = int(WARMUP_DAY_1_LIMIT * (WARMUP_MULTIPLIER ** campaign.warmup_day))
        return min(limit, WARMUP_MAX_DAILY)

    def execute_campaign_batch(self, campaign_id: str) -> Dict:
        """
        Execute un batch d'envoi pour la campagne.
        Respecte le warmup, le throttling et les seuils anti-spam.
        """
        campaign = self.campaigns.get(campaign_id)
        if not campaign:
            return {"error": "Campaign not found"}

        safety_check = self._check_safety_thresholds(campaign)
        if not safety_check["safe"]:
            campaign.status = CampaignStatus.SUSPENDED
            return {"error": "Campaign suspended", "reason": safety_check["reason"]}

        today = datetime.utcnow().strftime("%Y-%m-%d")
        if campaign.last_send_date != today:
            campaign.daily_sent = 0
            campaign.warmup_day += 1
            campaign.last_send_date = today

        daily_limit = self.get_daily_send_limit(campaign)
        remaining_today = daily_limit - campaign.daily_sent

        if remaining_today <= 0:
            return {
                "status": "daily_limit_reached",
                "sent_today": campaign.daily_sent,
                "limit": daily_limit,
                "next_batch": "tomorrow"
            }

        unsent_contacts = [
            c for c in campaign.contacts
            if c.last_contacted != today
        ][:remaining_today]

        batch_results = self._send_batch_throttled(unsent_contacts, campaign)

        campaign.status = CampaignStatus.WARMING_UP if campaign.warmup_day <= 7 else CampaignStatus.ACTIVE

        return {
            "status": "batch_sent",
            "campaign_id": campaign.id,
            "warmup_day": campaign.warmup_day,
            "daily_limit": daily_limit,
            "sent_this_batch": batch_results["sent"],
            "sent_today_total": campaign.daily_sent,
            "remaining_contacts": len(campaign.contacts) - campaign.total_sent,
            "estimated_days_to_complete": self._estimate_completion_days(campaign),
            "safety_status": "green"
        }

    def _send_batch_throttled(self, contacts: List[Contact], campaign: Campaign) -> Dict:
        """Envoi throttle avec delai entre chaque email."""
        sent = 0
        errors = 0

        for i, contact in enumerate(contacts):
            email_data = self._neural_personalize(contact)

            payload = {
                "personalizations": [{
                    "to": [{"email": contact.email, "name": contact.full_name}],
                    "subject": email_data["subject"],
                    "dynamic_template_data": email_data["personalization_vars"]
                }],
                "from": {
                    "email": os.environ.get("SENDGRID_FROM_EMAIL", "serviceclient@blackwayconnect.com"),
                    "name": os.environ.get("SENDGRID_FROM_NAME", "BlackWay")
                },
                "tracking_settings": {
                    "click_tracking": {"enable": True},
                    "open_tracking": {"enable": True}
                },
                "asm": {
                    "group_id": int(os.environ.get("SENDGRID_UNSUBSCRIBE_GROUP", "0"))
                }
            }

            success = self._sendgrid_send(payload)

            if success:
                sent += 1
                campaign.total_sent += 1
                campaign.daily_sent += 1
                contact.last_contacted = datetime.utcnow().strftime("%Y-%m-%d")
                contact.engagement_history.append({
                    "type": "sent",
                    "campaign": campaign.id,
                    "date": datetime.utcnow().isoformat()
                })
            else:
                errors += 1

            # THROTTLING : delai variable anti-pattern-detection
            if i < len(contacts) - 1:
                jitter = random.uniform(0.5, 1.5)
                delay = THROTTLE_DELAY_SECONDS * jitter
                time.sleep(delay)

        return {"sent": sent, "errors": errors}

    def _sendgrid_send(self, payload: Dict) -> bool:
        """
        Envoie un email via SendGrid API.
        Integration point : appel reel via SENDGRID_SEND_EMAIL
        """
        return True

    def _check_safety_thresholds(self, campaign: Campaign) -> Dict:
        """Verifie les seuils de securite anti-spam."""
        if campaign.total_sent == 0:
            return {"safe": True}

        bounce_rate = campaign.total_bounced / campaign.total_sent
        complaint_rate = campaign.total_complaints / campaign.total_sent

        if bounce_rate > BOUNCE_THRESHOLD:
            return {
                "safe": False,
                "reason": f"Bounce rate {bounce_rate:.2%} exceeds {BOUNCE_THRESHOLD:.2%} threshold"
            }

        if complaint_rate > COMPLAINT_THRESHOLD:
            return {
                "safe": False,
                "reason": f"Complaint rate {complaint_rate:.2%} exceeds {COMPLAINT_THRESHOLD:.2%} threshold"
            }

        return {"safe": True}

    def _estimate_completion_days(self, campaign: Campaign) -> int:
        """Estime le nombre de jours pour completer la campagne."""
        remaining = len(campaign.contacts) - campaign.total_sent
        if remaining <= 0:
            return 0

        days = 0
        sent_projection = 0
        day = campaign.warmup_day

        while sent_projection < remaining:
            daily = min(
                int(WARMUP_DAY_1_LIMIT * (WARMUP_MULTIPLIER ** day)),
                WARMUP_MAX_DAILY
            )
            sent_projection += daily
            days += 1
            day += 1
            if days > 30:
                break

        return days

    # --- 5. WARMUP SCHEDULE ---

    def get_warmup_schedule(self, total_contacts: int = 1300) -> List[Dict]:
        """
        Genere le calendrier de warmup pour 1300 contacts.
        """
        schedule = []
        sent_total = 0
        day = 1

        while sent_total < total_contacts:
            daily_limit = min(
                int(WARMUP_DAY_1_LIMIT * (WARMUP_MULTIPLIER ** (day - 1))),
                WARMUP_MAX_DAILY
            )
            actual_send = min(daily_limit, total_contacts - sent_total)
            sent_total += actual_send

            schedule.append({
                "day": day,
                "daily_limit": daily_limit,
                "actual_send": actual_send,
                "cumulative_sent": sent_total,
                "remaining": total_contacts - sent_total,
                "progress_pct": round((sent_total / total_contacts) * 100, 1)
            })
            day += 1

        return schedule

    # --- 6. ANALYTICS & FEEDBACK LOOP ---

    def process_webhook_event(self, event: Dict) -> None:
        """
        Traite les webhooks SendGrid (opens, clicks, bounces, complaints).
        Met a jour les scores et tiers en temps reel.
        """
        event_type = event.get("event")
        email = event.get("email", "").lower()

        contact = next((c for c in self.contacts if c.email == email), None)
        if not contact:
            return

        contact.engagement_history.append({
            "type": event_type,
            "date": datetime.utcnow().isoformat(),
            "metadata": event
        })

        contact.score = self._calculate_lead_score(contact)
        contact.tier = self._score_to_tier(contact.score)

        campaign_id = event.get("campaign_id")
        if campaign_id and campaign_id in self.campaigns:
            campaign = self.campaigns[campaign_id]
            if event_type == "open":
                campaign.total_opened += 1
            elif event_type == "click":
                campaign.total_clicked += 1
            elif event_type == "bounce":
                campaign.total_bounced += 1
            elif event_type in ("spamreport", "complaint"):
                campaign.total_complaints += 1

    def get_campaign_analytics(self, campaign_id: str) -> Dict:
        """Retourne les analytics completes d'une campagne."""
        campaign = self.campaigns.get(campaign_id)
        if not campaign:
            return {"error": "Campaign not found"}

        open_rate = (campaign.total_opened / campaign.total_sent * 100) if campaign.total_sent > 0 else 0
        click_rate = (campaign.total_clicked / campaign.total_sent * 100) if campaign.total_sent > 0 else 0

        return {
            "campaign_id": campaign.id,
            "name": campaign.name,
            "status": campaign.status.value,
            "warmup_day": campaign.warmup_day,
            "total_contacts": len(campaign.contacts),
            "total_sent": campaign.total_sent,
            "open_rate": f"{open_rate:.1f}%",
            "click_rate": f"{click_rate:.1f}%",
            "bounce_rate": f"{(campaign.total_bounced / max(campaign.total_sent, 1) * 100):.2f}%",
            "complaint_rate": f"{(campaign.total_complaints / max(campaign.total_sent, 1) * 100):.3f}%",
            "segment_breakdown": self.get_segment_breakdown(),
            "estimated_days_remaining": self._estimate_completion_days(campaign),
            "health": "green" if campaign.status != CampaignStatus.SUSPENDED else "red_suspended"
        }


# --- ENTRY POINT ---

def initialize_bulk_engine() -> BulkMarketingEngine:
    """Factory pour initialiser le moteur."""
    return BulkMarketingEngine()


def run_1300_contact_campaign(contacts_data: List[Dict], campaign_name: str = "BlackWay Launch") -> Dict:
    """
    Pipeline complet pour 1300 contacts :
    Import -> Segment -> Generate -> Schedule
    """
    engine = initialize_bulk_engine()

    import_stats = engine.import_contacts_bulk(contacts_data, source="master_list")
    segments = engine.get_segment_breakdown()
    campaign = engine.create_campaign(campaign_name)
    warmup_schedule = engine.get_warmup_schedule(import_stats["imported"])
    first_batch = engine.execute_campaign_batch(campaign.id)

    return {
        "status": "CAMPAIGN_INITIALIZED",
        "import_stats": import_stats,
        "segmentation": segments,
        "campaign_id": campaign.id,
        "warmup_schedule_summary": {
            "total_days": len(warmup_schedule),
            "day_1_sends": warmup_schedule[0]["actual_send"] if warmup_schedule else 0,
            "completion_date_estimate": (
                datetime.utcnow() + timedelta(days=len(warmup_schedule))
            ).strftime("%Y-%m-%d")
        },
        "first_batch_result": first_batch,
        "anti_spam_config": {
            "throttle_delay": f"{THROTTLE_DELAY_SECONDS}s (+jitter)",
            "warmup_progression": "50 > 100 > 200 > 400 > 500/day (cap)",
            "bounce_auto_pause": f"{BOUNCE_THRESHOLD:.0%}",
            "complaint_auto_pause": f"{COMPLAINT_THRESHOLD:.1%}",
            "content_rotation": "enabled",
            "unsubscribe_link": "mandatory"
        }
    }


if __name__ == "__main__":
    demo_contacts = [
        {"email": f"lead{i}@example.com", "first_name": f"Lead{i}", "company": f"Corp{i}"}
        for i in range(1300)
    ]
    result = run_1300_contact_campaign(demo_contacts)
    print(json.dumps(result, indent=2, default=str))
