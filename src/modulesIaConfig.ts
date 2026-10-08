/**
 * Modules IA — Chatbot IA (site web) + Accueil vocal IA (ligne téléphonique).
 * Add-ons mensuels Wix Payments, sans essai. Stockés séparément du Grow Hub
 * et du Pack Cellulaire (colonnes forfait_chatbot / forfait_vocal côté pipe).
 */
import { paymentPlanUrl } from "./paymentCatalog";

export type ModuleIaLine = "chatbot" | "vocal";

export type ModuleIaKey =
  | "ia_chatbot_1"
  | "ia_chatbot_5"
  | "ia_chatbot_illimite"
  | "ia_vocal_basic"
  | "ia_vocal_avance"
  | "ia_vocal_premium";

export type ModuleIaPlan = {
  key: ModuleIaKey;
  line: ModuleIaLine;
  nameFr: string;
  nameEn: string;
  amountCad: number;
  featured?: boolean;
  featuresFr: string[];
  featuresEn: string[];
};

export const MODULES_IA: Record<ModuleIaKey, ModuleIaPlan> = {
  ia_chatbot_1: {
    key: "ia_chatbot_1",
    line: "chatbot",
    nameFr: "Chatbot IA — 1 chatbot",
    nameEn: "AI Chatbot — 1 chatbot",
    amountCad: 99,
    featuresFr: ["1 chatbot sur ton site", "Réponses 24/7 FR + EN", "Leads envoyés au CRM BlackWay"],
    featuresEn: ["1 chatbot on your website", "24/7 answers FR + EN", "Leads sent to BlackWay CRM"],
  },
  ia_chatbot_5: {
    key: "ia_chatbot_5",
    line: "chatbot",
    nameFr: "Chatbot IA — 5 chatbots",
    nameEn: "AI Chatbot — 5 chatbots",
    amountCad: 249,
    featured: true,
    featuresFr: ["Jusqu'à 5 chatbots (sites / pages)", "Réponses 24/7 FR + EN", "Leads envoyés au CRM BlackWay"],
    featuresEn: ["Up to 5 chatbots (sites / pages)", "24/7 answers FR + EN", "Leads sent to BlackWay CRM"],
  },
  ia_chatbot_illimite: {
    key: "ia_chatbot_illimite",
    line: "chatbot",
    nameFr: "Chatbot IA — Illimité",
    nameEn: "AI Chatbot — Unlimited",
    amountCad: 399,
    featuresFr: ["Chatbots illimités", "Réponses 24/7 FR + EN", "Leads envoyés au CRM BlackWay"],
    featuresEn: ["Unlimited chatbots", "24/7 answers FR + EN", "Leads sent to BlackWay CRM"],
  },
  ia_vocal_basic: {
    key: "ia_vocal_basic",
    line: "vocal",
    nameFr: "Accueil vocal IA — Basic",
    nameEn: "AI Voice reception — Basic",
    amountCad: 149,
    featuresFr: ["Réceptionniste IA sur ta ligne", "Prise de messages + résumé courriel", "FR + EN"],
    featuresEn: ["AI receptionist on your line", "Message taking + email summary", "FR + EN"],
  },
  ia_vocal_avance: {
    key: "ia_vocal_avance",
    line: "vocal",
    nameFr: "Accueil vocal IA — Avancé",
    nameEn: "AI Voice reception — Advanced",
    amountCad: 299,
    featured: true,
    featuresFr: ["Tout Basic", "Qualification des appels + leads au CRM", "Transfert vers ton équipe"],
    featuresEn: ["Everything in Basic", "Call qualification + leads to CRM", "Transfer to your team"],
  },
  ia_vocal_premium: {
    key: "ia_vocal_premium",
    line: "vocal",
    nameFr: "Accueil vocal IA — Premium",
    nameEn: "AI Voice reception — Premium",
    amountCad: 499,
    featuresFr: ["Tout Avancé", "Prise de rendez-vous", "Suivi prioritaire BlackWay"],
    featuresEn: ["Everything in Advanced", "Appointment booking", "Priority BlackWay support"],
  },
};

export const CHATBOT_ORDER: ModuleIaKey[] = ["ia_chatbot_1", "ia_chatbot_5", "ia_chatbot_illimite"];
export const VOCAL_ORDER: ModuleIaKey[] = ["ia_vocal_basic", "ia_vocal_avance", "ia_vocal_premium"];

export function isModuleIaKey(value: string | null | undefined): value is ModuleIaKey {
  return !!value && Object.prototype.hasOwnProperty.call(MODULES_IA, value);
}

export function moduleIaCheckoutUrl(
  key: ModuleIaKey,
  opts: { source?: string; lang?: "fr" | "en"; content?: string } = {},
): string {
  return paymentPlanUrl(key, { lang: opts.lang, source: opts.source || "modules_ia", content: opts.content });
}