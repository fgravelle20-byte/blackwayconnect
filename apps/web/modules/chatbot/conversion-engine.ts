import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { captureServerEvent } from "@/lib/posthog/server";

const bodySchema = z.object({
  visitor_id: z.string().min(8).max(120),
  session_id: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
  locale: z.enum(["en", "fr"]).default("fr"),
  email: z.string().email().optional(),
  name: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
});

type Reply = {
  session_id: string;
  reply: string;
  stage: string;
  cta?: { label: string; href: string };
  lead_captured?: boolean;
};

function detectIntent(text: string): string {
  const t = text.toLowerCase();
  if (/prix|price|forfait|plan|co[uû]t|combien|pricing/.test(t)) return "pricing";
  if (/site|website|landing|page web/.test(t)) return "website";
  if (/boutique|e-?commerce|shop|magasin/.test(t)) return "ecommerce";
  if (/chatbot|bot|conversation/.test(t)) return "chatbot";
  if (/t[eé]l[eé]phone|appel|phone|vocal/.test(t)) return "phone";
  if (/avis|review|google/.test(t)) return "reviews";
  if (/lead|crm|prospect/.test(t)) return "leads";
  if (/agence|agency|white.?label/.test(t)) return "agency";
  if (/module|seul|uniquement|juste/.test(t)) return "module";
  if (/oui|yes|ok|d['']accord|go|acheter|buy|start|commencer/.test(t)) return "yes";
  if (/@/.test(t) || /email|courriel/.test(t)) return "email";
  return "general";
}

function script(locale: "en" | "fr", stage: string, intent: string, message: string): Omit<Reply, "session_id"> {
  const fr = locale === "fr";

  if (stage === "greeting" || intent === "general") {
    return {
      stage: "qualify",
      reply: fr
        ? "Bienvenue chez BLACKWAYCONNECT — plateforme IA autonome. Je peux vous aider à : créer un site, chatbot qui convertit, boutique, leads, assistance téléphonique, avis Google. Que voulez-vous accomplir en premier ?"
        : "Welcome to BLACKWAYCONNECT — autonomous AI platform. I can help with: website, conversion chatbot, store, leads, phone assistance, Google reviews. What do you want first?",
      cta: { label: fr ? "Voir les forfaits" : "See plans", href: `/${locale}/pricing` },
    };
  }

  if (intent === "pricing" || intent === "module") {
    return {
      stage: "offer",
      reply: fr
        ? "3 façons d'acheter : 1) Forfait complet (Launch → Agency) 2) Un seul module (ex. Chatbot 49$/mois) 3) Pack Conversion (Chatbot+Leads+Avis). Lequel vous intéresse ?"
        : "3 ways to buy: 1) Full plan (Launch → Agency) 2) Single module (e.g. Chatbot $49/mo) 3) Conversion Pack. Which interests you?",
      cta: { label: fr ? "Forfaits & modules" : "Plans & modules", href: `/${locale}/pricing` },
    };
  }

  const moduleMap: Record<string, { fr: string; en: string; href: string }> = {
    website: {
      fr: "Le Module Site Web IA crée votre présence en minutes. À partir de 39$/mois — ou inclus dans Launch.",
      en: "AI Website Builder module from $39/mo — or included in Launch.",
      href: `/${locale}/pricing#modules`,
    },
    ecommerce: {
      fr: "Boutique en ligne : produits, commandes, magasin. Module dès 59$/mois ou forfait Grow+.",
      en: "Online store module from $59/mo or Grow+ plans.",
      href: `/${locale}/pricing#modules`,
    },
    chatbot: {
      fr: "Le Master Chatbot Conversion qualifie vos visiteurs 24/7 et capture les leads. Module dès 49$/mois — c'est notre arme #1 pour convertir.",
      en: "Master Conversion Chatbot qualifies visitors 24/7. From $49/mo — our #1 conversion weapon.",
      href: `/${locale}/pricing#modules`,
    },
    phone: {
      fr: "Assistance téléphonique IA : ne ratez plus aucun appel. Module dès 79$/mois.",
      en: "AI phone assistance — never miss a call. From $79/mo.",
      href: `/${locale}/pricing#modules`,
    },
    reviews: {
      fr: "Google Reviews : campagnes de demandes d'avis + suggestions IA (jamais de faux avis). Dès 39$/mois.",
      en: "Google Reviews campaigns + AI suggestions (never fake reviews). From $39/mo.",
      href: `/${locale}/pricing#modules`,
    },
    leads: {
      fr: "Leads CRM : centralisez prospects du site, chat, téléphone. Dès 29$/mois.",
      en: "Leads CRM from site, chat, phone. From $29/mo.",
      href: `/${locale}/pricing#modules`,
    },
    agency: {
      fr: "Agency OS : multi-clients + white-label. Idéal pour revendre la plateforme. Voir forfait Agency.",
      en: "Agency OS: multi-client + white-label. See Agency plan.",
      href: `/${locale}/pricing`,
    },
  };

  if (moduleMap[intent]) {
    const m = moduleMap[intent];
    return {
      stage: "capture",
      reply: fr ? m.fr + " Laissez votre email pour une démo ou un accès immédiat." : m.en + " Leave your email for a demo or instant access.",
      cta: { label: fr ? "Voir ce module" : "View module", href: m.href },
    };
  }

  if (intent === "yes" || stage === "capture") {
    return {
      stage: "capture",
      reply: fr
        ? "Parfait. Donnez-moi votre email (et nom si possible) — je crée votre lead et je vous oriente vers le bon forfait/module."
        : "Perfect. Share your email (and name) — I'll create your lead and route you to the right plan/module.",
      cta: { label: fr ? "Créer mon compte" : "Create account", href: `/${locale}/sign-up` },
    };
  }

  if (intent === "email" || message.includes("@")) {
    return {
      stage: "closing",
      reply: fr
        ? "Merci ! Votre lead est enregistré. Prochaine étape : choisissez un forfait ou un module, puis activez votre espace."
        : "Thanks! Your lead is saved. Next: pick a plan or module and activate your workspace.",
      cta: { label: fr ? "Choisir mon offre" : "Choose offer", href: `/${locale}/pricing` },
    };
  }

  return {
    stage: "qualify",
    reply: fr
      ? "Je peux clarifier forfaits, modules unitaires, ou démarrer une démo. Dites « site », « chatbot », « boutique », « prix »…"
      : "I can clarify plans, single modules, or start a demo. Say “website”, “chatbot”, “store”, “pricing”…",
    cta: { label: fr ? "Pricing" : "Pricing", href: `/${locale}/pricing` },
  };
}

