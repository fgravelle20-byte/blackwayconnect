/**
 * Mapping CRM Vorixa (Base44) pour la maquette G. Martel.
 *
 * Les IDs ci-dessous sont les fiches réelles créées dans vorixa.base44.app.
 * Les demandes électriques de la démo (Sophie Lavoie, etc.) restent en localStorage
 * et ne doivent jamais être poussées vers VorixaLead / VorixaClient.
 *
 * Ré-upsert : `VORIXA_BASE44_API_KEY=… npm run upsert:g-martel-vorixa`
 */

export const VORIXA_APP_ORIGIN = "https://vorixa.base44.app";

export const GM_CRM = {
  cleDossier: "g-martel-electricien",
  dossierId: "6aa20d343c348e26f4de654b",
  leadId: "6aa20d34e1f830e23c0006d3",
  clientId: "6aa20d34084092eaa761dae9",
  contactKey: "phone:4388858658",
} as const;

export const DOSSIER_STATUTS = [
  "Prospect",
  "Qualifié",
  "Chaud",
  "Accord confirmé",
  "Projet démarré",
  "Client actif",
  "À valider",
  "Inactif",
] as const;

export type DossierStatutRelation = (typeof DOSSIER_STATUTS)[number];

export const DOSSIER_PRIORITES = ["Critique", "Haute", "Normale", "Basse"] as const;

export type DossierPriorite = (typeof DOSSIER_PRIORITES)[number];

export const LEAD_ETAPES = ["Nouveau", "Qualifié", "Démo", "Converti"] as const;

export type VorixaLeadEtape = (typeof LEAD_ETAPES)[number];

export const CLIENT_STATUTS = ["Actif", "Inactif", "Prospect", "Churned"] as const;

export type VorixaClientStatut = (typeof CLIENT_STATUTS)[number];

/** Entité Base44 `vorixa-dossier-client` — champs utilisés pour ce prospect. */
export type VorixaDossierClient = {
  id: string;
  cle_dossier: string;
  nom_entreprise: string;
  contact_nom: string;
  contact_email?: string;
  contact_telephone?: string;
  client_id?: string;
  lead_id?: string;
  projet_id?: string;
  statut_relation: DossierStatutRelation;
  priorite?: DossierPriorite;
  score?: number;
  besoin_principal?: string;
  solution_recommandee?: string;
  prochaine_action?: string;
  prochaine_action_date?: string;
  derniere_interaction?: string;
  preuve_accord?: string;
  etat_projet?: string;
  offre_statut?: string;
  montant_offre?: number;
  dossier_json?: string;
  audit_at?: string;
};

export type VorixaLeadRecord = {
  id: string;
  nom: string;
  entreprise: string;
  telephone?: string;
  email?: string;
  contact_key?: string;
  client_id?: string;
  etape: VorixaLeadEtape;
  source?: string;
  notes?: string;
  date_contact?: string;
};

export type VorixaClientRecord = {
  id: string;
  nom_entreprise: string;
  contact_nom: string;
  contact_telephone?: string;
  contact_key?: string;
  lead_id?: string;
  adresse?: string;
  ville?: string;
  province?: string;
  code_postal?: string;
  description?: string;
  secteur_activite?: string;
  site_web_actuel?: string;
  statut: VorixaClientStatut;
  /** Forfait cible, pas un abonnement payé. Personnalisé = maquette hors catalogue self-serve. */
  plan: "Personnalisé";
};

export const GM_DOSSIER_JSON = {
  maquette: 1,
  total: 19,
  slug: "g-martel",
  path: "/maquettes/g-martel",
  titre: "Centre de demandes électriques VORIXA",
  irritant: "Appel hors heures, demande vague, soumission non suivie",
  positionnement: "demonstration_commerciale",
  exclusions: ["livrable_deja_construit", "analyse_technique_complete", "resultats_garantis"],
  offre_initiale: [
    "accueil_mobile_3_cta",
    "formulaire_intelligent",
    "confirmation_delai_rappel",
    "tableau_urgences",
  ],
  montee_coche: ["rappels_sms", "assignation_zone", "relance_soumissions", "avis_google"],
  avant_envoi:
    "Valider l'identité, le décideur (Guillaume Martel) et le besoin réel lors d'un court échange.",
  source_publique: {
    site: "https://gmartel.ca/",
    telephone: "438-885-8658",
    adresse: "10-240 Rodolphe-Besner, Vaudreuil-Dorion, QC J7V 8P2",
    territoire: "Vaudreuil-Soulanges et Grand Montréal",
  },
} as const;

export const GM_DOSSIER: VorixaDossierClient = {
  id: GM_CRM.dossierId,
  cle_dossier: GM_CRM.cleDossier,
  nom_entreprise: "G. Martel Entrepreneur Électricien inc.",
  contact_nom: "Guillaume Martel",
  contact_telephone: "438-885-8658",
  client_id: GM_CRM.clientId,
  lead_id: GM_CRM.leadId,
  statut_relation: "À valider",
  priorite: "Haute",
  score: 65,
  besoin_principal:
    "Capter les demandes électriques hors heures et remplacer les appels manqués ou les courriels vagues par une fiche déjà triée.",
  solution_recommandee:
    "Centre de demandes électriques VORIXA — maquette de démonstration commerciale, pas un livrable déjà construit.",
  prochaine_action:
    "Court échange pour valider l'identité, le décideur (Guillaume Martel) et le besoin réel avant envoi de la maquette.",
  prochaine_action_date: "2026-09-17",
  derniere_interaction: "2026-09-10",
  etat_projet: "maquette_demonstration_1_sur_19",
  offre_statut: "maquette_demonstration",
  dossier_json: JSON.stringify(GM_DOSSIER_JSON),
  audit_at: "2026-09-10",
};

export const GM_LEAD: VorixaLeadRecord = {
  id: GM_CRM.leadId,
  nom: "Guillaume Martel",
  entreprise: "G. Martel Entrepreneur Électricien inc.",
  telephone: "438-885-8658",
  contact_key: GM_CRM.contactKey,
  client_id: GM_CRM.clientId,
  etape: "Nouveau",
  source: "Cold outreach",
  date_contact: "2026-09-10",
  notes:
    "Maquette Vorixa 1/19 — Centre de demandes électriques. Démonstration commerciale (pas un livrable déjà construit, pas une analyse technique complète, pas une promesse de résultats). Parcours local : /maquettes/g-martel. Prochaine action : court échange pour valider l'identité, le décideur et le besoin réel avant envoi. Ne pas importer les fiches de démo (propriétaires fictifs) dans le CRM Vorixa.",
};

export const GM_CLIENT: VorixaClientRecord = {
  id: GM_CRM.clientId,
  nom_entreprise: "G. Martel Entrepreneur Électricien inc.",
  contact_nom: "Guillaume Martel",
  contact_telephone: "438-885-8658",
  contact_key: GM_CRM.contactKey,
  lead_id: GM_CRM.leadId,
  adresse: "10-240 Rodolphe-Besner",
  ville: "Vaudreuil-Dorion",
  province: "QC",
  code_postal: "J7V 8P2",
  description:
    "Maître électricien. Territoire : Vaudreuil-Soulanges et Grand Montréal. Identité publique à valider avant envoi de la maquette.",
  secteur_activite: "Électricité résidentielle, commerciale et industrielle",
  site_web_actuel: "https://gmartel.ca/",
  statut: "Prospect",
  plan: "Personnalisé",
};

export function dossierField(label: string, value: string | number | undefined): { label: string; value: string } {
  return { label, value: value == null || value === "" ? "—" : String(value) };
}
