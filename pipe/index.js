/**
 * BlackWay Pipe - tuyauterie CRM BlackWayConnect
 * Endpoints:
 *   GET  /health            -> etat du service + presence des secrets (sans fuite)
 *   POST /lead              -> formulaire site web  -> Contact + Deal "Nouvelle opportunite"
 *   POST /webhooks/stripe   -> paiement forfait -> active EXACTEMENT ce forfait (HubSpot + portail)
 *   POST /portal/claim      -> session_id (Cache/HubSpot) ou email -> jeton portail
 *   GET  /portal/me         -> refresh session portail
 * Portail HubSpot 343472254 - pipeline BlackWay - Revenue (2117849055)
 * Claim apres paiement: PAS besoin de STRIPE_SECRET_KEY (webhook payload + Cache + HubSpot).
 *
 * Activation auto (signature verifiee): checkout.session.completed | async_payment_succeeded
 * | invoice.paid | invoice.payment_succeeded → bw_forfait + bw_forfait_paye = forfait paye
 * (grow_hub_spark … partner). Idempotent via bw_idempotency_key.
 */

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
  grow_hub_launch:     { label: "Grow Hub Launch",           prix: 249,  delai: 7,  recurrent: true,  score: 65, line: "web" },
  grow_hub_growth:     { label: "Grow Hub Growth",           prix: 499,  delai: 7,  recurrent: true,  score: 80, line: "web" },
  grow_hub_scale:      { label: "Grow Hub Scale",            prix: 749,  delai: 7,  recurrent: true,  score: 88, line: "web" },
  grow_hub_command:    { label: "Grow Hub Command",          prix: 1249, delai: 7,  recurrent: true,  score: 93, line: "web" },
  grow_hub_partner:    { label: "Grow Hub Partner",          prix: 2499, delai: 7,  recurrent: true,  score: 97, line: "web" },
  cell_signal:         { label: "Cell Signal",               prix: 79,   delai: 7,  recurrent: true,  score: 58, line: "cellulaire" },
  cell_route:          { label: "Cell Route",                prix: 199,  delai: 7,  recurrent: true,  score: 68, line: "cellulaire" },
  cell_fleet:          { label: "Cell Fleet",                prix: 399,  delai: 7,  recurrent: true,  score: 82, line: "cellulaire" },
  cell_command:        { label: "Cell Command",              prix: 799,  delai: 7,  recurrent: true,  score: 90, line: "cellulaire" },
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

// Payment Link IDs (Grow Hub live) — session.payment_link quand line_items non expandés.
const PLINK_TO_FORFAIT = {
  plink_1U1FMTAG7HUL9RtrDCjxRIl6: "grow_hub_spark",
  plink_1U1FMUAG7HUL9RtrqsOarwY3: "grow_hub_launch",
  plink_1U1FMTAG7HUL9RtrDvKqcL9e: "grow_hub_growth",
  plink_1U1FMzAG7HUL9RtrIPzQYi9n: "grow_hub_scale",
  plink_1U1FMTAG7HUL9RtrODdZgiSo: "grow_hub_command",
  plink_1U1FMYAG7HUL9RtruMZLdQo2: "grow_hub_partner",
};

// Montants CAD (cents) — dernier filet invoices / sessions sans price id.
const AMOUNT_CENTS_TO_FORFAIT = {
  9900: "grow_hub_spark",
  24900: "grow_hub_launch",
  49900: "grow_hub_growth",
  74900: "grow_hub_scale",
  124900: "grow_hub_command",
  249900: "grow_hub_partner",
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
  "enterprise": "enterprise",
  "entreprise": "enterprise",
};

function isCellulaireForfait(key) {
  return String(key || "").startsWith("cell_");
}

const FREE_MAIL = ["gmail.com","hotmail.com","hotmail.ca","outlook.com","yahoo.com","yahoo.ca","icloud.com","live.ca","videotron.ca","sympatico.ca"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-BW-Key, Authorization",
};

const PORTAL_TTL_SEC = 30 * 24 * 3600; // ~30 days
const SESSION_CACHE_TTL_SEC = 24 * 3600; // webhook → claim race (24h)
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
  const fromAmt = forfaitFromAmountCents(s.amount_total ?? s.amount_paid ?? s.total);
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

