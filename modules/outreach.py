"""
BlackWayConnect — Neural Sales Outreach Engine
===============================================
Scans local business URLs, extracts key signals (services, pricing cues,
pain points), and generates hyper-personalized sales scripts powered by
an LLM backbone.

Designed for the BlackWay ecosystem: plug into main.py FastAPI routes.
"""

import re
import json
import hashlib
from datetime import datetime, timezone
from dataclasses import dataclass, field, asdict
from typing import Optional


@dataclass
class BusinessProfile:
    name: str
    url: str
    services: list = field(default_factory=list)
    pain_signals: list = field(default_factory=list)
    location: Optional[str] = None
    scanned_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    fingerprint: str = ""

    def __post_init__(self):
        if not self.fingerprint:
            raw = f"{self.url}|{self.name}".encode()
            self.fingerprint = hashlib.sha256(raw).hexdigest()[:12]


@dataclass
class SalesScript:
    business: BusinessProfile
    hook: str
    value_prop: str
    cta: str
    channel: str = "email"
    generated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def render(self) -> str:
        return (
            f"[{self.channel.upper()}] Pour {self.business.name}\n"
            f"---\n"
            f"ACCROCHE: {self.hook}\n"
            f"PROPOSITION: {self.value_prop}\n"
            f"CTA: {self.cta}\n"
        )


class LocalBusinessScanner:
    SERVICE_KEYWORDS = [
        "piscine", "r\u00e9novation", "entretien", "installation",
        "chauffage", "toiture", "plomberie", "\u00e9lectricit\u00e9",
        "am\u00e9nagement", "design", "consultation", "livraison",
    ]

    PAIN_PATTERNS = [
        r"depuis\s+\d+\s+ans",
        r"appelez[- ]nous",
        r"soumission\s+gratuite",
        r"estimation",
        r"urgence|24\s*h",
    ]

    def scan(self, url: str, html_content: str, name: str = "") -> BusinessProfile:
        text_lower = html_content.lower()
        services = [kw for kw in self.SERVICE_KEYWORDS if kw in text_lower]
        pain_signals = [pat for pat in self.PAIN_PATTERNS if re.search(pat, text_lower)]
        inferred_name = name or self._extract_title(html_content) or url
        location = self._extract_location(html_content)
        return BusinessProfile(name=inferred_name, url=url, services=services, pain_signals=pain_signals, location=location)

    @staticmethod
    def _extract_title(html: str) -> str:
        m = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
        return m.group(1).strip() if m else ""

    @staticmethod
    def _extract_location(html: str) -> Optional[str]:
        m = re.search(r"[A-Z]\d[A-Z]\s?\d[A-Z]\d", html)
        return m.group(0) if m else None


class NeuralScriptGenerator:
    TEMPLATES = {
        "email": {
            "hook": "Bonjour {name} \u2014 j'ai remarqu\u00e9 que {pain_observation}.",
            "value_prop": "Chez BlackWay, on aide les entreprises comme la v\u00f4tre \u00e0 {value_action} sans effort suppl\u00e9mentaire.",
            "cta": "Un appel de 10 min cette semaine pour voir si \u00e7a fit?",
        },
        "sms": {
            "hook": "Salut {name}! Rapide question :",
            "value_prop": "{value_action} \u2014 \u00e7a vous parle?",
            "cta": "R\u00e9pondez OUI pour un aper\u00e7u gratuit.",
        },
    }

    PAIN_TO_VALUE = {
        r"appelez[- ]nous": ("vous n'avez pas encore de prise de RDV en ligne", "convertir vos visiteurs web en rendez-vous confirm\u00e9s"),
        r"soumission\s+gratuite": ("vous offrez des soumissions gratuites", "qualifier vos leads avant la soumission pour gagner du temps"),
        r"urgence|24\s*h": ("vous g\u00e9rez des appels d'urgence", "automatiser le tri des urgences pour lib\u00e9rer votre \u00e9quipe"),
        r"depuis\s+\d+\s+ans": ("votre expertise est reconnue depuis longtemps", "amplifier votre r\u00e9putation en ligne avec z\u00e9ro effort"),
    }

    def generate(self, profile: BusinessProfile, channel: str = "email") -> SalesScript:
        pain_obs, value_act = self._best_angle(profile)
        tpl = self.TEMPLATES.get(channel, self.TEMPLATES["email"])
        hook = tpl["hook"].format(name=profile.name, pain_observation=pain_obs)
        value_prop = tpl["value_prop"].format(value_action=value_act)
        cta = tpl["cta"]
        return SalesScript(business=profile, hook=hook, value_prop=value_prop, cta=cta, channel=channel)

    def _best_angle(self, profile: BusinessProfile):
        for signal in profile.pain_signals:
            for pattern, (obs, val) in self.PAIN_TO_VALUE.items():
                if re.search(pattern, signal):
                    return obs, val
        return ("votre site pourrait convertir davantage de visiteurs", "transformer votre trafic web en clients r\u00e9currents")

    def build_llm_prompt(self, profile: BusinessProfile, channel: str = "email") -> str:
        return json.dumps({"system": "Tu es un expert en vente B2B locale au Qu\u00e9bec. G\u00e9n\u00e8re un script de prospection ultra-personnalis\u00e9.", "context": asdict(profile), "instructions": {"channel": channel, "tone": "professionnel mais chaleureux", "length": "3 phrases max par section", "sections": ["accroche", "proposition_valeur", "call_to_action"]}}, ensure_ascii=False, indent=2)


class OutreachPipeline:
    def __init__(self):
        self.scanner = LocalBusinessScanner()
        self.generator = NeuralScriptGenerator()
        self.history: list = []

    def process_target(self, url: str, html_content: str, name: str = "", channel: str = "email") -> SalesScript:
        profile = self.scanner.scan(url, html_content, name)
        script = self.generator.generate(profile, channel)
        self.history.append({"profile": asdict(profile), "script_rendered": script.render(), "channel": channel})
        return script

    def batch_summary(self) -> dict:
        return {"total_processed": len(self.history), "channels_used": list({h["channel"] for h in self.history}), "last_run": datetime.now(timezone.utc).isoformat()}


if __name__ == "__main__":
    FAKE_HTML = '<html><head><title>Piscine Hydrofix</title></head><body><p>Depuis 15 ans, entretien et r\u00e9novation de piscines. Appelez-nous pour une soumission gratuite! Service urgence 24h.</p><address>H7W 2R3</address></body></html>'
    pipeline = OutreachPipeline()
    script = pipeline.process_target(url="https://piscinehydrofix.ca", html_content=FAKE_HTML, name="Piscine Hydrofix", channel="email")
    print(script.render())
    print(json.dumps(pipeline.batch_summary(), indent=2))
