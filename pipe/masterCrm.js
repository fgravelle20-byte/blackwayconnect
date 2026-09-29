/**
 * BlackWay Master CRM — source of truth for leads.
 * HubSpot is optional. The board lives on blackwayconnect.com/crm
 */

const KEY = "crm:master:v1";
const CACHE_ORIGIN = "https://bw-pipe-crm.internal";
const MAX = 4000;

export const STAGES = ["inbox", "contacted", "qualified", "booked", "won", "lost", "leak"];

function store(env) {
  return env.BW_WORKSPACES || env.BW_SESSIONS || null;
}

async function loadBoard(env) {
  const kv = store(env);
  if (kv) {
    try {
      const raw = await kv.get(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.log("crm kv get", e);
    }
  }
  try {
    const cache = caches.default;
    const hit = await cache.match(new Request(`${CACHE_ORIGIN}/${KEY}`));
    if (hit) return await hit.json();
  } catch (e) {
    console.log("crm cache get", e);
  }
  return { leads: [], updated_at: null };
}

async function saveBoard(env, board) {
  board.updated_at = new Date().toISOString();
  const body = JSON.stringify(board);
  const kv = store(env);
  if (kv) {
    try {
      await kv.put(KEY, body);
    } catch (e) {
      console.log("crm kv put", e);
    }
  }
  try {
    const cache = caches.default;
    await cache.put(
      new Request(`${CACHE_ORIGIN}/${KEY}`),
      new Response(body, { headers: { "Content-Type": "application/json", "Cache-Control": "max-age=86400" } }),
    );
  } catch (e) {
    console.log("crm cache put", e);
  }
  return board;
}

export async function upsertMasterLead(env, p, king) {
  const board = await loadBoard(env);
  const now = new Date().toISOString();
  const email = String(p.email || "").trim().toLowerCase();
  const existing = board.leads.find((l) => l.email === email && l.entreprise === String(p.entreprise || "").trim());
  const lead = {
    id: existing?.id || crypto.randomUUID(),
    created_at: existing?.created_at || now,
    updated_at: now,
    prenom: String(p.prenom || p.firstName || "").trim(),
    nom: String(p.nom || p.lastName || "").trim(),
    email,
    telephone: String(p.telephone || p.phone || "").trim(),
    entreprise: String(p.entreprise || p.company || "").trim(),
    pays: String(p.pays || p.country || "").trim(),
    market: king.market,
    marketLabel: king.marketLabel,
    industrie: String(p.industrie || p.industry || "").trim(),
    taille: String(p.taille || p.company_size || "").trim(),
    intent: String(p.intent || p.besoin || p.forfait || "").trim(),
    message: String(p.message || "").trim().slice(0, 4000),
    source: p.source || "form_web",
    langue: p.langue || p.lang || "fr",
    score: king.score,
    grade: king.grade,
    slaMinutes: king.slaMinutes,
    sla_due: new Date(Date.now() + king.slaMinutes * 60000).toISOString(),
    urgence: king.urgence,
    icp: king.icp,
    reasons: king.reasons || [],
    briefing: king.briefing,
    stage: (p.stage && STAGES.includes(p.stage) ? p.stage : existing?.stage) || "inbox",
    notes: existing?.notes || [],
  };
  board.leads = [lead, ...board.leads.filter((l) => l.id !== lead.id)].slice(0, MAX);
  await saveBoard(env, board);
  return lead;
}

export async function listMasterLeads(env, query = {}) {
  const board = await loadBoard(env);
  let leads = board.leads || [];
  if (query.market) leads = leads.filter((l) => l.market === query.market);
  if (query.grade) leads = leads.filter((l) => l.grade === query.grade);
  if (query.stage) leads = leads.filter((l) => l.stage === query.stage);
  const counts = {
    total: (board.leads || []).length,
    inbox: 0,
    contacted: 0,
    qualified: 0,
    booked: 0,
    won: 0,
    lost: 0,
    leak: 0,
    king: 0,
    surgical: 0,
    by_market: {},
  };
  for (const l of board.leads || []) {
    if (counts[l.stage] != null) counts[l.stage] += 1;
    if (l.grade === "KING") counts.king += 1;
    if (l.grade === "SURGICAL") counts.surgical += 1;
    counts.by_market[l.market] = (counts.by_market[l.market] || 0) + 1;
  }
  return { ok: true, platform: "blackway_master_crm", updated_at: board.updated_at, counts, leads };
}

function isJunkLead(l) {
  const email = String(l.email || "").toLowerCase();
  const local = email.split("@")[0] || "";
  const src = `${l.source || ""} ${l.message || ""} ${l.entreprise || ""}`.toLowerCase();
  if (!email.includes("@")) return true;
  if (email.endsWith("@hubspot.com")) return true;
  if (email.startsWith("noreply@")) return true;
  if (email.endsWith("@example.com")) return true;
  if (/(smoke|e2e|bw-lock|bw-paddle|audit-smoke|activation-smoke|dns-lock|cutover)/i.test(email)) return true;
  if (email.endsWith("@blackwayconnect.com") && /(\+|smoke|test|lock)/i.test(local)) return true;
  if (src.includes("fulfill.smoke")) return true;
  return false;
}

function paymentLooksFake(l) {
  const blob = `${l.message || ""} ${(l.notes || []).map((n) => n.body).join(" ")}`.toLowerCase();
  if (/cs_|pi_|ch_|in_/.test(blob)) return false;
  if (/txn_lock|txn_enum|paddle-e2e|bw-lock/.test(blob)) return true;
  if (l.stage === "won" && /aucune \(pas d.id stripe\)|pas d’id stripe|pas d'id stripe/.test(blob)) return true;
  return l.stage === "won" && /txn_/.test(blob);
}

export async function purgeJunkLeads(env) {
  const board = await loadBoard(env);
  const kept = [];
  const removed = [];
  const demoted = [];
  const now = new Date().toISOString();
  for (const l of board.leads || []) {
    if (isJunkLead(l)) {
      removed.push(l.email);
      continue;
    }
    if (paymentLooksFake(l) && l.stage === "won") {
      l.stage = "qualified";
      l.notes = [{ at: now, body: "Paiement non prouvé Stripe (id test ou absent). Pas un encaissement confirmé." }, ...(l.notes || [])].slice(0, 50);
      l.updated_at = now;
      demoted.push(l.email);
    }
    kept.push(l);
  }
  board.leads = kept;
  await saveBoard(env, board);
  return { ok: true, kept: kept.length, removed: removed.length, demoted: demoted.length, removed_emails: removed.slice(0, 80), demoted_emails: demoted };
}

export async function patchMasterLead(env, id, patch) {
  const board = await loadBoard(env);
  const i = board.leads.findIndex((l) => l.id === id);
  if (i < 0) return null;
  const now = new Date().toISOString();
  const lead = board.leads[i];
  if (patch.stage && STAGES.includes(patch.stage)) lead.stage = patch.stage;
  if (typeof patch.note === "string" && patch.note.trim()) {
    lead.notes = [{ at: now, body: patch.note.trim().slice(0, 2000) }, ...(lead.notes || [])].slice(0, 50);
  }
  lead.updated_at = now;
  board.leads[i] = lead;
  await saveBoard(env, board);
  return lead;
}