async function traiterLead(env, p) {
  const forfait = resoudreForfait(p.forfait) || "grow_hub_growth";
  const f = FORFAITS[forfait];
  const sc = score(forfait, p.email, f.prix, f.recurrent);
  const contactId = await upsertContact(env, p.email, {
    firstname: p.prenom || "", lastname: p.nom || "", phone: p.telephone || "", company: p.entreprise || "",
    bw_forfait: forfait, bw_source: p.source || "form_web", bw_urgence: p.urgence || "normal",
    bw_lead_score: sc, bw_budget_estime: f.prix, bw_icp: p.icp || "oui_pme", lifecyclestage: "lead",
  });
  const d = await createDeal(env, `${f.label} - ${p.entreprise || [p.prenom, p.nom].join(" ").trim()}`, ST_NEW, {
    amount: f.prix, bw_forfait: forfait, bw_source: p.source || "form_web", bw_urgence: p.urgence || "normal",
    bw_lead_score: sc, bw_deadline: dateISO(f.delai), bw_livraison_statut: "non_demarre",
    bw_idempotency_key: `lead:${p.email}:${forfait}:${new Date().toISOString().slice(0, 10)}`,
    bw_segment: (p.message || "lead entrant").slice(0, 200),
  }, contactId);
  if (d.cree && p.message) {
    await hs(env, "POST", "/crm/v3/objects/notes", {
      properties: { hs_timestamp: new Date().toISOString(), hs_note_body: `Message du formulaire :\n${p.message}` },
      associations: [{ to: { id: d.id }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }] }],
    });
  }
  return { contact: contactId, deal: d.id, score: sc, statut: d.cree ? "cree" : "doublon evite" };
}

async function traiterPaiement(env, p) {
  if (!p.email) throw new Error("paiement sans courriel");
  if (!p.payment_id) throw new Error("paiement sans id stable");
  const forfait = resoudreForfait(p.forfait) || "grow_hub_growth";
  const f = FORFAITS[forfait];
  const sc = score(forfait, p.email, p.montant, f.recurrent);
  const cell = isCellulaireForfait(forfait);
  const segment = p.segment || (cell ? "cellulaire" : "paiement stripe");
  const dealLabel = p.renouvellement
    ? `${f.label} - RENOUVELLEMENT - ${p.entreprise || [p.prenom, p.nom].join(" ").trim()}`
    : `${f.label} - PAYE - ${p.entreprise || [p.prenom, p.nom].join(" ").trim()}`;
  const sessionPropOk = await ensureBwLastCheckoutSessionProp(env);
  const contactProps = {
    firstname: p.prenom || "", lastname: p.nom || "", company: p.entreprise || "",
    bw_forfait_paye: forfait,
    bw_source: cell ? "cellulaire" : "stripe",
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
    bw_source: cell ? "cellulaire" : "stripe", bw_urgence: "elevee",
    bw_lead_score: sc, bw_deadline: dateISO(f.delai), bw_livraison_statut: "non_demarre",
    bw_stripe_payment_id: p.payment_id, bw_idempotency_key: `pay:${p.payment_id}`,
    bw_segment: segment,
  }, contactId);
  if (!d.cree) return { deal: d.id, statut: "deja traite - aucun doublon" };
  await hs(env, "POST", "/crm/v3/objects/notes", {
    properties: {
      hs_timestamp: new Date().toISOString(),
      hs_note_body: `Paiement Stripe ${p.payment_id} - ${f.label} - ${p.montant}$ CAD.\nPortail Client Master : https://blackwayconnect.com/portail\n${p.renouvellement ? "Renouvellement abonnement." : `Livraison a demarrer, echeance ${dateISO(f.delai)}.`}`,
    },
    associations: [{ to: { id: d.id }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }] }],
  });
  return { contact: contactId, deal: d.id, score: sc, statut: "cree" };
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

