/**
 * BlackWay Pipe - tuyauterie CRM BlackWayConnect
 * PAYMENT-LOCKED — Paddle auto-fulfill chain. See ops/payment-lock/LOCKED.json.
 * Endpoints:
 *   GET  /health            -> etat du service + presence des secrets (sans fuite)
 *   GET  /paddle/client-config -> jeton client live_… pour /payer (public navigateur)
 *   POST /lead              -> formulaire site web  -> Master CRM (+ HubSpot optionnel)
 *   POST /webhooks/paddle   -> paiement Paddle verifie -> active le forfait (portail + CRM)
 *   POST /portal/claim      -> session_id (Cache) ou email -> jeton portail
 *   GET  /portal/me         -> refresh session portail
 *   GET  /crm/leads         -> Master CRM board (X-BW-Key)
 *   POST /ops/engine/tick   -> SLA/relance machine (cron 15 min + X-BW-Key)
 * Portail — pipeline BlackWay. HubSpot is optional sync, not the product brain.
 * Claim apres paiement: Paddle webhook + Cache; aucune cle Stripe requise.
 *
 * Activation auto (signature verifiee): checkout.session.completed | async_payment_succeeded
 * | invoice.paid | invoice.payment_succeeded → bw_forfait + bw_forfait_paye = forfait paye
 * (grow_hub_spark … partner). Idempotent via bw_idempotency_key.
 *
 * Vorixa service géré invoices ($499 / $999 / $1500 / $3000) are NOT Grow Hub.
 * See vorixaManaged.js — they must not unlock the BlackWay portail.
 */

import { isVorixaManagedStripeObject } from "./vorixaManaged.js";
import { scoreKingLead } from "./kingLeads.js";
import { upsertMasterLead, listMasterLeads, patchMasterLead, runAutonomyTick, engineStatus } from "./masterCrm.js";
import {
  hasMasterDb, recordPayment, getCustomer, getPayment, customerIsActive, customerIsBlocked, applySubscriptionStatus,
  importCustomer, listCustomers, getMeta, setMeta,
} from "./customers.js";

const ABONNEMENT_INACTIF =
  "Abonnement inactif (annulé ou en pause) — réactive ton forfait sur blackwayconnect.com/forfaits.";

const HS = "https://api.hubapi.com";
const PIPELINE = "2117849055";
const ST_NEW = "3584700391";   // Nouvelle opportunite
const ST_PAID = "3584700395";  // Paiement recu

// Grille marche 2026-08 : 6 recurrents + projets + enterprise (sur devis).
const FORFAITS = {
  website_lead_launch: { label: "Site Fondation",            prix: 3500, delai: 21, recurrent: false, score: 70 },
  revenue_system:      { label: "Systeme Revenu",            prix: 7500, delai: 35, recurrent: false, score: 85 },
  ai_scale:            { label: "Application mobile & IA",   prix: 7995, delai: 45, recurrent: false, score: 95 },
  grow_hub_spark:      { label: "Grow Hub Spark",            prix: 99,   delai: 7,  recurrent: true,  score: 55, line: "web" },
  grow_hub_launch:     { label: "BlackWayConnect Launch",    prix: 149,  delai: 7,  recurrent: true,  score: 65, line: "web" },
  grow_hub_growth:     { label: "BlackWayConnect Growth",    prix: 349,  delai: 7,  recurrent: true,  score: 80, line: "web" },
  grow_hub_scale:      { label: "BlackWayConnect Automation",prix: 699,  delai: 7,  recurrent: true,  score: 88, line: "web" },
  grow_hub_command:    { label: "Grow Hub Command",          prix: 1249, delai: 7,  recurrent: true,  score: 93, line: "web" },
  grow_hub_partner:    { label: "Grow Hub Partner",          prix: 2499, delai: 7,  recurrent: true,  score: 97, line: "web" },
  cell_signal:         { label: "Cell Signal",               prix: 79,   delai: 7,  recurrent: true,  score: 58, line: "cellulaire" },
  cell_route:          { label: "Cell Route",                prix: 199,  delai: 7,  recurrent: true,  score: 68, line: "cellulaire" },
  cell_fleet:          { label: "Cell Fleet",                prix: 399,  delai: 7,  recurrent: true,  score: 82, line: "cellulaire" },
  cell_command:        { label: "Cell Command",              prix: 799,  delai: 7,  recurrent: true,  score: 90, line: "cellulaire" },
  ia_chatbot_1:        { label: "Chatbot IA — 1 chatbot",    prix: 99,   delai: 7,  recurrent: true,  score: 60, line: "chatbot" },
  ia_chatbot_5:        { label: "Chatbot IA — 5 chatbots",   prix: 249,  delai: 7,  recurrent: true,  score: 70, line: "chatbot" },
  ia_chatbot_illimite: { label: "Chatbot IA — Illimité",     prix: 399,  delai: 7,  recurrent: true,  score: 80, line: "chatbot" },
  ia_vocal_basic:      { label: "Accueil vocal IA — Basic",  prix: 149,  delai: 7,  recurrent: true,  score: 65, line: "vocal" },
  ia_vocal_avance:     { label: "Accueil vocal IA — Avancé", prix: 299,  delai: 7,  recurrent: true,  score: 75, line: "vocal" },
  ia_vocal_premium:    { label: "Accueil vocal IA — Premium",prix: 499,  delai: 7,  recurrent: true,  score: 85, line: "vocal" },
  enterprise:          { label: "Entreprise (sur devis)",    prix: 4999, delai: 14, recurrent: true,  score: 99, line: "web" },
};

// Price IDs live (src/stripeConfig.ts) — filet si metadata / client_reference_id absents.
const PRICE_TO_FORFAIT = {
  price_1U1FKzAG7HUL9RtrC2bJrFVP: "grow_hub_spark",
  price_1U1FLbAG7HUL9Rtr3QF6c4pC: "grow_hub_launch",
  price_1U1FLcAG7HUL9RtrgSob9cmw: "grow_hub_growth",
  price_1U1FLdAG7HUL9RtrWL5IQyME: "grow_hub_scale",
  price_1U1FLeAG7HUL9Rtrc8R6DEdZ: "grow_hub_command",
  price_1U1FLfAG7HUL9RtruTYWaERD: "grow_hub_partner",
};

// Existing Paddle live catalog (monthly + yearly). No duplicate prices are created.
const PADDLE_PRICE_TO_FORFAIT = {
  pri_01kxtn6asavavmqv54407h464b: "grow_hub_launch",
  pri_01kxtn6avpw2gpgrmaxax9tmwy: "grow_hub_launch",
  pri_01kxtn6b41wzt07rnzvyte4sn8: "grow_hub_growth",
  pri_01kxtn6b6ba8szneb21wx51dz6: "grow_hub_growth",
  pri_01kxtn6befjw8m8gz9a5vwf0wf: "grow_hub_scale",
  pri_01kxtn6bgrd0wwv1sdsqjv5ry2: "grow_hub_scale",
  // 2026-09-29 — remaining Grow Hub tiers, Pack Cellulaire, modules IA (monthly).
  pri_01m3nt7rm1cc19134bb3e86fpb: "grow_hub_spark",
  pri_01m3nt7rs3vajzyv8k8r57qswc: "grow_hub_command",
  pri_01m3nt7rxx08w09zef4xf2rage: "grow_hub_partner",
  pri_01m3nt7s39b94k4p7a13m3sya2: "cell_signal",
  pri_01m3nt7s88bxrx8k6jph2gmtt2: "cell_route",
  pri_01m3nt7sd8mkr915y6vtgs6m3p: "cell_fleet",
  pri_01m3nt7sj4wndn0qkd9d855zpr: "cell_command",
  pri_01m3nt7sqgkcqb2payzrn0f8cf: "ia_chatbot_1",
  pri_01m3nt7ss5526fp4j6q98zdqc0: "ia_chatbot_5",
  pri_01m3nt7stvq4ff1942nybarhxn: "ia_chatbot_illimite",
  pri_01m3nt7szxc265whjs40e2y5pd: "ia_vocal_basic",
  pri_01m3nt7t1k43gy04eyf71amkd5: "ia_vocal_avance",
  pri_01m3nt7t39xq8pbggfeh6ejax4: "ia_vocal_premium",
};

// Payment Link IDs → forfait. Live ids from src/stripeConfig.ts PLUS the 2026-09-06
// deactivated generation (still present on older Checkout Sessions).
const PLINK_TO_FORFAIT = {
  // Live (replaced 2026-09-06)
  plink_1UCmB6AG7HUL9RtrpvUpROqh: "grow_hub_spark",
  plink_1UCmBxAG7HUL9RtrUdOVuMNm: "grow_hub_launch",
  plink_1UCmBzAG7HUL9RtrG7wA53Aq: "grow_hub_growth",
  plink_1UCmC0AG7HUL9RtrSOaDDzbo: "grow_hub_scale",
  plink_1UCmBJAG7HUL9RtrnvIfFOMn: "grow_hub_command",
  plink_1UCmBKAG7HUL9RtrFzh2ZDB1: "grow_hub_partner",
  // Legacy (deactivated public URLs — keep for webhook fallback)
  plink_1U1FMTAG7HUL9RtrDCjxRIl6: "grow_hub_spark",
  plink_1U1FMUAG7HUL9RtrqsOarwY3: "grow_hub_launch",
  plink_1U1FMTAG7HUL9RtrDvKqcL9e: "grow_hub_growth",
  plink_1U1FMzAG7HUL9RtrIPzQYi9n: "grow_hub_scale",
  plink_1U1FMTAG7HUL9RtrODdZgiSo: "grow_hub_command",
  plink_1U1FMYAG7HUL9RtruMZLdQo2: "grow_hub_partner",
};

