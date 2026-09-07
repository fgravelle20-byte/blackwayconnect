import type { ElectricalRequest } from "./types";

const STORAGE_KEY = "vorixa-maquette-g-martel-v1";

function hoursAgo(hours: number): number {
  return Date.now() - hours * 60 * 60 * 1000;
}

export const SEED_REQUESTS: ElectricalRequest[] = [
  {
    id: "seed-borne",
    createdAt: hoursAgo(18),
    intent: "soumission",
    propertyType: "residentiel",
    workType: "borne",
    urgency: "standard",
    zone: "Vaudreuil-Dorion",
    name: "Nathalie Côté",
    phone: "450-555-0142",
    description: "Installation d’une borne de recharge 40 A dans le garage. Photo du panneau jointe.",
    photoUrl: "/maquettes/g-martel/panel.jpg",
    status: "quoted",
    callbackEta: "Rappel le lendemain, 8 h–10 h",
    source: "seed",
  },
  {
    id: "seed-eclairage",
    createdAt: hoursAgo(42),
    intent: "soumission",
    propertyType: "commercial",
    workType: "eclairage",
    urgency: "24h",
    zone: "Hudson",
    name: "Restaurant Le Quai",
    phone: "450-555-0198",
    description: "Remplacement de l’éclairage salle à manger + enseigne. Soumission envoyée, non signée.",
    photoUrl: "/maquettes/g-martel/hero.jpg",
    status: "quoted",
    callbackEta: "Soumission envoyée — en attente de signature",
    source: "seed",
  },
  {
    id: "seed-rappel",
    createdAt: hoursAgo(5),
    intent: "rappel",
    propertyType: "residentiel",
    workType: "generatrice",
    urgency: "standard",
    zone: "Saint-Lazare",
    name: "Marc Bissonnette",
    phone: "514-555-0177",
    description: "Veut discuter d’une génératrice de secours pour la maison. Préfère un rappel demain matin.",
    status: "callback_sent",
    callbackEta: "Rappel demain 9 h",
    source: "seed",
  },
];

export function loadRequests(): ElectricalRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_REQUESTS;
    const parsed = JSON.parse(raw) as ElectricalRequest[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_REQUESTS;
    return parsed;
  } catch {
    return SEED_REQUESTS;
  }
}

export function saveRequests(requests: ElectricalRequest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

export function resetRequests(): ElectricalRequest[] {
  localStorage.removeItem(STORAGE_KEY);
  return SEED_REQUESTS;
}

export function urgencyRank(urgency: ElectricalRequest["urgency"]): number {
  if (urgency === "now") return 0;
  if (urgency === "24h") return 1;
  return 2;
}

export function sortRequests(requests: ElectricalRequest[]): ElectricalRequest[] {
  return [...requests].sort((a, b) => {
    const u = urgencyRank(a.urgency) - urgencyRank(b.urgency);
    if (u !== 0) return u;
    return b.createdAt - a.createdAt;
  });
}

export function newRequestId(): string {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