function portalSessionShape(email, forfait, token, exp, forfaitCellulaire) {
  const cellKey = isCellulaireForfait(forfaitCellulaire)
    ? forfaitCellulaire
    : isCellulaireForfait(forfait)
      ? forfait
      : null;
  const webKey = !isCellulaireForfait(forfait) && forfait ? forfait : null;
  const primary = webKey || cellKey || forfait || "grow_hub_growth";
  const f = FORFAITS[primary] || FORFAITS.grow_hub_growth;
  const fc = cellKey ? FORFAITS[cellKey] : null;
  return {
    token,
    email,
    forfait: primary,
    forfaitWeb: webKey,
    forfaitCellulaire: cellKey,
    label: webKey ? (FORFAITS[webKey]?.label || f.label) : f.label,
    labelCellulaire: fc ? fc.label : null,
    amountCad: webKey ? (FORFAITS[webKey]?.prix || f.prix) : f.prix,
    amountCadCellulaire: fc ? fc.prix : null,
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
  return new Request(`${SESSION_CACHE_ORIGIN}/cs/${encodeURIComponent(sessionId)}`);
}

/** Persist cs_… → email/forfait for claim before HubSpot finishes (Cache API; KV if bound). */
async function putSessionMap(env, sessionId, payload) {
  const id = String(sessionId || "").trim();
  if (!id.startsWith("cs_")) return;
  const email = String(payload?.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return;
  const body = JSON.stringify({
    email,
    forfait: payload?.forfait || null,
    at: Date.now(),
  });
  if (env.BW_SESSIONS) {
    try {
      await env.BW_SESSIONS.put(`cs:${id}`, body, { expirationTtl: SESSION_CACHE_TTL_SEC });
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
  if (!id.startsWith("cs_")) return null;
  if (env.BW_SESSIONS) {
    try {
      const v = await env.BW_SESSIONS.get(`cs:${id}`, "json");
      if (v?.email) return v;
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

/** Create HubSpot contact property bw_last_checkout_session if missing. */
async function ensureBwLastCheckoutSessionProp(env) {
  if (_bwSessionPropReady) return true;
  const t = jeton(env);
  if (!t) return false;
  try {
    const get = await fetch(HS + "/crm/v3/properties/contacts/bw_last_checkout_session", {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (get.status === 200) {
      _bwSessionPropReady = true;
      return true;
    }
    const groupName = await hsBwContactGroupName(env);
    const groups = [...new Set([groupName, "contactinformation"].filter(Boolean))];
    for (const g of groups) {
      const create = await fetch(HS + "/crm/v3/properties/contacts", {
        method: "POST",
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "bw_last_checkout_session",
          label: "BW Last Checkout Session",
          type: "string",
          fieldType: "text",
          groupName: g,
          description: "Stripe Checkout Session ID (cs_) for Client Master Portal claim",
        }),
      });
      if (create.status === 200 || create.status === 201) {
        _bwSessionPropReady = true;
        return true;
      }
      const txt = await create.text();
      // Already exists (race / prior create under another code path)
      if (create.status === 409 || /already exists|PROPERTY_ALREADY_EXISTS/i.test(txt)) {
        break;
      }
      console.log("bw_last_checkout_session create", create.status, txt.slice(0, 240), "group", g);
    }
    const again = await fetch(HS + "/crm/v3/properties/contacts/bw_last_checkout_session", {
      headers: { Authorization: `Bearer ${t}` },
    });
    _bwSessionPropReady = again.status === 200;
    return _bwSessionPropReady;
  } catch (e) {
    console.log("ensureBwLastCheckoutSessionProp", e);
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

async function fetchStripeCheckoutSession(env, sessionId) {
  const key = String(env.STRIPE_SECRET_KEY || "").trim();
  if (!key) return null;
  const r = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=line_items.data.price`,
    { headers: { Authorization: `Bearer ${key}` } },
  );
  if (!r.ok) {
    throw new Error("session Stripe introuvable (" + r.status + ")");
  }
  return r.json();
}

/**
 * Claim portal access.
 * session_id path: Cache/KV → HubSpot bw_last_checkout_session → Stripe API (only if STRIPE_SECRET_KEY).
 * No Stripe secret required after webhook has stored the mapping.
 */
async function claimPortal(env, p) {
  const sessionId = String(p.session_id || p.sessionId || "").trim();
  const emailIn = String(p.email || "").trim().toLowerCase();
  let email = "";
  let forfait = null;
  let contact = null;

  if (sessionId) {
    if (!sessionId.startsWith("cs_")) throw new Error("session_id invalide");

    const cached = await getSessionMap(env, sessionId);
    if (cached?.email) {
      email = String(cached.email).trim().toLowerCase();
      forfait = resoudreForfait(cached.forfait || p.plan);
    }

    if (!email) {
      await ensureBwLastCheckoutSessionProp(env);
      contact = await searchHsContact(env, "bw_last_checkout_session", sessionId);
      if (contact) {
        const props = contact.properties || {};
        email = String(props.email || "").trim().toLowerCase();
        forfait = resoudreForfait(props.bw_forfait_paye || props.bw_forfait || p.plan);
      }
    }

    // Deal payment id = session id on checkout.session.* paths (survives without contact prop).
    if (!email) {
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
      let stripeSession = null;
      try {
        stripeSession = await fetchStripeCheckoutSession(env, sessionId);
      } catch (e) {
        if (String(env.STRIPE_SECRET_KEY || "").trim()) throw e;
        stripeSession = null;
      }
      if (stripeSession) {
        email = String(emailFromStripeObject(stripeSession) || "").trim().toLowerCase();
        forfait =
          forfaitFromStripeObject(stripeSession) ||
          resoudreForfait(p.plan) ||
          null;
        if (!email) throw new Error("paiement sans courriel sur la session Stripe");
      }
    }

    if (!email) {
      throw new Error(
        "Session introuvable. Attendez quelques secondes apres le paiement, ou utilisez le courriel du compte payeur.",
      );
    }
  } else if (emailIn) {
    if (!emailIn.includes("@")) throw new Error("courriel invalide");
    contact = await searchHsContact(env, "email", emailIn);
    // Soft fallback: HubSpot sometimes stores mixed-case emails; retry original casing.
    if (!contact && p.email && String(p.email).trim() !== emailIn) {
      contact = await searchHsContact(env, "email", String(p.email).trim());
    }
    if (!contact) {
      throw new Error(
        "Aucun compte client pour ce courriel — utilise le courriel exact du paiement Stripe, ou rouvre le lien /portail?session_id=cs_…",
      );
    }
    const props = contact.properties || {};
    if (!contactHasCustomerAccess(props)) {
      throw new Error(
        "Compte trouvé mais pas encore client actif — paiement Stripe requis (ou activation ops).",
      );
    }
    email = emailIn;
    forfait = resoudreForfait(props.bw_forfait_paye || props.bw_forfait || p.plan);
  } else {
    throw new Error("session_id ou email requis");
  }

  forfait = forfait || resoudreForfait(p.plan) || "grow_hub_growth";
  if (!FORFAITS[forfait]) forfait = "grow_hub_growth";
  if (!email) throw new Error("courriel requis pour le portail");

  let forfaitCellulaire = null;
  try {
    if (!contact) contact = await searchHsContact(env, "email", email);
    const props = contact?.properties || {};
    forfaitCellulaire = resoudreForfait(props.bw_forfait_cellulaire);
    const webFromHs = resoudreForfait(props.bw_forfait);
    if (webFromHs && !isCellulaireForfait(webFromHs)) forfait = webFromHs;
    else if (isCellulaireForfait(forfait) && !forfaitCellulaire) forfaitCellulaire = forfait;
    const paid = resoudreForfait(props.bw_forfait_paye);
    if (paid && isCellulaireForfait(paid) && !forfaitCellulaire) forfaitCellulaire = paid;
    if (paid && !isCellulaireForfait(paid)) forfait = paid;
  } catch {
    /* optional */
  }

  const { token, exp } = await mintPortalToken(env, email, forfait);
  return portalSessionShape(email, forfait, token, exp, forfaitCellulaire);
}

async function portalMe(env, token) {
  const { email, forfait: tokenForfait, exp } = await verifyPortalToken(env, token);
  let forfait = tokenForfait;
  let forfaitCellulaire = null;
  try {
    const contact = await searchHsContact(env, "email", email);
    const props = contact?.properties || {};
    const refreshed = resoudreForfait(props.bw_forfait_paye || props.bw_forfait);
    if (refreshed && !isCellulaireForfait(refreshed)) forfait = refreshed;
    forfaitCellulaire = resoudreForfait(props.bw_forfait_cellulaire);
    if (!forfaitCellulaire && refreshed && isCellulaireForfait(refreshed)) {
      forfaitCellulaire = refreshed;
    }
    const webOnly = resoudreForfait(props.bw_forfait);
    if (webOnly && !isCellulaireForfait(webOnly)) forfait = webOnly;
  } catch {
    /* keep token forfait */
  }
  if (!FORFAITS[forfait]) forfait = tokenForfait || "grow_hub_growth";
  const minted = await mintPortalToken(env, email, forfait);
  return portalSessionShape(email, forfait, minted.token, minted.exp, forfaitCellulaire);
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (url.pathname === "/health") {
      const t = jeton(env);
      let hubspot = "absent";
      let hubspot_bw_session_prop = false;
      if (t) {
        const r = await fetch(HS + "/crm/v3/objects/contacts?limit=1", { headers: { Authorization: `Bearer ${t}` } });
        hubspot = r.status === 200 ? "connecte" : `refuse (${r.status})`;
        if (hubspot === "connecte") {
          // Auto-create property on health so deploy/smoke proves portal claim path.
          hubspot_bw_session_prop = await ensureBwLastCheckoutSessionProp(env);
        }
      }
      const stripeSecretKey = !!String(env.STRIPE_SECRET_KEY || "").trim();
      const stripeWebhookSecret = !!String(env.STRIPE_WEBHOOK_SECRET || "").trim();
      // Claim works without contact prop: Cache (24h) + deal bw_stripe_payment_id (= cs_…).
      const portal_claim_ready = hubspot === "connecte" && !!stripeWebhookSecret;
      return json({
        service: "blackway-pipe",
        ok: hubspot === "connecte",
        hubspot: hubspot === "connecte",
        hubspot_bw_session_prop,
        // false = token missing crm.schemas.contacts.write (create 403). Optional; claim uses cache+deal.
        hubspot_bw_session_prop_create: hubspot_bw_session_prop ? "ok" : "scope_denied_or_missing",
        // Cache API always available on Workers; KV optional (BW_SESSIONS binding).
        session_cache: true,
        session_kv: !!env.BW_SESSIONS,
        portal_claim_ready,
        // Explicit names (preferred)
        stripe_secret_key: stripeSecretKey,
        stripe_webhook_secret: stripeWebhookSecret,
        // Compat aliases — stripe_secret = API key (not webhook)
        stripe_secret: stripeSecretKey,
        stripe_webhook: stripeWebhookSecret,
        lead_key: !!env.BW_LEAD_KEY,
        portal_secret: !!String(env.BW_PORTAL_SECRET || "").trim(),
        // Portal claim after pay does NOT require STRIPE_SECRET_KEY (webhook + cache/HubSpot deal).
        portal_claim_needs_stripe_secret: false,
      });
    }

    if (url.pathname === "/lead" && request.method === "POST") {
      try {
        const p = await request.json();
        if (env.BW_LEAD_KEY && request.headers.get("X-BW-Key") !== env.BW_LEAD_KEY) return json({ erreur: "cle invalide" }, 401);
        if (!p.email) return json({ erreur: "courriel requis" }, 400);
        return json(await traiterLead(env, p));
      } catch (e) { return json({ erreur: String(e) }, 500); }
    }

    if (url.pathname === "/webhooks/stripe" && request.method === "POST") {
      const body = await request.text();
      const ok = await signatureValide(env.STRIPE_WEBHOOK_SECRET, body, request.headers.get("stripe-signature"));
      if (!ok) return json({ erreur: "signature invalide" }, 400);
      let evt; try { evt = JSON.parse(body); } catch { return json({ erreur: "json invalide" }, 400); }
      const PAIEMENTS = [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "invoice.paid",
        "invoice.payment_succeeded",
      ];
      const ABANDONS = ["checkout.session.expired", "checkout.session.async_payment_failed"];

      if (ABANDONS.includes(evt.type)) {
        const s = evt.data.object;
        const cd = s.customer_details || {};
        const courriel = emailFromStripeObject(s);
        if (!courriel) return json({ ignore: "abandon sans courriel" });
        const nom = (cd.name || "").trim().split(" ");
        const forfait = forfaitFromStripeObject(s) || "grow_hub_growth";
        const f = FORFAITS[forfait];
        const abandonKey = s.id || evt.id;
        ctx.waitUntil((async () => {
          const contactId = await upsertContact(env, courriel, {
            firstname: nom[0] || "", lastname: nom.slice(1).join(" ") || "",
            bw_forfait: forfait, bw_source: "stripe", bw_urgence: "elevee",
            bw_lead_score: Math.min((f.score || 70) + 10, 100), lifecyclestage: "opportunity",
          });
          const d = await createDeal(env, `PANIER ABANDONNE - ${f.label} - ${cd.name || courriel}`, ST_NEW, {
            amount: (s.amount_total ?? 0) / 100 || f.prix, bw_forfait: forfait, bw_source: "stripe",
            bw_urgence: "elevee", bw_lead_score: Math.min((f.score || 70) + 10, 100),
            bw_deadline: dateISO(2), bw_livraison_statut: "non_demarre",
            bw_idempotency_key: `abandon:${abandonKey}`, bw_segment: "panier abandonne",
          }, contactId);
          if (d.cree) {
            await hs(env, "POST", "/crm/v3/objects/notes", {
              properties: { hs_timestamp: new Date().toISOString(),
                hs_note_body: `Paiement commence puis abandonne (${evt.type}).\nForfait vise : ${f.label}.\nRelancer dans les 24 h : c'est le lead le plus chaud du pipeline.` },
              associations: [{ to: { id: d.id }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 214 }] }],
            });
          }
        })().catch((e) => console.log("erreur abandon", e)));
        return json({ recu: true, traitement: "panier abandonne" });
      }

      if (!PAIEMENTS.includes(evt.type)) return json({ ignore: evt.type });
      const s = evt.data.object;

      // 1er paiement abo : checkout.session.completed + invoice.* (subscription_create)
      // → ignorer la facture initiale pour eviter 2 deals HubSpot.
      if (evt.type === "invoice.paid" || evt.type === "invoice.payment_succeeded") {
        const reason = s.billing_reason || "";
        if (reason === "subscription_create") {
          return json({ ignore: "subscription_create — deal via checkout.session" });
        }
      }

      // Paiement async (ACSS etc.) : session completed peut arriver unpaid.
      if (evt.type === "checkout.session.completed" && s.payment_status === "unpaid") {
        return json({ ignore: "awaiting async payment" });
      }

      const cd = s.customer_details || {};
      const nom = (cd.name || s.customer_name || "").trim().split(" ");
      // Forfait EXACT paye (price id / metadata / client_reference_id) — pas un statut unique.
      const forfait = forfaitFromStripeObject(s) || "";
      const isInvoice = evt.type === "invoice.paid" || evt.type === "invoice.payment_succeeded";
      const isRenewal = isInvoice && (s.billing_reason === "subscription_cycle" || s.billing_reason === "subscription_update");
      // Cle stable (session / invoice), pas l'event id — rejeux Stripe = zero doublon.
      const paymentKey = s.id || evt.id;
      const email = emailFromStripeObject(s);
      if (!email) return json({ ignore: "paiement sans courriel" });

      const checkoutSessionId = String(s.id || "").startsWith("cs_")
        ? s.id
        : String(s.checkout_session || "");
      const forfaitForCache = resoudreForfait(forfait) || "grow_hub_growth";
      // Sync before HubSpot waitUntil — claim by session_id must work without Stripe API.
      await putSessionMap(env, checkoutSessionId, { email, forfait: forfaitForCache });

      ctx.waitUntil(ensureBwLastCheckoutSessionProp(env).catch(() => false));
      ctx.waitUntil(traiterPaiement(env, {
        email,
        prenom: nom[0] || "", nom: nom.slice(1).join(" ") || "Client",
        entreprise: s.metadata?.entreprise || "",
        forfait,
        payment_id: paymentKey,
        checkout_session_id: checkoutSessionId,
        montant: (s.amount_total ?? s.amount_paid ?? 0) / 100,
        renouvellement: isRenewal,
        segment: isRenewal ? "renouvellement stripe" : "paiement stripe",
      }).catch((e) => console.log("erreur traitement", e)));
      return json({ recu: true, type: evt.type, payment_id: paymentKey });
    }

    // --- Portail Client Master ---
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

    /**
     * Admin/ops: activate portal access for an email without waiting for Stripe webhook.
     * Auth: X-BW-Key = BW_LEAD_KEY. Creates/updates HubSpot contact as customer + paid deal.
     */
    if (url.pathname === "/portal/provision" && request.method === "POST") {
      try {
        if (!env.BW_LEAD_KEY || request.headers.get("X-BW-Key") !== env.BW_LEAD_KEY) {
          return json({ erreur: "cle invalide" }, 401);
        }
        const p = await request.json();
        const email = String(p.email || "").trim().toLowerCase();
        if (!email.includes("@")) return json({ erreur: "courriel invalide" }, 400);
        const forfait = resoudreForfait(p.forfait || p.plan) || "grow_hub_growth";
        const paymentId =
          String(p.payment_id || "").trim() ||
          `manual:${email}:${forfait}:${new Date().toISOString().slice(0, 10)}`;
        const result = await traiterPaiement(env, {
          email,
          forfait,
          payment_id: paymentId,
          montant: p.montant,
          entreprise: p.entreprise || "AlphaVit Lab",
          prenom: p.prenom || "",
          nom: p.nom || "",
          segment: p.segment || "provision manuelle portail",
          checkout_session_id: p.session_id || p.checkout_session_id || "",
        });
        const session = await claimPortal(env, { email });
        return json({ ok: true, provision: result, portal: session });
      } catch (e) {
        return json({ erreur: String(e.message || e) }, 400);
      }
    }

    return json({ erreur: "route inconnue" }, 404);
  },
};