// Montants CAD (cents) — dernier filet invoices / sessions sans price id.
// Live Grow Hub: 149 / 349 / 699. Legacy Stripe 249 / 499 / 749 still mapped.
// 99900 ($999) is NOT a Grow Hub price — do not map it (unmapped invoice / other product).
// 49900 may also be Vorixa Départ géré — Vorixa objects are excluded
// before this fallback (isVorixaManagedStripeObject).
const AMOUNT_CENTS_TO_FORFAIT = {
  // Live Grow Hub CAD (Paddle / current catalog)
  9900: "grow_hub_spark",
  14900: "grow_hub_launch",
  34900: "grow_hub_growth",
  69900: "grow_hub_scale",
  124900: "grow_hub_command",
  249900: "grow_hub_partner",
  // Legacy Stripe ladder (still resolve old invoices)
  24900: "grow_hub_launch",
  49900: "grow_hub_growth",
  74900: "grow_hub_scale",
  // Pack Cellulaire
  7900: "cell_signal",
  19900: "cell_route",
  39900: "cell_fleet",
  79900: "cell_command",
};

// Correspondance libelle Stripe / nom de produit / client_reference_id -> valeur interne HubSpot
const ALIAS = {
  "website & lead launch": "website_lead_launch",
  "website and lead launch": "website_lead_launch",
  "site haute conversion": "website_lead_launch",
  "site fondation": "website_lead_launch",
  "site foundation": "website_lead_launch",
  "revenue system": "revenue_system",
  "systeme de revenus": "revenue_system",
  "système de revenus": "revenue_system",
  "systeme revenu": "revenue_system",
  "ai scale": "ai_scale",
  "application mobile": "ai_scale",
  "application mobile & ia": "ai_scale",
  "grow hub spark": "grow_hub_spark",
  "spark": "grow_hub_spark",
  "etincelle": "grow_hub_spark",
  "étincelle": "grow_hub_spark",
  "grow hub launch": "grow_hub_launch",
  "launch": "grow_hub_launch",
  "grow hub growth": "grow_hub_growth",
  "growth": "grow_hub_growth",
  "grow hub scale": "grow_hub_scale",
  "scale": "grow_hub_scale",
  "grow hub command": "grow_hub_command",
  "command": "grow_hub_command",
  "commande": "grow_hub_command",
  "grow hub partner": "grow_hub_partner",
  "partner": "grow_hub_partner",
  "partenaire": "grow_hub_partner",
  "cell signal": "cell_signal",
  "cell_signal": "cell_signal",
  "signal": "cell_signal",
  "cell route": "cell_route",
  "cell_route": "cell_route",
  "route": "cell_route",
  "cell fleet": "cell_fleet",
  "cell_fleet": "cell_fleet",
  "fleet": "cell_fleet",
  "cell command": "cell_command",
  "cell_command": "cell_command",
  "chatbot": "ia_chatbot_1",
  "chatbot ia": "ia_chatbot_1",
  "accueil vocal": "ia_vocal_basic",
  "accueil vocal ia": "ia_vocal_basic",
  "enterprise": "enterprise",
  "entreprise": "enterprise",
};

function isCellulaireForfait(key) {
  return String(key || "").startsWith("cell_");
}

/** Product line of a forfait: web (Grow Hub) | cellulaire | chatbot | vocal. */
function forfaitLine(key) {
  return FORFAITS[key]?.line || (isCellulaireForfait(key) ? "cellulaire" : "web");
}

const FREE_MAIL = ["gmail.com","hotmail.com","hotmail.ca","outlook.com","yahoo.com","yahoo.ca","icloud.com","live.ca","videotron.ca","sympatico.ca"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-BW-Key, Authorization",
};

const PORTAL_TTL_SEC = 30 * 24 * 3600; // ~30 days
const SESSION_CACHE_TTL_SEC = 90 * 24 * 3600; // webhook → claim durable (90 jours)
const SESSION_CACHE_ORIGIN = "https://bw-pipe-session-cache.internal";
const HS_PORTAL_PROPS = [
  "email",
  "bw_forfait_paye",
  "bw_forfait",
  "bw_forfait_cellulaire",
  "lifecyclestage",
  "firstname",
  "lastname",
  "bw_last_checkout_session",
];

/** Isolate-local memo: HubSpot property bw_last_checkout_session exists. */
let _bwSessionPropReady = false;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...CORS } });

function resoudreForfait(v) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  if (FORFAITS[s]) return s;
  if (ALIAS[s]) return ALIAS[s];
  const norm = s.replace(/[^a-z]+/g, "_");
  return FORFAITS[norm] ? norm : null;
}

/** Extrait le forfait depuis client_reference_id (ex. site_web:grow_hub_growth). */
function forfaitFromClientRef(ref) {
  if (!ref) return null;
  const s = String(ref).trim();
  const parts = s.split(":");
  const candidate = parts.length >= 2 ? parts[parts.length - 1] : s;
  return resoudreForfait(candidate);
}

function forfaitFromPriceId(priceId) {
  if (!priceId) return null;
  return PRICE_TO_FORFAIT[priceId] || null;
}

function forfaitFromPlink(plink) {
  if (!plink) return null;
  const id = typeof plink === "string" ? plink : plink.id;
  return (id && PLINK_TO_FORFAIT[id]) || null;
}

function forfaitFromAmountCents(cents) {
  if (cents == null || cents === "") return null;
  const n = Number(cents);
  if (!Number.isFinite(n) || n <= 0) return null;
  return AMOUNT_CENTS_TO_FORFAIT[n] || null;
}

/** Resolve forfait from Checkout Session / Invoice / Subscription payload. */
function forfaitFromStripeObject(s) {
  if (isVorixaManagedStripeObject(s)) return null;
  const meta = s.metadata || {};
  const subMeta = s.subscription_details?.metadata || {};
  const fromMeta = resoudreForfait(
    meta.bw_forfait || meta.forfait || subMeta.bw_forfait || subMeta.forfait,
  );
  if (fromMeta) return fromMeta;
  const fromRef = forfaitFromClientRef(s.client_reference_id);
  if (fromRef) return fromRef;
  const fromPlink = forfaitFromPlink(s.payment_link);
  if (fromPlink) return fromPlink;
  const items = s.items?.data || [];
  for (const item of items) {
    const priceId = item.price?.id || item.plan?.id || item.price;
    const fromPrice = forfaitFromPriceId(typeof priceId === "string" ? priceId : null);
    if (fromPrice) return fromPrice;
    const fromNick = resoudreForfait(item.price?.nickname || item.plan?.nickname || item.price?.product?.name);
    if (fromNick) return fromNick;
  }
  const lines = s.lines?.data || s.display_items || [];
  for (const line of lines) {
    const priceId = line.price?.id || line.pricing?.price_details?.price || line.price;
    const fromPrice = forfaitFromPriceId(typeof priceId === "string" ? priceId : null);
    if (fromPrice) return fromPrice;
    const fromDesc = resoudreForfait(line.description || line.custom?.name || line.price?.nickname);
    if (fromDesc) return fromDesc;
    const fromLineAmt = forfaitFromAmountCents(line.amount_total ?? line.amount);
    if (fromLineAmt) return fromLineAmt;
  }
  const fromAmt = forfaitFromAmountCents(
    s.amount_total ?? s.amount_paid ?? s.total ?? s.amount_due ?? s.amount,
  );
  if (fromAmt) return fromAmt;
  return resoudreForfait(s.lines?.data?.[0]?.description) || null;
}

function emailFromStripeObject(s) {
  const meta = s.metadata || {};
  const cd = s.customer_details || {};
  return String(
    cd.email ||
    s.customer_email ||
    s.customer_details?.email ||
    meta.email ||
    meta.bw_email ||
    (typeof s.customer === "object" ? s.customer?.email : null) ||
    "",
  ).trim().toLowerCase();
}

function score(forfait, email, montant, recurrent) {
  let s = FORFAITS[forfait]?.score ?? 50;
  if (recurrent) s += 5;
  if (montant >= 4000) s += 5;
  const dom = (email || "").split("@")[1]?.toLowerCase();
  if (dom && !FREE_MAIL.includes(dom)) s += 5;
  return Math.min(s, 100);
}

/** Twin Turbo Full Performance — blend catalog score (volume) with diagnostic pressure (quality). */
function twinTurboLeadScore(base, p) {
  const leakRaw = p.leak_score ?? p.twin_score ?? p.leakScore;
  const leak = Number(leakRaw);
  const hasLeak = Number.isFinite(leak);
  const volume = Number(p.volume_turbo);
  const quality = Number(p.quality_turbo);
  let turboA = base;
  let turboB = 50;
  if (Number.isFinite(volume)) turboA = Math.max(turboA, Math.min(100, Math.round(volume)));
  if (Number.isFinite(quality)) turboB = Math.min(100, Math.round(quality));
  else if (hasLeak) turboB = Math.min(100, Math.round(40 + Math.max(0, Math.min(100, leak)) * 0.55));
  if (p.band === "high" || p.urgence === "elevee") turboB = Math.min(100, turboB + 5);
  if (!hasLeak && !Number.isFinite(volume) && !Number.isFinite(quality)) return base;
  return Math.min(100, Math.round(turboA * 0.45 + turboB * 0.55));
}

function twinTurboNote(p, sc) {
  const lines = [
    "Twin Turbo Full Performance",
    `engine_mode=${p.engine_mode || "twin_turbo_full_performance"}`,
    `bw_lead_score=${sc}`,
    `leak_score=${p.leak_score ?? "n/a"}`,
    `volume_turbo=${p.volume_turbo ?? "n/a"}`,
    `quality_turbo=${p.quality_turbo ?? "n/a"}`,
    `twin_score=${p.twin_score ?? "n/a"}`,
    `band=${p.band || "n/a"}`,
  ];
  if (p.answers && typeof p.answers === "object") {
    lines.push("answers=" + JSON.stringify(p.answers).slice(0, 800));
  }
  if (p.message) lines.push("", "Message:", String(p.message).slice(0, 1500));
  return lines.join("\n");
}

