export type MaquetteStatus = "ready" | "upcoming";

export type MaquetteEntry = {
  n: number;
  slug: string;
  prospect: string;
  title: string;
  irritant: string;
  status: MaquetteStatus;
  /** Clé stable `vorixa-dossier-client.cle_dossier` when the prospect is in Vorixa CRM. */
  cleDossier?: string;
  statutRelation?: string;
};

export type RequestIntent = "soumission" | "urgence" | "rappel";

export type PropertyType = "residentiel" | "commercial" | "industriel";

export type WorkType =
  | "panne"
  | "panneau"
  | "borne"
  | "piscine"
  | "generatrice"
  | "renovation"
  | "eclairage"
  | "autre";

export type UrgencyLevel = "standard" | "24h" | "now";

export type RequestStatus = "new" | "callback_sent" | "quoted" | "scheduled";

export type ElectricalRequest = {
  id: string;
  createdAt: number;
  intent: RequestIntent;
  propertyType: PropertyType;
  workType: WorkType;
  urgency: UrgencyLevel;
  zone: string;
  name: string;
  phone: string;
  description: string;
  photoUrl?: string;
  status: RequestStatus;
  callbackEta: string;
  source: "live" | "seed" | "scenario";
};
