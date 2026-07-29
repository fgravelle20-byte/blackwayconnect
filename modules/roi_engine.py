"""
BlackWayConnect — ROI PREDICTION ENGINE v1.0
=============================================
Analyse les données de conversion des leads (CRM) et les paiements Stripe
pour prédire les revenus à 30/60/90 jours.

Ce module est le cerveau financier de l'écosystème BlackWayConnect.
Il transforme les données brutes en prédictions actionnables.
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum

import stripe
from loguru import logger


# ============================================================
# CONFIGURATION
# ============================================================

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

DEFAULT_CONVERSION_RATE = 0.12
UPSELL_PROBABILITY = 0.25
CHURN_RATE_MONTHLY = 0.05
REFERRAL_MULTIPLIER = 1.15

PLAN_VALUES = {
    "site_presence_google": {"one_time": 1495, "monthly_recurring": 0},
    "conversion_crm": {"one_time": 3495, "monthly_recurring": 297},
    "automatisation_ia": {"one_time": 6995, "monthly_recurring": 497},
}


class LeadStage(str, Enum):
    COLD = "cold"
    WARM = "warm"
    HOT = "hot"
    QUALIFIED = "qualified"
    PROPOSAL_SENT = "proposal_sent"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


@dataclass
class LeadData:
    id: str
    email: str
    name: str
    company: str
    stage: LeadStage
    score: int
    source: str
    estimated_value: float
    created_at: datetime
    last_activity: datetime
    plan_interest: str = "conversion_crm"
    interactions_count: int = 0

    @property
    def days_in_pipeline(self) -> int:
        return (datetime.utcnow() - self.created_at).days

    @property
    def conversion_probability(self) -> float:
        stage_weights = {
            LeadStage.COLD: 0.05, LeadStage.WARM: 0.15, LeadStage.HOT: 0.35,
            LeadStage.QUALIFIED: 0.50, LeadStage.PROPOSAL_SENT: 0.65,
            LeadStage.NEGOTIATION: 0.80, LeadStage.CLOSED_WON: 1.0, LeadStage.CLOSED_LOST: 0.0,
        }
        base = stage_weights.get(self.stage, 0.1)
        score_factor = self.score / 100
        recency_factor = max(0.5, 1.0 - (self.days_in_pipeline / 90) * 0.3)
        return min(1.0, base * score_factor * recency_factor * 1.5)


@dataclass
class RevenueProjection:
    period_days: int
    projected_revenue: float
    projected_recurring: float
    projected_one_time: float
    new_clients_expected: int
    pipeline_value: float
    confidence_score: float
    breakdown: Dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "period_days": self.period_days,
            "projected_revenue": round(self.projected_revenue, 2),
            "projected_recurring": round(self.projected_recurring, 2),
            "projected_one_time": round(self.projected_one_time, 2),
            "new_clients_expected": self.new_clients_expected,
            "pipeline_value": round(self.pipeline_value, 2),
            "confidence_score": round(self.confidence_score, 3),
            "breakdown": self.breakdown,
        }


@dataclass
class ROIReport:
    generated_at: str
    current_mrr: float
    total_revenue_30d: float
    projections: Dict[str, RevenueProjection]
    top_opportunities: List[Dict]
    health_metrics: Dict
    alerts: List[str]

    def to_dict(self) -> dict:
        return {
            "generated_at": self.generated_at,
            "current_mrr": round(self.current_mrr, 2),
            "total_revenue_30d": round(self.total_revenue_30d, 2),
            "projections": {k: v.to_dict() for k, v in self.projections.items()},
            "top_opportunities": self.top_opportunities,
            "health_metrics": self.health_metrics,
            "alerts": self.alerts,
        }


class StripeDataFetcher:
    def __init__(self):
        self._cache = {}
        self._cache_ttl = 300

    async def get_recent_payments(self, days: int = 90) -> List[Dict]:
        if not STRIPE_SECRET_KEY:
            logger.warning("STRIPE_SECRET_KEY non configuré - données simulées")
            return self._generate_simulated_payments(days)
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            charges = stripe.Charge.list(created={"gte": int(start_date.timestamp())}, limit=100)
            payments = []
            for charge in charges.auto_paging_iter():
                if charge.status == "succeeded":
                    payments.append({"id": charge.id, "amount": charge.amount / 100, "currency": charge.currency, "customer_email": charge.receipt_email or "", "created_at": datetime.fromtimestamp(charge.created), "plan_key": charge.metadata.get("plan_key", "unknown")})
            return payments
        except stripe.error.StripeError as e:
            logger.error(f"Erreur Stripe: {e}")
            return self._generate_simulated_payments(days)

    async def get_active_subscriptions(self) -> List[Dict]:
        if not STRIPE_SECRET_KEY:
            return self._generate_simulated_subscriptions()
        try:
            subscriptions = stripe.Subscription.list(status="active", limit=100)
            subs = []
            for sub in subscriptions.auto_paging_iter():
                monthly_amount = sum(item.price.unit_amount / 100 for item in sub["items"]["data"])
                subs.append({"id": sub.id, "customer_id": sub.customer, "monthly_amount": monthly_amount, "status": sub.status, "plan_key": sub.metadata.get("plan_key", "unknown")})
            return subs
        except stripe.error.StripeError as e:
            logger.error(f"Erreur Stripe subscriptions: {e}")
            return self._generate_simulated_subscriptions()

    async def calculate_mrr(self) -> float:
        subs = await self.get_active_subscriptions()
        return sum(s["monthly_amount"] for s in subs)

    def _generate_simulated_payments(self, days: int) -> List[Dict]:
        import random
        payments = []
        base_date = datetime.utcnow() - timedelta(days=days)
        plans = list(PLAN_VALUES.keys())
        for i in range(max(3, days // 15)):
            plan = random.choice(plans)
            payments.append({"id": f"sim_ch_{i:04d}", "amount": PLAN_VALUES[plan]["one_time"], "currency": "cad", "customer_email": f"client{i}@example.com", "created_at": base_date + timedelta(days=random.randint(0, days)), "plan_key": plan})
        return payments

    def _generate_simulated_subscriptions(self) -> List[Dict]:
        return [
            {"id": "sim_sub_001", "customer_id": "cus_001", "monthly_amount": 297, "status": "active", "plan_key": "conversion_crm"},
            {"id": "sim_sub_002", "customer_id": "cus_002", "monthly_amount": 497, "status": "active", "plan_key": "automatisation_ia"},
        ]


class CRMAnalyzer:
    def __init__(self):
        self._historical_rates = {}

    def calculate_pipeline_value(self, leads: List[LeadData]) -> float:
        total = 0.0
        for lead in leads:
            if lead.stage not in (LeadStage.CLOSED_WON, LeadStage.CLOSED_LOST):
                total += lead.estimated_value * lead.conversion_probability
        return total

    def get_conversion_metrics(self, leads: List[LeadData]) -> Dict:
        if not leads:
            return {"conversion_rate": DEFAULT_CONVERSION_RATE, "avg_deal_size": 3000, "avg_cycle_days": 14}
        won = [l for l in leads if l.stage == LeadStage.CLOSED_WON]
        lost = [l for l in leads if l.stage == LeadStage.CLOSED_LOST]
        active = [l for l in leads if l.stage not in (LeadStage.CLOSED_WON, LeadStage.CLOSED_LOST)]
        total_closed = len(won) + len(lost)
        conversion_rate = len(won) / total_closed if total_closed > 0 else DEFAULT_CONVERSION_RATE
        avg_deal = sum(l.estimated_value for l in won) / len(won) if won else 3000
        return {"conversion_rate": conversion_rate, "avg_deal_size": avg_deal, "avg_cycle_days": 14, "active_leads": len(active)}

    def identify_high_roi_prospects(self, leads: List[LeadData], top_n: int = 5) -> List[Dict]:
        active = [l for l in leads if l.stage not in (LeadStage.CLOSED_WON, LeadStage.CLOSED_LOST)]
        scored = []
        for lead in active:
            urgency = max(0.5, 1.0 - lead.days_in_pipeline / 60)
            roi_score = lead.estimated_value * lead.conversion_probability * urgency
            scored.append((lead, roi_score))
        scored.sort(key=lambda x: x[1], reverse=True)
        return [{"id": lead.id, "name": lead.name, "company": lead.company, "estimated_value": lead.estimated_value, "conversion_probability": round(lead.conversion_probability, 3), "roi_score": round(roi_score, 2), "recommended_action": self._recommend_action(lead)} for lead, roi_score in scored[:top_n]]

    def _recommend_action(self, lead: LeadData) -> str:
        actions = {LeadStage.COLD: "Envoyer séquence Vente Éclair", LeadStage.WARM: "Appel de qualification (15 min)", LeadStage.HOT: "Proposer audit IA gratuit", LeadStage.QUALIFIED: "Envoyer proposition BWC/02", LeadStage.PROPOSAL_SENT: "Follow-up sous 48h", LeadStage.NEGOTIATION: "Offrir bonus de signature"}
        return actions.get(lead.stage, "Analyser et requalifier")


class ROIPredictionEngine:
    def __init__(self):
        self.stripe_fetcher = StripeDataFetcher()
        self.crm_analyzer = CRMAnalyzer()
        self._last_report: Optional[ROIReport] = None
        self._last_report_time: Optional[datetime] = None

    async def generate_full_report(self, leads: Optional[List[LeadData]] = None) -> ROIReport:
        logger.info("Génération du rapport ROI en cours...")
        if leads is None:
            leads = self._generate_demo_leads()
        payments = await self.stripe_fetcher.get_recent_payments(90)
        current_mrr = await self.stripe_fetcher.calculate_mrr()
        crm_metrics = self.crm_analyzer.get_conversion_metrics(leads)
        pipeline_value = self.crm_analyzer.calculate_pipeline_value(leads)
        top_opportunities = self.crm_analyzer.identify_high_roi_prospects(leads)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        revenue_30d = sum(p["amount"] for p in payments if p["created_at"] >= thirty_days_ago)
        projections = {}
        for period in [30, 60, 90]:
            projections[f"{period}d"] = self._project_revenue(period, current_mrr, pipeline_value, crm_metrics, revenue_30d, len([l for l in leads if l.stage not in (LeadStage.CLOSED_WON, LeadStage.CLOSED_LOST)]))
        health_metrics = self._calculate_health_metrics(current_mrr, revenue_30d, payments, crm_metrics)
        alerts = self._generate_alerts(health_metrics, top_opportunities, crm_metrics)
        report = ROIReport(generated_at=datetime.utcnow().isoformat(), current_mrr=current_mrr, total_revenue_30d=revenue_30d, projections=projections, top_opportunities=top_opportunities, health_metrics=health_metrics, alerts=alerts)
        self._last_report = report
        self._last_report_time = datetime.utcnow()
        return report

    def _project_revenue(self, period_days, current_mrr, pipeline_value, crm_metrics, recent_revenue, active_leads) -> RevenueProjection:
        months = period_days / 30
        recurring = 0.0
        remaining_mrr = current_mrr
        for m in range(int(months)):
            remaining_mrr *= (1 - CHURN_RATE_MONTHLY)
            recurring += remaining_mrr
        conversion_rate = crm_metrics.get("conversion_rate", DEFAULT_CONVERSION_RATE)
        avg_deal = crm_metrics.get("avg_deal_size", 3000)
        expected_conversions = active_leads * conversion_rate * (period_days / 45)
        one_time_revenue = expected_conversions * avg_deal
        new_recurring = expected_conversions * 297 * (months / 2)
        upsell_revenue = current_mrr * UPSELL_PROBABILITY * months * 0.5
        referral_bonus = expected_conversions * REFERRAL_MULTIPLIER * avg_deal * 0.1
        total = recurring + one_time_revenue + new_recurring + upsell_revenue + referral_bonus
        confidence = max(0.4, 1.0 - (period_days / 120) * 0.5)
        return RevenueProjection(period_days=period_days, projected_revenue=total, projected_recurring=recurring + new_recurring, projected_one_time=one_time_revenue + upsell_revenue + referral_bonus, new_clients_expected=int(expected_conversions), pipeline_value=pipeline_value, confidence_score=confidence, breakdown={"recurring_existing": round(recurring, 2), "new_business": round(one_time_revenue, 2), "new_recurring": round(new_recurring, 2), "upsell": round(upsell_revenue, 2), "referral": round(referral_bonus, 2)})

    def _calculate_health_metrics(self, mrr, revenue_30d, payments, crm_metrics) -> Dict:
        velocity = revenue_30d / 30 if revenue_30d > 0 else 0
        if len(payments) >= 2:
            mid = len(payments) // 2
            first_half = sum(p["amount"] for p in payments[:mid])
            second_half = sum(p["amount"] for p in payments[mid:])
            growth_rate = (second_half - first_half) / first_half if first_half > 0 else 0
        else:
            growth_rate = 0
        return {"mrr": round(mrr, 2), "arr_projected": round(mrr * 12, 2), "revenue_velocity_daily": round(velocity, 2), "growth_rate_period": round(growth_rate * 100, 1), "conversion_rate": round(crm_metrics.get("conversion_rate", 0) * 100, 1), "avg_deal_size": round(crm_metrics.get("avg_deal_size", 0), 2), "active_pipeline_leads": crm_metrics.get("active_leads", 0)}

    def _generate_alerts(self, health, opportunities, crm_metrics) -> List[str]:
        alerts = []
        if health.get("conversion_rate", 0) < 8:
            alerts.append("⚠️ Taux de conversion faible (<8%)")
        if health.get("active_pipeline_leads", 0) < 3:
            alerts.append("🔴 Pipeline faible — activer module Outreach")
        if health.get("growth_rate_period", 0) < 0:
            alerts.append("📉 Décroissance détectée")
        if opportunities and opportunities[0].get("roi_score", 0) > 5000:
            alerts.append(f"💎 HIGH VALUE: {opportunities[0]['company']}")
        return alerts

    def _generate_demo_leads(self) -> List[LeadData]:
        now = datetime.utcnow()
        return [
            LeadData(id="lead_001", email="marc@piscinehydrofix.com", name="Marc Tremblay", company="Piscines Hydrofix", stage=LeadStage.HOT, score=78, source="Scan Outreach IA", estimated_value=6995, created_at=now - timedelta(days=5), last_activity=now - timedelta(hours=2), plan_interest="automatisation_ia", interactions_count=4),
            LeadData(id="lead_002", email="julie@salonbeaute.ca", name="Julie Beaumont", company="Salon Beauté Éternelle", stage=LeadStage.QUALIFIED, score=85, source="Référence client", estimated_value=3495, created_at=now - timedelta(days=12), last_activity=now - timedelta(days=1), plan_interest="conversion_crm", interactions_count=6),
            LeadData(id="lead_003", email="pierre@toitures.com", name="Pierre Gagnon", company="Toitures Excellence", stage=LeadStage.WARM, score=55, source="Landing Page Audit", estimated_value=1495, created_at=now - timedelta(days=20), last_activity=now - timedelta(days=7), plan_interest="site_presence_google", interactions_count=2),
            LeadData(id="lead_004", email="sarah@clinique.ca", name="Sarah Dupuis", company="Clinique Santé Plus", stage=LeadStage.PROPOSAL_SENT, score=90, source="Outreach Direct", estimated_value=6995, created_at=now - timedelta(days=8), last_activity=now - timedelta(hours=12), plan_interest="automatisation_ia", interactions_count=8),
            LeadData(id="lead_005", email="luc@garageauto.ca", name="Luc Fournier", company="Garage AutoPro", stage=LeadStage.COLD, score=35, source="Scan Outreach IA", estimated_value=1495, created_at=now - timedelta(days=2), last_activity=now - timedelta(days=2), plan_interest="site_presence_google", interactions_count=0),
        ]

    async def get_live_roi_stats(self) -> Dict:
        if self._last_report and self._last_report_time:
            age = (datetime.utcnow() - self._last_report_time).total_seconds()
            if age < 300:
                report = self._last_report
            else:
                report = await self.generate_full_report()
        else:
            report = await self.generate_full_report()
        return {"timestamp": datetime.utcnow().isoformat(), "profit_counter": {"today": round(report.health_metrics.get("revenue_velocity_daily", 0), 2), "this_month": round(report.total_revenue_30d, 2), "mrr": round(report.current_mrr, 2), "arr_projected": round(report.current_mrr * 12, 2)}, "projections_summary": {"30_days": round(report.projections["30d"].projected_revenue, 2), "60_days": round(report.projections["60d"].projected_revenue, 2), "90_days": round(report.projections["90d"].projected_revenue, 2)}, "pipeline": {"active_leads": report.health_metrics.get("active_pipeline_leads", 0), "pipeline_value": round(report.projections["30d"].pipeline_value, 2), "conversion_rate": report.health_metrics.get("conversion_rate", 0)}, "growth_rate": report.health_metrics.get("growth_rate_period", 0), "alerts_count": len(report.alerts)}


roi_engine = ROIPredictionEngine()

if __name__ == "__main__":
    import asyncio
    async def main():
        report = await roi_engine.generate_full_report()
        print(json.dumps(report.to_dict(), indent=2, default=str))
    asyncio.run(main())