export async function handleConversionChat(input: unknown): Promise<Reply> {
  const parsed = bodySchema.parse(input);
  const sb = createAdminSupabaseClient();
  const intent = detectIntent(parsed.message);

  let sessionId = parsed.session_id;
  let stage = "greeting";
  let leadId: string | null = null;

  if (sessionId) {
    const { data: existing } = await sb
      .from("conversion_chat_sessions")
      .select("id, stage, lead_id")
      .eq("id", sessionId)
      .maybeSingle();
    if (existing) {
      stage = existing.stage ?? "greeting";
      leadId = existing.lead_id;
    } else {
      sessionId = undefined;
    }
  }

  if (!sessionId) {
    const { data: created, error } = await sb
      .from("conversion_chat_sessions")
      .insert({
        visitor_id: parsed.visitor_id,
        locale: parsed.locale,
        stage: "greeting",
        metadata: {},
      })
      .select("id, stage")
      .single();
    if (error || !created) throw new Error(error?.message || "session_create_failed");
    sessionId = created.id;
    stage = created.stage;
  }

  await sb.from("conversion_chat_messages").insert({
    session_id: sessionId,
    role: "user",
    content: parsed.message,
  });

  const out = script(parsed.locale, stage, intent, parsed.message);
  let leadCaptured = false;

  const emailMatch = parsed.email || parsed.message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  if (emailMatch) {
    const { data: lead } = await sb
      .from("leads")
      .insert({
        organization_id: null,
        source: "chatbot",
        status: "new",
        name: parsed.name || null,
        email: emailMatch,
        phone: parsed.phone || null,
        metadata: {
          visitor_id: parsed.visitor_id,
          session_id: sessionId,
          locale: parsed.locale,
          last_intent: intent,
          channel: "conversion_master_chatbot",
        },
      })
      .select("id")
      .single();
    if (lead) {
      leadId = lead.id;
      leadCaptured = true;
      await sb
        .from("conversion_chat_sessions")
        .update({ lead_id: leadId, stage: out.stage, updated_at: new Date().toISOString() })
        .eq("id", sessionId);
      await captureServerEvent(parsed.visitor_id, "conversion_lead_captured", {
        session_id: sessionId,
        intent,
      });
    }
  } else {
    await sb
      .from("conversion_chat_sessions")
      .update({ stage: out.stage, updated_at: new Date().toISOString() })
      .eq("id", sessionId);
  }

  await sb.from("conversion_chat_messages").insert({
    session_id: sessionId,
    role: "assistant",
    content: out.reply,
  });

  await captureServerEvent(parsed.visitor_id, "conversion_chat_message", {
    session_id: sessionId,
    intent,
    stage: out.stage,
  });

  return {
    session_id: sessionId!,
    reply: out.reply,
    stage: out.stage,
    cta: out.cta,
    lead_captured: leadCaptured,
  };
}
