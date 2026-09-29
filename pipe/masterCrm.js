/**
 * BlackWay Master CRM — source of truth for leads.
 * HubSpot is optional. The board lives on blackwayconnect.com/crm
 *
 * Storage: D1 (BW_DB, one row per lead) when bound; legacy single-blob KV otherwise.
 * The legacy KV board is copied into D1 once, on first D1 access.
 */

import { decide, deliverActionEmail, deliverOpsDigest, isFirstPartySource } from "./engine.js";
import { getMeta, setMeta } from "./customers.js";

const KEY = "crm:master:v1";
const ENGINE_KEY = "crm:engine:last";
const CACHE_ORIGIN = "https://bw-pipe-crm.internal";
const MAX = 4000;

export const STAGES = ["inbox", "contacted", "qualified", "booked", "won", "lost", "leak", "archive"];

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

/* ---------- D1 storage ---------- */

const kvBoardMigrated = new WeakSet();

function rowToLead(row) {
  let data = {};
  try { data = JSON.parse(row.data || "{}"); } catch { data = {}; }
  return { ...data, id: row.id, stage: row.stage };
}

function leadRowStatement(db, lead) {
  return db
    .prepare(
      `INSERT INTO leads (id, email, entreprise, stage, grade, market, score, data, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
       ON CONFLICT(email, entreprise) DO UPDATE SET
         stage = excluded.stage, grade = excluded.grade, market = excluded.market, score = excluded.score,
         data = excluded.data, updated_at = excluded.updated_at`,
    )
    .bind(
      lead.id,
      lead.email,
      lead.entreprise || "",
      lead.stage,
      lead.grade || null,
      lead.market || null,
      Number.isFinite(Number(lead.score)) ? Number(lead.score) : null,
      JSON.stringify(lead),
      lead.created_at || new Date().toISOString(),
      lead.updated_at || new Date().toISOString(),
    );
}

async function updateLeadRow(db, lead) {
  await db
    .prepare("UPDATE leads SET stage = ?2, data = ?3, updated_at = ?4 WHERE id = ?1")
    .bind(lead.id, lead.stage, JSON.stringify(lead), lead.updated_at)
    .run();
}