const dateISO = (jours) => new Date(Date.now() + jours * 864e5).toISOString().slice(0, 10);

/** Tolere un jeton colle avec des guillemets, des espaces ou le prefixe "Bearer ". */
function jeton(env) {
  return String(env.HUBSPOT_TOKEN || "").trim().replace(/^["']|["']$/g, "").replace(/^Bearer\s+/i, "").trim();
}

async function hs(env, method, path, body) {
  const r = await fetch(HS + path, {
    method,
    headers: { Authorization: `Bearer ${jeton(env)}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const txt = await r.text();
  let data = {};
  try { data = txt ? JSON.parse(txt) : {}; } catch { data = { raw: txt }; }
  return { status: r.status, data };
}

async function upsertContact(env, email, props) {
  let r = await hs(env, "POST", "/crm/v3/objects/contacts", { properties: { ...props, email } });
  if (r.status === 200 || r.status === 201) return r.data.id;
  const s = await hs(env, "POST", "/crm/v3/objects/contacts/search", {
    filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }], limit: 1,
  });
  const id = s.data?.results?.[0]?.id;
  if (!id) throw new Error("contact KO " + JSON.stringify(r.data).slice(0, 200));
  await hs(env, "PATCH", `/crm/v3/objects/contacts/${id}`, { properties: props });
  return id;
}

/** Cree le deal. La propriete unique bw_idempotency_key garantit zero doublon (meme en cas de rejeu Stripe). */
async function createDeal(env, name, stage, props, contactId) {
  const r = await hs(env, "POST", "/crm/v3/objects/deals", {
    properties: { ...props, dealname: name, pipeline: PIPELINE, dealstage: stage },
    associations: [{ to: { id: contactId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }] }],
  });
  if (r.status === 200 || r.status === 201) return { id: r.data.id, cree: true };
  const msg = JSON.stringify(r.data);
  if (msg.includes("already has that value")) {
    const ids = (msg.split("already has that value")[0].match(/\d{9,}/g) || []);
    return { id: ids[ids.length - 1] || "existant", cree: false };
  }
  throw new Error("deal KO " + msg.slice(0, 300));
}

async function recordMasterLead(env, p) {
  try {
    const king = scoreKingLead(p);
    return await upsertMasterLead(env, p, king);
  } catch (e) {
    console.log("master crm upsert", e);
    return null;
  }
}

/** HubSpot is an optional mirror: writes only when HUBSPOT_SYNC=on (or when no Master DB is bound). */
function hubspotSync(env) {
  if (!jeton(env)) return false;
  if (!hasMasterDb(env)) return true;
  return String(env.HUBSPOT_SYNC || "off").trim().toLowerCase() === "on";
}

async function traiterLead(env, p) {
  const master = await recordMasterLead(env, p);
  const forfait = resoudreForfait(p.forfait) || "grow_hub_growth";
  const f = FORFAITS[forfait];
  const base = score(forfait, p.email, f.prix, f.recurrent);
  const sc = twinTurboLeadScore(base, p);
  // Master CRM is the brain; HubSpot only as mirror, or last resort if the Master write failed.
  if (master && !hubspotSync(env)) {
    return {
      contact: master.id,
      deal: null,
      score: master.score,
      grade: master.grade,
      statut: "master_crm",
      master_crm: master.id,
      brain: "blackway_master_crm",
    };
  }
  if (!master && !jeton(env)) throw new Error("lead non enregistre (Master CRM indisponible)");
  try {
  const contactId = await upsertContact(env, p.email, {
    firstname: p.prenom || "", lastname: p.nom || "", phone: p.telephone || "", company: p.entreprise || "",
    bw_forfait: forfait, bw_source: p.source || "form_web", bw_urgence: p.urgence || "normal",
    bw_lead_score: sc, bw_budget_estime: f.prix, bw_icp: p.icp || "oui_pme", lifecyclestage: "lead",
  });
  const segmentBits = [
    p.engine_mode === "twin_turbo_full_performance" ? "Twin Turbo" : null,
    p.band ? `band=${p.band}` : null,
    p.message || "lead entrant",
  ].filter(Boolean);
  const d = await createDeal(env, `${f.label} - ${p.entreprise || [p.prenom, p.nom].join(" ").trim()}`, ST_NEW, {
    amount: f.prix, bw_forfait: forfait, bw_source: p.source || "form_web", bw_urgence: p.urgence || "normal",
    bw_lead_score: sc, bw_deadline: dateISO(f.delai), bw_livraison_statut: "non_demarre",
    bw_idempotency_key: `lead:${p.email}:${forfait}:${new Date().toISOString().slice(0, 10)}`,
    bw_segment: segmentBits.join(" · ").slice(0, 200),
  }, contactId);
  if (d.cree && (p.message || p.leak_score != null || p.twin_score != null || p.answers)) {
    await hs(env, "POST", "/crm/v3/objects/notes", {
      properties: { hs_timestamp: new Date().toISOString(), hs_note_body: twinTurboNote(p, sc) },
      associations: [{ to: { id: d.id }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }] }],
    });
  }
  return {
    contact: contactId,
    deal: d.id,
    score: sc,
    engine: p.engine_mode || null,
    volume_turbo: p.volume_turbo ?? null,
    quality_turbo: p.quality_turbo ?? null,
    statut: d.cree ? "cree" : "doublon evite",
    master_crm: master?.id || null,
    brain: "blackway_master_crm",
  };
  } catch (e) {
    if (master) {
      return {
        contact: master.id,
        deal: null,
        score: master.score,
        statut: "master_crm",
        brain: "blackway_master_crm",
      };
    }
    throw e;
  }
}

/**
 * Verified payment → Master DB (customer + payment, idempotent on payment_id) → Master CRM "won".
 * HubSpot deal only when mirroring is on. A Master DB failure throws so the sender retries.
 */
async function traiterPaiement(env, p) {
  if (!p.email) throw new Error("paiement sans courriel");
  if (!p.payment_id) throw new Error("paiement sans id stable");
  const forfait = resoudreForfait(p.forfait) || "grow_hub_growth";
  const f = FORFAITS[forfait];
  const sc = score(forfait, p.email, p.montant, f.recurrent);
  const masterDb = hasMasterDb(env);
  let created = null;
  if (masterDb) {
    const r = await recordPayment(env, { ...p, forfait, montant: p.montant || f.prix });
    created = r.created;
  }
  if (created !== false) {
    await recordMasterLead(env, {
      email: p.email,
      prenom: p.prenom,
      nom: p.nom,
      entreprise: p.entreprise,
      forfait,
      source: "portail",
      stage: "won",
      message: `Paiement ${p.processor === "paddle" ? "Paddle" : "Stripe"} ${p.payment_id} ${p.montant || f.prix} CAD${p.renouvellement ? " (renouvellement)" : ""}`,
    });
  }
  let mirror = null;
  if (hubspotSync(env)) {
    try {
      mirror = await mirrorPaiementHubspot(env, p, forfait, sc);
    } catch (e) {
      if (!masterDb) throw e;
      console.log("hubspot mirror paiement", p.payment_id, e);
    }
  }
  const dejaTraite = masterDb ? created === false : mirror?.cree === false;
  return {
    contact: mirror?.contact || null,
    deal: mirror?.deal || null,
    score: sc,
    forfait,
    master_db: masterDb,
    hubspot_mirror: !!mirror,
    statut: dejaTraite ? "deja traite - aucun doublon" : "cree",
  };
}

async function mirrorPaiementHubspot(env, p, forfait, sc) {
  const f = FORFAITS[forfait];
  const cell = isCellulaireForfait(forfait);
  const processor = p.processor === "paddle" ? "paddle" : "stripe";
  // HubSpot bw_source enum: form_web | portail | stripe | campagne | reference | prospection
  // Keep "paddle"/"cellulaire" in notes + segment; never send them as bw_source.
  const hsSource = cell || processor === "paddle" ? "portail" : "stripe";
  const segment = p.segment || (cell ? "cellulaire" : `paiement ${processor}`);
  const who = p.entreprise || [p.prenom, p.nom].join(" ").trim() || p.email;
  const dealLabel = p.renouvellement
    ? `${f.label} - RENOUVELLEMENT - ${who}`
    : `${f.label} - PAYE - ${who}`;
  const sessionPropOk = await ensureBwLastCheckoutSessionProp(env);
  const contactProps = {
    firstname: p.prenom || "", lastname: p.nom || "", company: p.entreprise || "",
    bw_forfait_paye: forfait,
    bw_source: hsSource,
    bw_lead_score: sc, lifecyclestage: "customer",
  };
  if (cell) {
    contactProps.bw_forfait_cellulaire = forfait;
  } else {
    contactProps.bw_forfait = forfait;
  }
  // Only set if property exists — unknown props can break HubSpot upsert.
  if (sessionPropOk && p.checkout_session_id) {
    contactProps.bw_last_checkout_session = String(p.checkout_session_id);
  }
  let contactId;
  try {
    contactId = await upsertContact(env, p.email, contactProps);
  } catch (e) {
    // HubSpot may lack bw_forfait_cellulaire — retry without it.
    if (cell && contactProps.bw_forfait_cellulaire) {
      delete contactProps.bw_forfait_cellulaire;
      contactProps.bw_forfait = forfait;
      contactId = await upsertContact(env, p.email, contactProps);
    } else {
      throw e;
    }
  }
  const d = await createDeal(env, dealLabel, ST_PAID, {
    amount: p.montant || f.prix, bw_forfait: forfait,
    bw_source: hsSource, bw_urgence: "elevee",
    bw_lead_score: sc, bw_deadline: dateISO(f.delai), bw_livraison_statut: "non_demarre",
    bw_stripe_payment_id: p.payment_id, bw_idempotency_key: `pay:${p.payment_id}`,
    bw_segment: segment,
  }, contactId);
  if (!d.cree) return { contact: contactId, deal: d.id, cree: false };
  await hs(env, "POST", "/crm/v3/objects/notes", {
    properties: {
      hs_timestamp: new Date().toISOString(),
      hs_note_body: `Paiement ${processor === "paddle" ? "Paddle" : "Stripe"} ${p.payment_id} - ${f.label} - ${p.montant}$ CAD.\nPortail Client Master : https://blackwayconnect.com/portail\n${p.renouvellement ? "Renouvellement abonnement." : `Livraison a demarrer, echeance ${dateISO(f.delai)}.`}`,
    },
    associations: [{ to: { id: d.id }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }] }],
  });
  return { contact: contactId, deal: d.id, cree: true };
}

