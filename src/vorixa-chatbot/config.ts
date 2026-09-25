import type { VorixaChatbot, VorixaChatbotSource } from "./types";

/** Website record already created in Vorixa (Base44). */
export const WEBSITE_ID = "6a8def2f8d8360a47327387e";

/** Live VorixaChatbot id in Base44 (vorixa.ca). */
export const CHATBOT_ID = "6a8def335122047eb5aba440";

export const WIDGET_SCRIPT_URL = "https://vorixa.base44.app/functions/chatbotWidget";

export const CLINIC = {
  brand: "L'Avenir Clinique Dentaire",
  legal: "Clinique dentaire de l'Avenir",
  city: "Laval",
  address: "1575 boulevard de l'Avenir, suite 200",
  cityLine: "Laval (QC) H7S 2N5",
  phoneDisplay: "450 663-8088",
  phoneTel: "4506638088",
  fax: "450 663-6272",
  email: "info@cliniqueavenir.com",
  site: "https://cliniqueavenir.com",
  hours: [
    { day: "Lundi", hours: "8 h – 18 h" },
    { day: "Mardi", hours: "8 h – 17 h" },
    { day: "Mercredi", hours: "8 h – 17 h" },
    { day: "Jeudi", hours: "8 h – 18 h" },
    { day: "Vendredi", hours: "8 h – 16 h 30" },
    { day: "Samedi", hours: "Fermé" },
    { day: "Dimanche", hours: "Fermé" },
  ],
  team: [
    "Dre Stéphanie Gallant, DMD — propriétaire, chirurgie et dentisterie esthétique",
    "Dr Pierre Rochon — dentiste généraliste",
    "Dre Marlee Gauthier — dentiste, chirurgie",
    "Dre Marie-Ève Lauzon — dentiste généraliste, aligneurs transparents",
    "Camille Boutet — denturologiste",
    "Jacinthe Babin — gestionnaire",
  ],
  services: [
    "CEREC (couronnes en une visite)",
    "Traitements de canal",
    "Restaurations",
    "Traitement des gencives",
    "Chirurgies dentaires",
    "Couronnes, facettes et ponts",
    "Blanchiment des dents",
    "Denturologie",
    "Sédation consciente",
    "Traitements pour articulations (ATM)",
    "Implantologie",
    "Orthodontie (aligneurs transparents)",
  ],
};

export const DEFAULT_WELCOME =
  "Bonjour ! Bienvenue à L'Avenir Clinique Dentaire. Comment puis-je vous aider avec vos soins dentaires aujourd'hui ?";

export function buildEmbedCode(botId: string): string {
  return `<script src="${WIDGET_SCRIPT_URL}" data-bot-id="${botId}"></script>`;
}

export const SOURCE_CONTENT = `Clinique dentaire de l'Avenir (L'Avenir Clinique Dentaire), Laval.

Adresse : ${CLINIC.address}, ${CLINIC.cityLine}.
Téléphone : ${CLINIC.phoneDisplay}. Télécopieur : ${CLINIC.fax}.
Courriel : ${CLINIC.email}.
Site : ${CLINIC.site}.

Heures (page Contact) :
${CLINIC.hours.map((h) => `- ${h.day} : ${h.hours}`).join("\n")}

Équipe :
${CLINIC.team.map((t) => `- ${t}`).join("\n")}

Services : ${CLINIC.services.join(", ")}.

Urgence : appeler ${CLINIC.phoneDisplay}. Ne pas inventer de tarifs. Objectif : capturer nom + téléphone pour un rappel.
Ne jamais promettre un résultat clinique ni un délai médical.`.trim();

export function defaultChatbot(): VorixaChatbot {
  return {
    id: CHATBOT_ID,
    website_id: WEBSITE_ID,
    nom: "Assistant L'Avenir Clinique Dentaire",
    avatar_url: "/vorixa/avenir-avatar.svg",
    couleur: "#7c3aed",
    message_accueil: DEFAULT_WELCOME,
    objectif: "Capture de leads",
    actif: true,
    conversations_total: 0,
    leads_captures: 0,
    embed_code: buildEmbedCode(CHATBOT_ID),
  };
}

export function defaultSource(chatbotId: string): VorixaChatbotSource {
  return {
    id: "src-avenir-clinique",
    chatbot_id: chatbotId,
    type: "Texte",
    titre: "Clinique dentaire de l'Avenir — connaissances",
    contenu: SOURCE_CONTENT,
    statut: "Entraîné",
    tokens: Math.round(SOURCE_CONTENT.length / 4),
  };
}
