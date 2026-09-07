import type { PropertyType, RequestIntent, UrgencyLevel, WorkType } from "../types";

export const GM = {
  brand: "G. Martel",
  legal: "G. Martel Entrepreneur Électricien inc.",
  title: "Centre de demandes électriques",
  phone: "438-885-8658",
  phoneHref: "tel:4388858658",
  address: "10-240 Rodolphe-Besner, Vaudreuil-Dorion, QC J7V 8P2",
  owner: "Guillaume Martel",
  ownerRole: "Maître électricien",
  territory: "Vaudreuil-Soulanges et Grand Montréal",
  facebook: "https://www.facebook.com/104557598386737",
};

export const PROPERTY_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: "residentiel", label: "Résidentiel" },
  { value: "commercial", label: "Commercial" },
  { value: "industriel", label: "Industriel" },
];

export const WORK_OPTIONS: { value: WorkType; label: string }[] = [
  { value: "panne", label: "Panne / disjoncteur" },
  { value: "panneau", label: "Panneau électrique" },
  { value: "borne", label: "Borne de recharge" },
  { value: "piscine", label: "Piscine ou spa" },
  { value: "generatrice", label: "Génératrice" },
  { value: "renovation", label: "Rénovation / construction" },
  { value: "eclairage", label: "Éclairage" },
  { value: "autre", label: "Autre travail" },
];

export const URGENCY_OPTIONS: { value: UrgencyLevel; label: string; hint: string }[] = [
  { value: "now", label: "Urgence maintenant", hint: "Réponse immédiate, haut de liste" },
  { value: "24h", label: "Dans les 24 h", hint: "Rappel prioritaire le matin" },
  { value: "standard", label: "Standard", hint: "Fiche client structurée, rappel planifié" },
];

export const ZONE_OPTIONS = [
  "Vaudreuil-Dorion",
  "Saint-Lazare",
  "Hudson",
  "Pincourt",
  "Île-Perrot",
  "Notre-Dame-de-l’Île-Perrot",
  "Rigaud",
  "Grand Montréal",
  "Autre (préciser dans la description)",
];

export const INTENT_COPY: Record<RequestIntent, { title: string; lead: string; submit: string }> = {
  urgence: {
    title: "Urgence électrique",
    lead: "Décrivez la situation et joignez une photo. Guillaume reçoit la demande déjà triée — pas un courriel vague.",
    submit: "Envoyer l’urgence",
  },
  soumission: {
    title: "Demander une soumission",
    lead: "Type de propriété, nature du travail, zone et photos. Une fiche client structurée est créée automatiquement.",
    submit: "Envoyer la demande",
  },
  rappel: {
    title: "Planifier un rappel",
    lead: "Laissez vos coordonnées et la zone. Vous recevez une confirmation avec le créneau de rappel.",
    submit: "Planifier le rappel",
  },
};

export function labelProperty(v: PropertyType): string {
  return PROPERTY_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

export function labelWork(v: WorkType): string {
  return WORK_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

export function labelUrgency(v: UrgencyLevel): string {
  return URGENCY_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

export function callbackFor(urgency: UrgencyLevel, intent: RequestIntent): string {
  if (intent === "urgence" || urgency === "now") return "Rappel sous 15 minutes";
  if (urgency === "24h") return "Rappel avant 10 h demain";
  if (intent === "rappel") return "Rappel demain entre 8 h et 12 h";
  return "Rappel le prochain jour ouvrable, 8 h–12 h";
}