function portalSecret(env) {
  return String(env.BW_PORTAL_SECRET || env.BW_LEAD_KEY || "bw-portal-dev").trim();
}

function b64urlEncode(bytes) {
  let bin = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecodeToBytes(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSign(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return b64urlEncode(sig);
}

async function hmacVerify(secret, message, sigB64url) {
  const expected = await hmacSign(secret, message);
  if (expected.length !== sigB64url.length) return false;
  let out = 0;
  for (let i = 0; i < expected.length; i++) out |= expected.charCodeAt(i) ^ sigB64url.charCodeAt(i);
  return out === 0;
}

async function mintPortalToken(env, email, forfait) {
  const exp = Math.floor(Date.now() / 1000) + PORTAL_TTL_SEC;
  const payload = `${String(email).trim().toLowerCase()}|${forfait}|${exp}`;
  const payloadB64 = b64urlEncode(new TextEncoder().encode(payload));
  const sig = await hmacSign(portalSecret(env), payload);
  return { token: `${payloadB64}.${sig}`, exp };
}

async function verifyPortalToken(env, token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) throw new Error("token invalide");
  const [payloadB64, sig] = parts;
  const payload = new TextDecoder().decode(b64urlDecodeToBytes(payloadB64));
  const ok = await hmacVerify(portalSecret(env), payload, sig);
  if (!ok) throw new Error("signature invalide");
  const [email, forfait, expStr] = payload.split("|");
  const exp = Number(expStr);
  if (!email || !forfait || !exp) throw new Error("token mal forme");
  if (exp * 1000 < Date.now()) throw new Error("session expiree");
  return { email, forfait, exp };
}

function portalSessionShape(email, access, token, exp) {
  const webKey = access.forfait && forfaitLine(access.forfait) === "web" ? access.forfait : null;
  const cellKey = access.forfaitCellulaire || null;
  const chatbotKey = access.forfaitChatbot || null;
  const vocalKey = access.forfaitVocal || null;
  const primary = access.forfait || "grow_hub_growth";
  const f = FORFAITS[primary] || FORFAITS.grow_hub_growth;
  const line = (key) => (key ? { key, label: FORFAITS[key]?.label || key, amountCad: FORFAITS[key]?.prix || null } : null);
  return {
    token,
    email,
    forfait: primary,
    forfaitWeb: webKey,
    forfaitCellulaire: cellKey,
    forfaitChatbot: chatbotKey,
    forfaitVocal: vocalKey,
    label: f.label,
    labelCellulaire: cellKey ? FORFAITS[cellKey]?.label || null : null,
    amountCad: f.prix,
    amountCadCellulaire: cellKey ? FORFAITS[cellKey]?.prix || null : null,
    modules: [line(chatbotKey), line(vocalKey)].filter(Boolean),
    exp,
  };
}

function contactHasCustomerAccess(props) {
  const life = String(props?.lifecyclestage || "").toLowerCase();
  const paid = String(props?.bw_forfait_paye || "").trim();
  const cell = String(props?.bw_forfait_cellulaire || "").trim();
  return life === "customer" || !!paid || !!cell;
}

async function searchHsContact(env, propertyName, value) {
  const r = await hs(env, "POST", "/crm/v3/objects/contacts/search", {
    filterGroups: [{ filters: [{ propertyName, operator: "EQ", value }] }],
    properties: HS_PORTAL_PROPS,
    limit: 1,
  });
  return r.data?.results?.[0] || null;
}

function sessionCacheRequest(sessionId) {
  return new Request(`${SESSION_CACHE_ORIGIN}/payment/${encodeURIComponent(sessionId)}`);
}

function isPaymentReference(id) {
  return String(id || "").startsWith("cs_") || String(id || "").startsWith("txn_");
}

/** Persist Stripe cs_… or Paddle txn_… → email/forfait before HubSpot finishes. */
async function putSessionMap(env, sessionId, payload) {
  const id = String(sessionId || "").trim();
  if (!isPaymentReference(id)) return;
  const email = String(payload?.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return;
  const body = JSON.stringify({
    email,
    forfait: payload?.forfait || null,
    at: Date.now(),
    payment_id: id,
  });
  if (env.BW_SESSIONS) {
    try {
      await env.BW_SESSIONS.put(`payment:${id}`, body, { expirationTtl: SESSION_CACHE_TTL_SEC });
      // Email index — claim by email still works if txn link lost from browser.
      await env.BW_SESSIONS.put(`email:${email}`, body, { expirationTtl: SESSION_CACHE_TTL_SEC });
    } catch (e) {
      console.log("session kv put", e);
    }
  }
  try {
    await caches.default.put(
      sessionCacheRequest(id),
      new Response(body, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `public, max-age=${SESSION_CACHE_TTL_SEC}`,
        },
      }),
    );
  } catch (e) {
    console.log("session cache put", e);
  }
}

