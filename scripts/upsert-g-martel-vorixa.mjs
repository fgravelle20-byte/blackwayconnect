#!/usr/bin/env node
/**
 * Idempotent upsert of G. Martel into Vorixa Base44 CRM.
 *
 * Usage:
 *   VORIXA_BASE44_API_KEY=… npm run upsert:g-martel-vorixa
 *
 * Never pass the key as a CLI argument. Never write it to the repo.
 * Does not create fake electrical customers (demo homeowners).
 */

const API = "https://vorixa.base44.app/api/entities";
const CLE = "g-martel-electricien";
const CONTACT_KEY = "phone:4388858658";

const dossierJson = {
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
};

const leadPayload = {
  nom: "Guillaume Martel",
  entreprise: "G. Martel Entrepreneur Électricien inc.",
  telephone: "438-885-8658",
  contact_key: CONTACT_KEY,
  etape: "Nouveau",
  source: "Cold outreach",
  date_contact: "2026-09-10",
  notes:
    "Maquette Vorixa 1/19 — Centre de demandes électriques. Démonstration commerciale (pas un livrable déjà construit, pas une analyse technique complète, pas une promesse de résultats). Parcours local : /maquettes/g-martel. Prochaine action : court échange pour valider l'identité, le décideur et le besoin réel avant envoi. Ne pas importer les fiches de démo (propriétaires fictifs) dans le CRM Vorixa.",
};

const clientPayload = {
  nom_entreprise: "G. Martel Entrepreneur Électricien inc.",
  contact_nom: "Guillaume Martel",
  contact_telephone: "438-885-8658",
  contact_key: CONTACT_KEY,
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
  score_maturite: 40,
  derniere_interaction: "2026-09-10",
};

const dossierPayload = {
  cle_dossier: CLE,
  nom_entreprise: "G. Martel Entrepreneur Électricien inc.",
  contact_nom: "Guillaume Martel",
  contact_telephone: "438-885-8658",
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
  dossier_json: JSON.stringify(dossierJson),
  audit_at: "2026-09-10",
};

function requireKey() {
  const key = process.env.VORIXA_BASE44_API_KEY || process.env.VORIXA_API_KEY;
  if (!key) {
    console.error("Missing VORIXA_BASE44_API_KEY (server secret only — never VITE_ / never commit).");
    process.exit(1);
  }
  return key;
}

async function api(key, method, path, body) {
  const url =
    method === "GET" && path.includes("?")
      ? `${API}/${path}`
      : `${API}/${path}`;
  const res = await fetch(url, {
    method,
    headers: { api_key: key, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 800)}`);
  }
  return data;
}

async function findOne(key, entity, query) {
  const q = encodeURIComponent(JSON.stringify(query));
  const rows = await api(key, "GET", `${entity}?q=${q}&limit=5`);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function upsert(key, entity, existing, payload) {
  if (existing?.id) {
    return api(key, "PUT", `${entity}/${existing.id}`, payload);
  }
  return api(key, "POST", entity, payload);
}

async function main() {
  const key = requireKey();

  const existingDossier = await findOne(key, "vorixa-dossier-client", { cle_dossier: CLE });
  const existingLead =
    (existingDossier?.lead_id
      ? await api(key, "GET", `VorixaLead/${existingDossier.lead_id}`).catch(() => null)
      : null) || (await findOne(key, "VorixaLead", { contact_key: CONTACT_KEY }));
  const existingClient =
    (existingDossier?.client_id
      ? await api(key, "GET", `VorixaClient/${existingDossier.client_id}`).catch(() => null)
      : null) || (await findOne(key, "VorixaClient", { contact_key: CONTACT_KEY }));

  const lead = await upsert(key, "VorixaLead", existingLead, leadPayload);
  const client = await upsert(key, "VorixaClient", existingClient, {
    ...clientPayload,
    lead_id: lead.id,
  });
  const dossier = await upsert(key, "vorixa-dossier-client", existingDossier, {
    ...dossierPayload,
    lead_id: lead.id,
    client_id: client.id,
  });
  await api(key, "PUT", `VorixaLead/${lead.id}`, { client_id: client.id });

  console.log(
    JSON.stringify(
      {
        cle_dossier: CLE,
        dossier_id: dossier.id,
        lead_id: lead.id,
        client_id: client.id,
        statut_relation: dossier.statut_relation,
        lead_etape: lead.etape,
        client_statut: client.statut,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