async function ensureKvBoardMigrated(env) {
  if (!env.BW_DB || kvBoardMigrated.has(env.BW_DB)) return;
  if (await getMeta(env, "kv_board_migrated")) {
    kvBoardMigrated.add(env.BW_DB);
    return;
  }
  const board = await loadBoard(env);
  const leads = (board.leads || []).filter((l) => l?.email && l?.id);
  for (let i = 0; i < leads.length; i += 50) {
    const chunk = leads.slice(i, i + 50).map((l) =>
      env.BW_DB
        .prepare(
          `INSERT OR IGNORE INTO leads (id, email, entreprise, stage, grade, market, score, data, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
        )
        .bind(
          l.id, l.email, l.entreprise || "", STAGES.includes(l.stage) ? l.stage : "inbox",
          l.grade || null, l.market || null,
          Number.isFinite(Number(l.score)) ? Number(l.score) : null,
          JSON.stringify(l), l.created_at || new Date().toISOString(), l.updated_at || new Date().toISOString(),
        ),
    );
    await env.BW_DB.batch(chunk);
  }
  await setMeta(env, "kv_board_migrated", `${new Date().toISOString()} n=${leads.length}`);
  kvBoardMigrated.add(env.BW_DB);
}

async function loadLeadsD1(env) {
  await ensureKvBoardMigrated(env);
  const r = await env.BW_DB.prepare("SELECT * FROM leads ORDER BY created_at DESC LIMIT ?1").bind(MAX).all();
  return (r.results || []).map(rowToLead);
}

/* ---------- shared ---------- */

function buildLead(p, king, existing) {
  const now = new Date().toISOString();
  return {
    id: existing?.id || crypto.randomUUID(),
    created_at: existing?.created_at || now,
    updated_at: now,
    prenom: String(p.prenom || p.firstName || "").trim() || existing?.prenom || "",
    nom: String(p.nom || p.lastName || "").trim() || existing?.nom || "",
    email: String(p.email || "").trim().toLowerCase(),
    telephone: String(p.telephone || p.phone || "").trim() || existing?.telephone || "",
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
    machine: existing?.machine || null,
  };
}

export async function upsertMasterLead(env, p, king) {
  const email = String(p.email || "").trim().toLowerCase();
  const entreprise = String(p.entreprise || p.company || "").trim();
  if (env.BW_DB) {
    await ensureKvBoardMigrated(env);
    const row = await env.BW_DB
      .prepare("SELECT * FROM leads WHERE email = ?1 AND entreprise = ?2")
      .bind(email, entreprise)
      .first();
    const lead = buildLead(p, king, row ? rowToLead(row) : null);
    await leadRowStatement(env.BW_DB, lead).run();
    return lead;
  }
  const board = await loadBoard(env);
  const existing = board.leads.find((l) => l.email === email && l.entreprise === entreprise);
  const lead = buildLead(p, king, existing);
  board.leads = [lead, ...board.leads.filter((l) => l.id !== lead.id)].slice(0, MAX);
  await saveBoard(env, board);
  return lead;
}

export async function listMasterLeads(env, query = {}) {
  let all;
  let updatedAt = null;
  if (env.BW_DB) {
    all = await loadLeadsD1(env);
    updatedAt = all.reduce((m, l) => (String(l.updated_at || "") > m ? String(l.updated_at) : m), "") || null;
  } else {
    const board = await loadBoard(env);
    all = board.leads || [];
    updatedAt = board.updated_at;
  }
  let leads = all;
  if (query.market) leads = leads.filter((l) => l.market === query.market);
  if (query.grade) leads = leads.filter((l) => l.grade === query.grade);
  if (query.stage) leads = leads.filter((l) => l.stage === query.stage);
  const counts = {
    total: all.length,
    inbox: 0,
    contacted: 0,
    qualified: 0,
    booked: 0,
    won: 0,
    lost: 0,
    leak: 0,
    archive: 0,
    king: 0,
    surgical: 0,
    by_market: {},
  };
  for (const l of all) {
    if (counts[l.stage] != null) counts[l.stage] += 1;
    if (l.grade === "KING") counts.king += 1;
    if (l.grade === "SURGICAL") counts.surgical += 1;
    counts.by_market[l.market] = (counts.by_market[l.market] || 0) + 1;
  }
  return {
    ok: true,
    platform: "blackway_master_crm",
    storage: env.BW_DB ? "d1" : "kv",
    updated_at: updatedAt,
    counts,
    leads,
  };
}

export async function patchMasterLead(env, id, patch) {
  let lead;
  let board = null;
  if (env.BW_DB) {
    await ensureKvBoardMigrated(env);
    const row = await env.BW_DB.prepare("SELECT * FROM leads WHERE id = ?1").bind(id).first();
    if (!row) return null;
    lead = rowToLead(row);
  } else {
    board = await loadBoard(env);
    lead = board.leads.find((l) => l.id === id);
    if (!lead) return null;
  }
  const now = new Date().toISOString();
  if (patch.stage && STAGES.includes(patch.stage)) lead.stage = patch.stage;
  if (typeof patch.note === "string" && patch.note.trim()) {
    lead.notes = [{ at: now, body: patch.note.trim().slice(0, 2000) }, ...(lead.notes || [])].slice(0, 50);
  }
  if (patch.machine && typeof patch.machine === "object") lead.machine = patch.machine;
  lead.updated_at = now;
  if (env.BW_DB) {
    await updateLeadRow(env.BW_DB, lead);
  } else {
    await saveBoard(env, board);
  }
  return lead;
}

export async function runAutonomyTick(env, now = Date.now()) {
  const d1 = !!env.BW_DB;
  const board = d1 ? null : await loadBoard(env);
  const leads = d1 ? await loadLeadsD1(env) : board.leads || [];
  const changed = [];
  const actions = [];
  let sends = 0;
  let parked = 0;
  const iso = new Date(now).toISOString();
  for (const lead of leads) {
    if (lead.stage === "leak" && lead.machine?.next_action === "relance_leak" && !isFirstPartySource(lead.source)) {
      lead.stage = "archive";
      lead.machine = { ...(lead.machine || {}), next_action: "parked_import", last_tick: iso };
      lead.updated_at = iso;
      lead.notes = [{ at: iso, body: "engine:parked_import not a live site/Paddle capture" }, ...(lead.notes || [])].slice(0, 50);
      parked += 1;
      changed.push(lead);
      continue;
    }
    const d = decide(lead, now);
    if (!d) continue;
    const lastSent = Date.parse(lead.machine?.sent_at || "") || 0;
    const prettyUpgrade =
      !!lead.machine?.sent_at && !String(lead.machine?.script?.html || "").includes("e10600");
    const canSend =
      sends < 8 && (prettyUpgrade || !lastSent || now - lastSent > 7 * 24 * 3600000);
    if (canSend) {
      const mail = await deliverActionEmail(env, lead, d.machine);
      d.machine.sent_ok = mail.sent;
      d.machine.sent_reason = mail.reason;
      if (mail.sent) {
        d.machine.sent_at = new Date(now).toISOString();
        sends += 1;
      }
    }
    lead.stage = d.stage;
    lead.machine = d.machine;
    lead.updated_at = new Date(now).toISOString();
    const line = `engine:${d.machine.next_action} send=${d.machine.sent_ok ? "1" : "0"} ${d.machine.script?.body || ""}`.slice(0, 2000);
    lead.notes = [{ at: lead.updated_at, body: line }, ...(lead.notes || [])].slice(0, 50);
    changed.push(lead);
    actions.push({
      id: lead.id,
      email: lead.email,
      entreprise: lead.entreprise,
      stage: lead.stage,
      next_action: d.machine.next_action,
      checkout: d.machine.checkout,
      sent: !!d.machine.sent_ok,
    });
  }
  if (d1) {
    // Row-level writes: leads created or edited during the tick are never overwritten.
    for (const lead of changed) await updateLeadRow(env.BW_DB, lead);
  } else if (changed.length) {
    await saveBoard(env, board);
  }
  const summary = {
    ok: true,
    at: new Date(now).toISOString(),
    storage: d1 ? "d1" : "kv",
    scanned: leads.length,
    acted: actions.length,
    parked,
    emailed: sends,
    actions: actions.slice(0, 80),
  };
  try {
    if (d1) await setMeta(env, ENGINE_KEY, JSON.stringify(summary));
    else await store(env)?.put(ENGINE_KEY, JSON.stringify(summary));
  } catch (e) {
    console.log("engine status put", e);
  }
  await deliverOpsDigest(env, summary);
  return summary;
}

export async function engineStatus(env) {
  try {
    const raw = env.BW_DB ? await getMeta(env, ENGINE_KEY) : await store(env)?.get(ENGINE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.log("engine status get", e);
  }
  return { ok: true, at: null, scanned: 0, acted: 0, actions: [] };
}