async function getSessionMap(env, sessionId) {
  const id = String(sessionId || "").trim();
  if (!isPaymentReference(id)) return null;
  if (env.BW_SESSIONS) {
    try {
      const v = await env.BW_SESSIONS.get(`payment:${id}`, "json");
      if (v?.email) return v;
      const legacy = id.startsWith("cs_") ? await env.BW_SESSIONS.get(`cs:${id}`, "json") : null;
      if (legacy?.email) return legacy;
    } catch {
      /* ignore */
    }
  }
  try {
    const hit = await caches.default.match(sessionCacheRequest(id));
    if (hit) {
      const v = await hit.json();
      if (v?.email) return v;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Discover a HubSpot property group already used by bw_* contact props. */
async function hsBwContactGroupName(env) {
  const t = jeton(env);
  if (!t) return "contactinformation";
  try {
    const r = await fetch(`${HS}/crm/v3/properties/contacts?archived=false`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!r.ok) return "contactinformation";
    const data = await r.json();
    const bw = (data.results || []).find(
      (p) => p.name === "bw_forfait" || p.name === "bw_forfait_paye" || String(p.name || "").startsWith("bw_"),
    );
    return bw?.groupName || "contactinformation";
  } catch {
    return "contactinformation";
  }
}

/** Check whether the optional HubSpot contact property exists.
 * Read-only by design: health/payment processing must never attempt schema writes.
 * This avoids 403 errors when the HubSpot token lacks crm.schemas.contacts.write.
 */
async function ensureBwLastCheckoutSessionProp(env) {
  if (_bwSessionPropReady) return true;
  const t = jeton(env);
  if (!t) return false;
  try {
    const get = await fetch(HS + "/crm/v3/properties/contacts/bw_last_checkout_session", {
      headers: { Authorization: `Bearer ${t}` },
    });
    _bwSessionPropReady = get.status === 200;
    return _bwSessionPropReady;
  } catch (e) {
    console.log("checkBwLastCheckoutSessionProp", e);
    return false;
  }
}

/** Fallback: deal bw_stripe_payment_id often equals cs_… for checkout.session.completed. */
async function claimFromDealSession(env, sessionId) {
  const dealSearch = await hs(env, "POST", "/crm/v3/objects/deals/search", {
    filterGroups: [{
      filters: [{ propertyName: "bw_stripe_payment_id", operator: "EQ", value: sessionId }],
    }],
    properties: ["bw_forfait", "bw_stripe_payment_id"],
    limit: 1,
  });
  const deal = dealSearch.data?.results?.[0];
  if (!deal?.id) return null;
  const assoc = await hs(env, "GET", `/crm/v3/objects/deals/${deal.id}/associations/contacts`);
  const contactId = assoc.data?.results?.[0]?.toObjectId || assoc.data?.results?.[0]?.id;
  if (!contactId) return null;
  const c = await hs(
    env,
    "GET",
    `/crm/v3/objects/contacts/${contactId}?properties=${HS_PORTAL_PROPS.join(",")}`,
  );
  if (c.status !== 200 || !c.data?.properties) return null;
  const props = c.data.properties;
  const email = String(props.email || "").trim().toLowerCase();
  if (!email) return null;
  const forfait = resoudreForfait(
    props.bw_forfait_paye || props.bw_forfait || deal.properties?.bw_forfait,
  );
  return { email, forfait };
}

function forfaitFromPaddleTransaction(transaction) {
  // The paid price decides the forfait: custom_data is set by the browser and can be tampered with.
  const items = transaction?.items || transaction?.details?.line_items || [];
  for (const item of items) {
    const priceId = item?.price?.id || item?.price_id;
    if (priceId && PADDLE_PRICE_TO_FORFAIT[priceId]) return PADDLE_PRICE_TO_FORFAIT[priceId];
  }
  if (items.length) return null;
  return resoudreForfait(transaction?.custom_data?.bw_forfait || transaction?.custom_data?.forfait);
}

/** Relay payload → forfait. Accepts plan keys, Paddle price ids, custom_data or a raw transaction. */
function forfaitFromProvisionPayload(p) {
  const direct = resoudreForfait(
    p?.forfait || p?.plan || p?.bw_forfait
      || p?.custom_data?.bw_forfait || p?.customData?.bw_forfait,
  );
  if (direct) return direct;
  const priceId = String(p?.price_id || p?.priceId || "").trim();
  if (priceId && PADDLE_PRICE_TO_FORFAIT[priceId]) return PADDLE_PRICE_TO_FORFAIT[priceId];
  const txn = p?.transaction || p?.data;
  if (txn && typeof txn === "object") {
    const fromTxn = forfaitFromPaddleTransaction(txn);
    if (fromTxn) return fromTxn;
  }
  if (Array.isArray(p?.items)) return forfaitFromPaddleTransaction({ items: p.items });
  return null;
}

async function paddleCustomerEmail(env, customerId) {
  const key = String(env.PADDLE_API_KEY || "").trim();
  if (!key || !String(customerId || "").startsWith("ctm_")) return "";
  const r = await fetch(`https://api.paddle.com/customers/${encodeURIComponent(customerId)}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  if (!r.ok) throw new Error(`client Paddle introuvable (${r.status})`);
  const body = await r.json();
  return String(body?.data?.email || "").trim().toLowerCase();
}

/** Pull path: verify txn_ with the Paddle API and activate, independent of webhook/relay delivery. */
async function activateFromPaddleTransaction(env, transactionId) {
  const key = String(env.PADDLE_API_KEY || "").trim();
  if (!key || !String(transactionId).startsWith("txn_")) return null;
  const r = await fetch(
    `https://api.paddle.com/transactions/${encodeURIComponent(transactionId)}?include=customer`,
    { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } },
  );
  if (!r.ok) return null;
  const txn = (await r.json())?.data || {};
  if (!["completed", "paid"].includes(String(txn.status || ""))) return null;
  const forfait = forfaitFromPaddleTransaction(txn);
  if (!forfait) return null;
  const email = String(txn.customer?.email || "").trim().toLowerCase()
    || await paddleCustomerEmail(env, txn.customer_id);
  if (!email) return null;
  await putSessionMap(env, transactionId, { email, forfait });
  const cents = Number(txn?.details?.totals?.total || txn?.details?.totals?.grand_total || 0);
  try {
    await traiterPaiement(env, {
      email,
      prenom: "",
      nom: "",
      entreprise: txn.custom_data?.entreprise || "",
      forfait,
      payment_id: transactionId,
      checkout_session_id: transactionId,
      montant: cents > 0 ? cents / 100 : FORFAITS[forfait].prix,
      processor: "paddle",
      segment: "paiement paddle (verification portail)",
    });
  } catch (e) {
    console.error("activation paddle au claim", transactionId, e);
  }
  return { email, forfait };
}

/** Owner console overview from the Master DB (same shape as the legacy HubSpot overview). */
async function masterOverview(env) {
  const [{ customers, payments }, board] = await Promise.all([listCustomers(env, 50), listMasterLeads(env)]);
  const leads = (board.leads || []).slice(0, 50);
  const paidDeals = payments.map((pay) => {
    const f = FORFAITS[pay.forfait] || FORFAITS.grow_hub_growth;
    return {
      id: pay.payment_id,
      dealname: `${f.label} - ${pay.renewal ? "RENOUVELLEMENT" : "PAYE"} - ${pay.email}`,
      dealstage: ST_PAID,
      pipeline: PIPELINE,
      amount: pay.amount_cad != null ? String(pay.amount_cad) : String(f.prix),
      bw_source: "portail",
      bw_forfait: pay.forfait,
      bw_lead_score: null,
      bw_livraison_statut: "non_demarre",
      bw_segment: pay.segment || `paiement ${pay.processor || ""}`.trim(),
      createdate: pay.created_at,
      hs_lastmodifieddate: pay.created_at,
    };
  });
  const leadDeals = leads
    .filter((l) => l.stage !== "won" && l.stage !== "archive")
    .map((l) => ({
      id: l.id,
      dealname: `${l.grade || "LEAD"} · ${l.entreprise || [l.prenom, l.nom].join(" ").trim() || l.email}`,
      dealstage: ST_NEW,
      pipeline: PIPELINE,
      amount: null,
      bw_source: l.source || "form_web",
      bw_forfait: resoudreForfait(l.intent) || null,
      bw_lead_score: l.score != null ? String(l.score) : null,
      bw_livraison_statut: null,
      bw_segment: `stage=${l.stage}${l.marketLabel ? ` · ${l.marketLabel}` : ""}`,
      createdate: l.created_at,
      hs_lastmodifieddate: l.updated_at,
    }));
  const deals = [...paidDeals, ...leadDeals]
    .sort((a, b) => String(b.hs_lastmodifieddate || "").localeCompare(String(a.hs_lastmodifieddate || "")))
    .slice(0, 50);
  const contacts = [
    ...customers.map((c) => ({
      id: `cust:${c.email}`,
      firstname: c.prenom, lastname: c.nom, email: c.email, phone: "", company: c.entreprise,
      lifecyclestage: c.status === "active" ? "customer" : c.status,
      bw_source: c.source, bw_lead_score: null,
      bw_forfait: c.forfait || c.forfait_cellulaire || c.forfait_chatbot || c.forfait_vocal,
      createdate: c.created_at, hs_lastmodifieddate: c.updated_at,
    })),
    ...leads
      .filter((l) => !customers.some((c) => c.email === l.email))
      .map((l) => ({
        id: l.id,
        firstname: l.prenom, lastname: l.nom, email: l.email, phone: l.telephone, company: l.entreprise,
        lifecyclestage: "lead", bw_source: l.source, bw_lead_score: l.score != null ? String(l.score) : null,
        bw_forfait: resoudreForfait(l.intent) || null, createdate: l.created_at, hs_lastmodifieddate: l.updated_at,
      })),
  ].slice(0, 50);
  const scored = leadDeals.map((d) => Number(d.bw_lead_score)).filter((n) => Number.isFinite(n));
  return {
    fetchedAt: new Date().toISOString(),
    engines: {
      mode: "twin_turbo_full_performance",
      dealsWithScore: scored.length,
      avgLeadScore: scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null,
      maxLeadScore: scored.length ? Math.max(...scored) : null,
    },
    limits: { deals: 50, countsArePartial: true, contactsAvailable: true },
    contacts,
    deals,
    sources: {
      leads: "BlackWay Master CRM (D1)",
      payments: "BlackWay Master DB — paiements Paddle vérifiés",
      projects: "Master DB (livraison à démarrer)",
      phone: "not connected to BlackWay pipeline",
      messages: "not connected to owner overview",
    },
  };
}

/** One-time copy of HubSpot customers into the Master DB (runs from cron until done). */
async function importHubspotCustomersOnce(env) {
  if (!hasMasterDb(env) || !jeton(env)) return { skipped: true };
  if (await getMeta(env, "hubspot_customers_imported")) return { skipped: true, done: true };
  let after;
  let seen = 0;
  let imported = 0;
  for (let page = 0; page < 50; page++) {
    const r = await hs(env, "POST", "/crm/v3/objects/contacts/search", {
      filterGroups: [
        { filters: [{ propertyName: "lifecyclestage", operator: "EQ", value: "customer" }] },
        { filters: [{ propertyName: "bw_forfait_paye", operator: "HAS_PROPERTY" }] },
      ],
      properties: [...HS_PORTAL_PROPS, "company", "createdate"],
      limit: 100,
      ...(after ? { after } : {}),
    });
    if (r.status !== 200) throw new Error(`import hubspot ${r.status}`);
    for (const c of r.data?.results || []) {
      const props = c.properties || {};
      const email = String(props.email || "").trim().toLowerCase();
      if (!email.includes("@")) continue;
      seen += 1;
      const paid = resoudreForfait(props.bw_forfait_paye);
      const web = resoudreForfait(props.bw_forfait);
      let forfait = web && !isCellulaireForfait(web) ? web : null;
      let forfaitCellulaire = resoudreForfait(props.bw_forfait_cellulaire);
      if (paid && !isCellulaireForfait(paid)) forfait = paid;
      if (paid && isCellulaireForfait(paid) && !forfaitCellulaire) forfaitCellulaire = paid;
      if (!forfait && !forfaitCellulaire) forfait = "grow_hub_growth";
      const ok = await importCustomer(env, {
        email, prenom: props.firstname, nom: props.lastname, entreprise: props.company,
        forfait, forfait_cellulaire: forfaitCellulaire, source: "import_hubspot",
        created_at: props.createdate || undefined,
      });
      if (ok) imported += 1;
    }
    after = r.data?.paging?.next?.after;
    if (!after) break;
  }
  await setMeta(env, "hubspot_customers_imported", `${new Date().toISOString()} seen=${seen} imported=${imported}`);
  return { ok: true, seen, imported };
}

/** Client inbox — HubSpot deals associated to the portal contact (Master Leads delivery). */
async function listPortalLeads(env, token) {
  const session = await verifyPortalToken(env, token);
  if (!jeton(env)) {
    return { email: session.email, leads: [], empty: true, engine: "twin_turbo_full_performance" };
  }
  let contact = null;
  try {
    contact = await searchHsContact(env, "email", session.email);
  } catch (e) {
    console.log("portal leads hubspot", e);
  }
  if (!contact?.id) {
    return { email: session.email, leads: [], empty: true, engine: "twin_turbo_full_performance" };
  }
  const assoc = await hs(env, "GET", `/crm/v3/objects/contacts/${contact.id}/associations/deals`);
  const dealIds = (assoc.data?.results || [])
    .map((r) => String(r.toObjectId || r.id || ""))
    .filter(Boolean)
    .slice(0, 25);
  if (!dealIds.length) {
    return { email: session.email, leads: [], empty: true, engine: "twin_turbo_full_performance" };
  }
  const batch = await hs(env, "POST", "/crm/v3/objects/deals/batch/read", {
    inputs: dealIds.map((id) => ({ id })),
    properties: [
      "dealname",
      "dealstage",
      "amount",
      "bw_forfait",
      "bw_lead_score",
      "bw_livraison_statut",
      "bw_source",
      "bw_segment",
      "createdate",
      "hs_lastmodifieddate",
    ],
  });
  const leads = (batch.data?.results || [])
    .map((d) => ({
      id: d.id,
      name: d.properties?.dealname || "",
      stage: d.properties?.dealstage || "",
      amount: d.properties?.amount || null,
      forfait: d.properties?.bw_forfait || null,
      score: d.properties?.bw_lead_score ? Number(d.properties.bw_lead_score) : null,
      delivery: d.properties?.bw_livraison_statut || null,
      source: d.properties?.bw_source || null,
      segment: d.properties?.bw_segment || null,
      createdAt: d.properties?.createdate || null,
      updatedAt: d.properties?.hs_lastmodifieddate || null,
    }))
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  const scored = leads.map((l) => l.score).filter((n) => Number.isFinite(n));
  return {
    email: session.email,
    engine: "twin_turbo_full_performance",
    empty: leads.length === 0,
    count: leads.length,
    avgScore: scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null,
    leads,
  };
}

/** Legacy HubSpot customer lookup — read-only fallback for customers not yet in the Master DB. */
async function legacyHubspotCustomer(env, email) {
  if (!jeton(env)) return null;
  try {
    const contact = await searchHsContact(env, "email", email);
    if (!contact) return null;
    const props = contact.properties || {};
    if (!contactHasCustomerAccess(props)) return { contact, active: false };
    const paid = resoudreForfait(props.bw_forfait_paye);
    const web = resoudreForfait(props.bw_forfait);
    let forfait = web && !isCellulaireForfait(web) ? web : null;
    let forfaitCellulaire = resoudreForfait(props.bw_forfait_cellulaire);
    if (paid && !isCellulaireForfait(paid)) forfait = paid;
    if (paid && isCellulaireForfait(paid) && !forfaitCellulaire) forfaitCellulaire = paid;
    if (!forfait && !forfaitCellulaire) forfait = "grow_hub_growth";
    // Copy into the Master DB so the next claim no longer needs HubSpot.
    try {
      await importCustomer(env, {
        email, prenom: props.firstname, nom: props.lastname,
        forfait, forfait_cellulaire: forfaitCellulaire, source: "import_hubspot",
      });
    } catch (e) {
      console.log("import hubspot customer", e);
    }
    return { contact, active: true, forfait, forfaitCellulaire };
  } catch (e) {
    console.log("legacy hubspot customer", e);
    return null;
  }
}

/** Current plans for an email: Master DB first, legacy HubSpot fallback, then the hint. */
async function resolveAccess(env, email, hint) {
  const slots = { web: null, cellulaire: null, chatbot: null, vocal: null };
  let customer = null;
  try {
    customer = await getCustomer(env, email);
  } catch (e) {
    console.log("master customer lookup", e);
  }
  if (customer) {
    if (customerIsBlocked(customer)) throw new Error(ABONNEMENT_INACTIF);
    slots.web = resoudreForfait(customer.forfait);
    slots.cellulaire = resoudreForfait(customer.forfait_cellulaire);
    slots.chatbot = resoudreForfait(customer.forfait_chatbot);
    slots.vocal = resoudreForfait(customer.forfait_vocal);
  } else {
    const legacy = await legacyHubspotCustomer(env, email);
    if (legacy?.active) {
      slots.web = legacy.forfait;
      slots.cellulaire = legacy.forfaitCellulaire;
    }
  }
  // The Master DB is authoritative; a hint only fills in for customers not yet recorded there.
  const hintKey = customer ? null : resoudreForfait(hint);
  if (hintKey && !slots[forfaitLine(hintKey)]) slots[forfaitLine(hintKey)] = hintKey;
  let forfait = slots.web || slots.cellulaire || slots.chatbot || slots.vocal || "grow_hub_growth";
  if (!FORFAITS[forfait]) forfait = "grow_hub_growth";
  return {
    forfait,
    forfaitCellulaire: slots.cellulaire,
    forfaitChatbot: slots.chatbot,
    forfaitVocal: slots.vocal,
  };
}

/**
 * Claim portal access.
 * Payment reference path: KV/Cache → Master DB payment → legacy HubSpot → Paddle API verification.
 * Email path: Master DB customer → legacy HubSpot customer (copied into the Master DB on first hit).
 */
async function claimPortal(env, p) {
  const sessionId = String(p.transaction_id || p.transactionId || p.session_id || p.sessionId || "").trim();
  const emailIn = String(p.email || "").trim().toLowerCase();
  let email = "";
  let forfait = null;

  if (sessionId) {
    if (!isPaymentReference(sessionId)) throw new Error("reference paiement invalide");

    const cached = await getSessionMap(env, sessionId);
    if (cached?.email) {
      email = String(cached.email).trim().toLowerCase();
      forfait = resoudreForfait(cached.forfait || p.plan);
    }

    if (!email) {
      try {
        const pay = await getPayment(env, sessionId);
        if (pay?.email) {
          email = pay.email;
          forfait = resoudreForfait(pay.forfait);
        }
      } catch (e) {
        console.log("master payment lookup", e);
      }
    }

    // Paddle is the payment ledger: verify txn_ there before any legacy HubSpot lookup.
    if (!email && sessionId.startsWith("txn_")) {
      try {
        const fromPaddle = await activateFromPaddleTransaction(env, sessionId);
        if (fromPaddle?.email) {
          email = fromPaddle.email;
          forfait = fromPaddle.forfait;
        }
      } catch (e) {
        console.log("activateFromPaddleTransaction", e);
      }
    }

    if (!email && jeton(env)) {
      try {
        await ensureBwLastCheckoutSessionProp(env);
        const contact = await searchHsContact(env, "bw_last_checkout_session", sessionId);
        if (contact) {
          const props = contact.properties || {};
          email = String(props.email || "").trim().toLowerCase();
          forfait = resoudreForfait(props.bw_forfait_paye || props.bw_forfait || p.plan);
        }
      } catch (e) {
        console.log("legacy hubspot session lookup", e);
      }
    }

    // Deal payment id = cs_… or txn_… (legacy HubSpot path — survives Cache TTL).
    if (!email && jeton(env)) {
      try {
        const fromDeal = await claimFromDealSession(env, sessionId);
        if (fromDeal?.email) {
          email = fromDeal.email;
          forfait = fromDeal.forfait || forfait;
        }
      } catch (e) {
        console.log("claimFromDealSession", e);
      }
    }

    if (!email) {
      throw new Error(
        "Paiement introuvable. Attendez quelques secondes apres le paiement, ou utilisez le courriel du compte payeur.",
      );
    }
  } else if (emailIn) {
    if (!emailIn.includes("@")) throw new Error("courriel invalide");
    let customer = null;
    try {
      customer = await getCustomer(env, emailIn);
    } catch (e) {
      console.log("master customer lookup", e);
    }
    if (customer && customerIsBlocked(customer)) throw new Error(ABONNEMENT_INACTIF);
    if (!customerIsActive(customer)) {
      const legacy = await legacyHubspotCustomer(env, emailIn);
      if (!legacy) {
        throw new Error(
          "Aucun compte client pour ce courriel — utilise le courriel exact du paiement Paddle.",
        );
      }
      if (!legacy.active) {
        throw new Error(
          "Compte trouvé mais pas encore client actif — paiement Paddle requis (ou activation ops).",
        );
      }
    }
    email = emailIn;
  } else {
    throw new Error("session_id ou email requis");
  }

  const access = await resolveAccess(env, email, forfait);
  const { token, exp } = await mintPortalToken(env, email, access.forfait);
  return portalSessionShape(email, access, token, exp);
}

async function portalMe(env, token) {
  const { email, forfait: tokenForfait } = await verifyPortalToken(env, token);
  const access = await resolveAccess(env, email, tokenForfait);
  const minted = await mintPortalToken(env, email, access.forfait);
  return portalSessionShape(email, access, minted.token, minted.exp);
}

/** Verification de signature Stripe (HMAC SHA-256, tolerance 5 min) */
async function signatureValide(secret, payload, header) {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((x) => x.split("=")));
  if (!parts.t || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parts.t}.${payload}`));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === parts.v1;
}

/** Paddle-Signature: ts=<unix>;h1=<hex>, signed payload = ts:rawBody. */
async function signaturePaddleValide(secret, payload, header) {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(
    String(header).split(";").map((part) => {
      const i = part.indexOf("=");
      return i > 0 ? [part.slice(0, i).trim(), part.slice(i + 1).trim()] : ["", ""];
    }),
  );
  if (!parts.ts || !parts.h1) return false;
  const timestamp = Number(parts.ts);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(String(secret).trim()),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC", key, new TextEncoder().encode(`${parts.ts}:${payload}`),
  );
  const expected = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== parts.h1.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ parts.h1.charCodeAt(i);
  return mismatch === 0;
}


const PADDLE_IMMEDIATE_BILLING_PRICE_IDS = [
  "pri_01m3nt7rm1cc19134bb3e86fpb",
  "pri_01kxtn6asavavmqv54407h464b",
  "pri_01kxtn6b41wzt07rnzvyte4sn8",
  "pri_01kxtn6befjw8m8gz9a5vwf0wf",
  "pri_01m3nt7rs3vajzyv8k8r57qswc",
  "pri_01m3nt7rxx08w09zef4xf2rage",
  "pri_01m3nt7s39b94k4p7a13m3sya2",
  "pri_01m3nt7s88bxrx8k6jph2gmtt2",
  "pri_01m3nt7sd8mkr915y6vtgs6m3p",
  "pri_01m3nt7sj4wndn0qkd9d855zpr",
  "pri_01m3nt7sqgkcqb2payzrn0f8cf",
  "pri_01m3nt7ss5526fp4j6q98zdqc0",
  "pri_01m3nt7stvq4ff1942nybarhxn",
  "pri_01m3nt7szxc265whjs40e2y5pd",
  "pri_01m3nt7t1k43gy04eyf71amkd5",
  "pri_01m3nt7t39xq8pbggfeh6ejax4",
];

async function ensurePaddleImmediateBilling(env) {
  const markerKey = "__ops:paddle-immediate-billing-v1";
  if (env.BW_SESSIONS) {
    const marker = await env.BW_SESSIONS.get(markerKey);
    if (marker) return { ok: true, migrated: true, source: "marker" };
  }

  const key = String(env.PADDLE_API_KEY || "").trim();
  if (!key) return { ok: false, migrated: false, error: "paddle_api_key_missing" };

  for (const priceId of PADDLE_IMMEDIATE_BILLING_PRICE_IDS) {
    const response = await fetch("https://api.paddle.com/prices/" + encodeURIComponent(priceId), {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ trial_period: null }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      console.log("paddle immediate billing patch failed", priceId, response.status, payload);
      return {
        ok: false,
        migrated: false,
        error: "paddle_price_update_failed",
        price_id: priceId,
        status: response.status,
      };
    }
    if (payload?.data?.trial_period !== null) {
      return {
        ok: false,
        migrated: false,
        error: "paddle_trial_still_present",
        price_id: priceId,
      };
    }
  }

  if (env.BW_SESSIONS) {
    await env.BW_SESSIONS.put(
      markerKey,
      JSON.stringify({ completed_at: new Date().toISOString(), price_count: PADDLE_IMMEDIATE_BILLING_PRICE_IDS.length }),
    );
  }
  return { ok: true, migrated: true, source: "paddle", price_count: PADDLE_IMMEDIATE_BILLING_PRICE_IDS.length };
}

export { forfaitFromStripeObject, forfaitFromAmountCents, forfaitFromPaddleTransaction, forfaitFromProvisionPayload, signaturePaddleValide, isVorixaManagedStripeObject };

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      importHubspotCustomersOnce(env)
        .catch((e) => console.log("import hubspot customers", e))
        .then(() => runAutonomyTick(env)),
    );
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (url.pathname === "/health") {
      const paddleImmediateBilling = await ensurePaddleImmediateBilling(env).catch((e) => ({
        ok: false,
        migrated: false,
        error: String(e),
      }));
      const t = jeton(env);
      let hubspot = "absent";
      let hubspot_bw_session_prop = false;
      if (t) {
        const r = await fetch(HS + "/crm/v3/objects/contacts?limit=1", { headers: { Authorization: `Bearer ${t}` } });
        hubspot = r.status === 200 ? "connecte" : `refuse (${r.status})`;
        if (hubspot === "connecte") {
          // Read-only check; no schema write is attempted from /health.
          hubspot_bw_session_prop = await ensureBwLastCheckoutSessionProp(env);
        }
      }
      const paddleApiKey = !!String(env.PADDLE_API_KEY || "").trim();
      const paddleWebhookSecret = !!String(env.PADDLE_WEBHOOK_SECRET || "").trim();
      const paddleClientToken = String(env.PADDLE_CLIENT_TOKEN || "").trim().startsWith("live_");
      const paddleFulfillRelay = !!String(env.BW_PADDLE_FULFILL_KEY || "").trim();
      // Claim works without contact prop: Cache (24h) + deal bw_stripe_payment_id (= cs_…).
      // Paddle path: direct pipe secrets OR Vorixa relay (BW_PADDLE_FULFILL_KEY).
      let masterDb = false;
      if (hasMasterDb(env)) {
        try {
          await env.BW_DB.prepare("SELECT 1 FROM customers LIMIT 1").first();
          masterDb = true;
        } catch (e) {
          console.log("health master db", e);
        }
      }
      const portal_claim_ready = (masterDb || hubspot === "connecte") && (
        (paddleApiKey && paddleWebhookSecret) ||
        paddleApiKey ||
        paddleFulfillRelay
      );
      return json({
        service: "blackway-pipe",
        ok: masterDb || hubspot === "connecte",
        master_db: masterDb,
        brain: masterDb ? "blackway_master_king" : "hubspot",
        hubspot_sync: hubspotSync(env),
        hubspot: hubspot === "connecte",
        hubspot_bw_session_prop,
        // Optional property; absence does not block Paddle claim because cache+deal fallback remains.
        hubspot_bw_session_prop_status: hubspot_bw_session_prop ? "present" : "optional_missing",
        // Cache API always available on Workers; KV optional (BW_SESSIONS binding).
        session_cache: true,
        session_kv: !!env.BW_SESSIONS,
        portal_claim_ready,
        paddle_api_key: paddleApiKey,
        paddle_webhook_secret: paddleWebhookSecret,
        paddle_client_token: paddleClientToken,
        paddle_fulfill_relay: paddleFulfillRelay,
        paddle_ready: (paddleApiKey && paddleWebhookSecret) || paddleFulfillRelay,
        paddle_immediate_billing: paddleImmediateBilling,
        lead_key: !!env.BW_LEAD_KEY,
        portal_secret: !!String(env.BW_PORTAL_SECRET || "").trim(),
        // Portal claim after pay does NOT require STRIPE_SECRET_KEY (webhook + cache/HubSpot deal).
        portal_claim_needs_stripe_secret: false,
        engine: true,
        engine_email: !!env.EMAIL,
      });
    }

    // Public client-side token for /payer overlay (designed to be browser-visible).
    if (url.pathname === "/paddle/client-config" && request.method === "GET") {
      const token = String(env.PADDLE_CLIENT_TOKEN || "").trim();
      if (!token.startsWith("live_")) {
        return json({ ok: false, erreur: "paddle client token absent" }, 503);
      }
      return json({ ok: true, environment: "production", client_token: token });
    }

    if (url.pathname === "/lead" && request.method === "POST") {
      try {
        const p = await request.json();
        if (env.BW_LEAD_KEY && request.headers.get("X-BW-Key") !== env.BW_LEAD_KEY) return json({ erreur: "cle invalide" }, 401);
        if (!p.email) return json({ erreur: "courriel requis" }, 400);
        return json(await traiterLead(env, p));
      } catch (e) { return json({ erreur: String(e) }, 500); }
    }

    if (url.pathname === "/ops/overview") {
      const privateHeaders = { "Cache-Control": "no-store", "Content-Type": "application/json" };
      if (request.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405, headers: privateHeaders });
      if (!env.BW_LEAD_KEY || request.headers.get("X-BW-Key") !== env.BW_LEAD_KEY) {
        return Response.json({ error: "Unauthorized" }, { status: 401, headers: privateHeaders });
      }
      if (hasMasterDb(env)) {
        try {
          return Response.json(await masterOverview(env), { headers: privateHeaders });
        } catch (e) {
          console.log("master overview", e);
          if (!jeton(env)) return Response.json({ error: "Master DB indisponible" }, { status: 502, headers: privateHeaders });
        }
      }
      if (!jeton(env)) return Response.json({ error: "HubSpot non configuré" }, { status: 503, headers: privateHeaders });

      const search = (objectType, properties) => hs(env, "POST", `/crm/v3/objects/${objectType}/search`, {
        limit: 50,
        sorts: [{ propertyName: "hs_lastmodifieddate", direction: "DESCENDING" }],
        filterGroups: [{ filters: [{ propertyName: "pipeline", operator: "EQ", value: PIPELINE }] }],
        properties,
      });
      try {
        const deals = await search("deals", ["dealname", "dealstage", "pipeline", "amount", "bw_source", "bw_forfait", "bw_lead_score", "bw_livraison_statut", "bw_segment", "createdate", "hs_lastmodifieddate"]);
        if (deals.status !== 200) {
          return Response.json({ error: "Lecture du pipeline BlackWay refusée", status: deals.status }, { status: 502, headers: privateHeaders });
        }
        const recentDeals = deals.data.results || [];
        let contacts = [];
        let contactsAvailable = true;
        if (recentDeals.length) {
          const assoc = await hs(env, "POST", "/crm/v4/associations/deals/contacts/batch/read", {
            inputs: recentDeals.map((d) => ({ id: d.id })),
          });
          if (assoc.status !== 200) {
            contactsAvailable = false;
          } else {
            const ids = [...new Set((assoc.data.results || []).flatMap((row) => (row.to || []).map((link) => String(link.toObjectId))))];
            if (ids.length) {
              const batch = await hs(env, "POST", "/crm/v3/objects/contacts/batch/read", {
                inputs: ids.map((id) => ({ id })),
                properties: ["firstname", "lastname", "email", "phone", "company", "lifecyclestage", "bw_source", "bw_lead_score", "bw_forfait", "createdate", "hs_lastmodifieddate"],
              });
              if (batch.status === 200) contacts = batch.data.results || [];
              else contactsAvailable = false;
            }
          }
        }
        const scored = recentDeals
          .map((d) => Number(d.properties?.bw_lead_score))
          .filter((n) => Number.isFinite(n));
        return Response.json({
          fetchedAt: new Date().toISOString(),
          engines: {
            mode: "twin_turbo_full_performance",
            dealsWithScore: scored.length,
            avgLeadScore: scored.length
              ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
              : null,
            maxLeadScore: scored.length ? Math.max(...scored) : null,
          },
          limits: { deals: 50, countsArePartial: true, contactsAvailable },
          contacts: contacts.map((c) => ({ id: c.id, ...c.properties })),
          deals: recentDeals.map((d) => ({ id: d.id, ...d.properties })),
          sources: {
            leads: "HubSpot",
            payments: "HubSpot deal stages (not a payment processor ledger)",
            projects: "HubSpot deal delivery status",
            phone: "not connected to BlackWay pipeline",
            messages: "not connected to owner overview",
          },
        }, { headers: privateHeaders });
      } catch {
        return Response.json({ error: "Lecture HubSpot indisponible" }, { status: 502, headers: privateHeaders });
      }
    }

    if (url.pathname === "/webhooks/paddle" && request.method === "POST") {
      const body = await request.text();
      const ok = await signaturePaddleValide(
        env.PADDLE_WEBHOOK_SECRET,
        body,
        request.headers.get("paddle-signature"),
      );
      if (!ok) return json({ erreur: "signature Paddle invalide" }, 400);
      let evt;
      try { evt = JSON.parse(body); } catch { return json({ erreur: "json invalide" }, 400); }

      const SUB_STATUS = {
        "subscription.activated": "active",
        "subscription.resumed": "active",
        "subscription.past_due": "past_due",
        "subscription.paused": "paused",
        "subscription.canceled": "canceled",
      };
      if (SUB_STATUS[evt.event_type]) {
        const sub = evt.data || {};
        const forfait = forfaitFromPaddleTransaction(sub);
        if (!forfait) return json({ recu: true, ignore: "abonnement Paddle non BlackWay", subscription_id: sub.id || null });
        if (!hasMasterDb(env)) return json({ recu: true, ignore: "master db absente" });
        try {
          const email = await paddleCustomerEmail(env, sub.customer_id);
          if (!email) throw new Error("abonnement Paddle sans courriel");
          const customer = await applySubscriptionStatus(env, email, forfait, SUB_STATUS[evt.event_type]);
          return json({ recu: true, type: evt.event_type, subscription_id: sub.id || null, statut: customer?.status || null });
        } catch (error) {
          console.error("erreur abonnement Paddle", evt.event_type, error);
          return json({ erreur: "mise a jour abonnement temporairement indisponible" }, 502);
        }
      }

      if (evt.event_type !== "transaction.completed") return json({ ignore: evt.event_type });

      const transaction = evt.data || {};
      const forfait = forfaitFromPaddleTransaction(transaction);
      if (!forfait) {
        return json({ recu: true, ignore: "prix Paddle non BlackWay", transaction_id: transaction.id || null });
      }
      const transactionId = String(transaction.id || "");
      if (!transactionId.startsWith("txn_")) return json({ erreur: "transaction Paddle invalide" }, 400);
      const amountCents = Number(transaction?.details?.totals?.total || transaction?.details?.totals?.grand_total || 0);
      const renouvellement = ["subscription_recurring", "subscription_update", "subscription_charge"].includes(transaction.origin);

      try {
        const email = await paddleCustomerEmail(env, transaction.customer_id);
        if (!email) throw new Error("paiement Paddle sans courriel");
        await putSessionMap(env, transactionId, { email, forfait });
        await traiterPaiement(env, {
          email,
          prenom: "",
          nom: "Client",
          entreprise: transaction.custom_data?.entreprise || "",
          forfait,
          payment_id: transactionId,
          checkout_session_id: transactionId,
          montant: Number.isFinite(amountCents) ? amountCents / 100 : FORFAITS[forfait].prix,
          renouvellement,
          processor: "paddle",
          segment: renouvellement ? "renouvellement paddle" : "paiement paddle",
        });
      } catch (error) {
        console.error("erreur traitement Paddle", error);
        // Let Paddle retry if CRM activation failed; do not acknowledge a lost payment event.
        return json({ erreur: "activation Paddle temporairement indisponible" }, 502);
      }
      return json({ recu: true, type: evt.event_type, transaction_id: transactionId });
    }

    if (url.pathname === "/ops/engine/tick" && request.method === "POST") {
      if (!env.BW_LEAD_KEY || request.headers.get("X-BW-Key") !== env.BW_LEAD_KEY) {
        return json({ erreur: "cle invalide" }, 401);
      }
      return json(await runAutonomyTick(env));
    }

    if (url.pathname === "/ops/engine" && request.method === "GET") {
      if (!env.BW_LEAD_KEY || request.headers.get("X-BW-Key") !== env.BW_LEAD_KEY) {
        return json({ erreur: "cle invalide" }, 401);
      }
      return json(await engineStatus(env));
    }

    if (url.pathname === "/crm/customers" && request.method === "GET") {
      if (!env.BW_LEAD_KEY || request.headers.get("X-BW-Key") !== env.BW_LEAD_KEY) {
        return json({ erreur: "cle invalide" }, 401);
      }
      return json({ ok: true, storage: hasMasterDb(env) ? "d1" : "absent", ...(await listCustomers(env)) });
    }

    if (url.pathname === "/ops/customers/import-hubspot" && request.method === "POST") {
      if (!env.BW_LEAD_KEY || request.headers.get("X-BW-Key") !== env.BW_LEAD_KEY) {
        return json({ erreur: "cle invalide" }, 401);
      }
      try {
        return json(await importHubspotCustomersOnce(env));
      } catch (e) {
        return json({ erreur: String(e.message || e) }, 502);
      }
    }

    if (url.pathname === "/crm/leads" && request.method === "GET") {
      if (!env.BW_LEAD_KEY || request.headers.get("X-BW-Key") !== env.BW_LEAD_KEY) {
        return json({ erreur: "cle invalide" }, 401);
      }
      const q = Object.fromEntries(url.searchParams);
      return json(await listMasterLeads(env, q));
    }

    const crmPatch = url.pathname.match(/^\/crm\/leads\/([^/]+)$/);
    if (crmPatch && request.method === "PATCH") {
      if (!env.BW_LEAD_KEY || request.headers.get("X-BW-Key") !== env.BW_LEAD_KEY) {
        return json({ erreur: "cle invalide" }, 401);
      }
      const p = await request.json();
      const lead = await patchMasterLead(env, decodeURIComponent(crmPatch[1]), p);
      if (!lead) return json({ erreur: "lead introuvable" }, 404);
      return json({ ok: true, lead });
    }

    // Stripe webhook retired: all new payments are Paddle-only.
    if (url.pathname === "/portal/claim" && request.method === "POST") {
      try {
        const p = await request.json();
        return json(await claimPortal(env, p));
      } catch (e) {
        return json({ erreur: String(e.message || e) }, 401);
      }
    }

    if (url.pathname === "/portal/me" && request.method === "GET") {
      try {
        const auth = request.headers.get("Authorization") || "";
        const token = auth.replace(/^Bearer\s+/i, "").trim();
        if (!token) return json({ erreur: "token requis" }, 401);
        return json(await portalMe(env, token));
      } catch (e) {
        return json({ erreur: String(e.message || e) }, 401);
      }
    }

    if (url.pathname === "/portal/leads" && request.method === "GET") {
      try {
        const auth = request.headers.get("Authorization") || "";
        const token = auth.replace(/^Bearer\s+/i, "").trim();
        if (!token) return json({ erreur: "token requis" }, 401);
        return json(await listPortalLeads(env, token));
      } catch (e) {
        return json({ erreur: String(e.message || e) }, 401);
      }
    }

    /**
     * Admin/ops + Vorixa Paddle relay: activate portal after verified payment.
     * Auth: X-BW-Key = BW_LEAD_KEY OR X-BW-Fulfill-Key = BW_PADDLE_FULFILL_KEY.
     * Creates/updates HubSpot contact as customer + paid deal.
     */
    if (url.pathname === "/portal/provision" && request.method === "POST") {
      try {
        const leadKey = String(env.BW_LEAD_KEY || "").trim();
        const fulfillKey = String(env.BW_PADDLE_FULFILL_KEY || "").trim();
        const leadOk = !!leadKey && request.headers.get("X-BW-Key") === leadKey;
        const fulfillOk = !!fulfillKey && request.headers.get("X-BW-Fulfill-Key") === fulfillKey;
        if (!leadOk && !fulfillOk) {
          return json({ erreur: "cle invalide" }, 401);
        }
        let p;
        try { p = await request.json(); } catch { return json({ erreur: "json invalide" }, 400); }
        const txn = p?.transaction || p?.data || {};
        const email = String(
          p.email || p.customer_email || p.customer?.email || txn.customer?.email || "",
        ).trim().toLowerCase();
        if (!email.includes("@")) return json({ erreur: "courriel invalide" }, 400);
        const resolved = forfaitFromProvisionPayload(p);
        // Never block a paid activation: fall back to Growth, but flag it for ops review.
        const forfait = resolved || "grow_hub_growth";
        const paymentId =
          String(p.payment_id || p.transaction_id || txn.id || "").trim() ||
          `manual:${email}:${forfait}:${new Date().toISOString().slice(0, 10)}`;
        const txnCents = Number(txn?.details?.totals?.total || txn?.details?.totals?.grand_total || 0);
        const montant = Number(p.montant || p.amount) || (txnCents > 0 ? txnCents / 100 : undefined);
        const baseSegment = p.segment || (fulfillOk ? "paiement paddle vorixa" : "provision manuelle portail");
        if (paymentId.startsWith("txn_")) {
          await putSessionMap(env, paymentId, { email, forfait });
        }
        try {
          const result = await traiterPaiement(env, {
            email,
            forfait,
            payment_id: paymentId,
            montant,
            entreprise: p.entreprise || txn.custom_data?.entreprise || "",
            prenom: p.prenom || "",
            nom: p.nom || "",
            segment: resolved ? baseSegment : `${baseSegment} - FORFAIT A VERIFIER`,
            checkout_session_id: p.session_id || p.checkout_session_id || paymentId,
            processor: p.processor || (fulfillOk ? "paddle" : undefined),
            renouvellement: !!p.renouvellement,
          });
          const session = await claimPortal(env, { email });
          return json({ ok: true, forfait_verifie: !!resolved, provision: result, portal: session });
        } catch (e) {
          console.error("provision portail", paymentId, e);
          // 5xx so the relay / Paddle retries; deal creation is idempotent on payment_id.
          return json({ erreur: String(e.message || e), payment_id: paymentId }, 502);
        }
      } catch (e) {
        return json({ erreur: String(e.message || e) }, 400);
      }
    }

    return json({ erreur: "route inconnue" }, 404);
  },
};
