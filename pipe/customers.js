/**
 * Master King System — customer + payment registry (D1 binding BW_DB).
 * Source of truth for portal access. HubSpot is an optional mirror.
 */

/** One column per product line; a customer can hold one tier of each at the same time. */
export const FORFAIT_COLUMNS = ["forfait", "forfait_cellulaire", "forfait_chatbot", "forfait_vocal"];

export function forfaitColumn(forfait) {
  const f = String(forfait || "");
  if (f.startsWith("cell_")) return "forfait_cellulaire";
  if (f.startsWith("ia_chatbot_")) return "forfait_chatbot";
  if (f.startsWith("ia_vocal_")) return "forfait_vocal";
  return "forfait";
}

export function hasMasterDb(env) {
  return !!env?.BW_DB;
}

function norm(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * Record a verified payment once (payment_id is the idempotency key) and upsert the customer.
 * Returns { created } — false when this payment_id was already recorded.
 */
export async function recordPayment(env, p) {
  const db = env.BW_DB;
  const email = norm(p.email);
  if (!db || !email || !p.payment_id || !p.forfait) throw new Error("paiement incomplet pour Master DB");
  const now = new Date().toISOString();
  const col = forfaitColumn(p.forfait);
  const ins = await db
    .prepare(
      `INSERT OR IGNORE INTO payments (payment_id, email, forfait, amount_cad, processor, renewal, segment, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
    )
    .bind(
      String(p.payment_id),
      email,
      p.forfait,
      Number.isFinite(Number(p.montant)) ? Number(p.montant) : null,
      p.processor || null,
      p.renouvellement ? 1 : 0,
      p.segment || null,
      now,
    )
    .run();
  const created = (ins.meta?.changes || 0) > 0;
  // A replayed payment must not reactivate a customer who canceled since.
  if (!created) return { created };
  await db
    .prepare(
      `INSERT INTO customers (email, prenom, nom, entreprise, ${col}, status, processor, last_payment_id, source, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, 'active', ?6, ?7, 'paiement', ?8, ?8)
       ON CONFLICT(email) DO UPDATE SET
         prenom = CASE WHEN excluded.prenom <> '' THEN excluded.prenom ELSE customers.prenom END,
         nom = CASE WHEN excluded.nom <> '' THEN excluded.nom ELSE customers.nom END,
         entreprise = CASE WHEN excluded.entreprise <> '' THEN excluded.entreprise ELSE customers.entreprise END,
         ${col} = excluded.${col},
         status = 'active',
         processor = COALESCE(excluded.processor, customers.processor),
         last_payment_id = excluded.last_payment_id,
         updated_at = excluded.updated_at`,
    )
    .bind(
      email,
      String(p.prenom || "").trim(),
      String(p.nom || "").trim(),
      String(p.entreprise || "").trim(),
      p.forfait,
      p.processor || null,
      String(p.payment_id),
      now,
    )
    .run();
  return { created };
}

export async function getCustomer(env, email) {
  if (!env?.BW_DB) return null;
  const e = norm(email);
  if (!e) return null;
  return env.BW_DB.prepare("SELECT * FROM customers WHERE email = ?1").bind(e).first();
}

export async function getPayment(env, paymentId) {
  if (!env?.BW_DB || !paymentId) return null;
  return env.BW_DB.prepare("SELECT * FROM payments WHERE payment_id = ?1").bind(String(paymentId)).first();
}

/** past_due keeps access during Paddle dunning; canceled/paused cut it. */
const ACCESS_STATUSES = new Set(["active", "past_due"]);

export function customerIsActive(c) {
  return !!c && ACCESS_STATUSES.has(c.status) && FORFAIT_COLUMNS.some((col) => !!c[col]);
}

export function customerIsBlocked(c) {
  return !!c && !customerIsActive(c);
}

/**
 * Apply a Paddle subscription lifecycle change to one forfait of a customer.
 * canceled/paused remove that forfait (access ends when none is left); active/past_due (re)grant it.
 */
export async function applySubscriptionStatus(env, email, forfait, status) {
  const db = env.BW_DB;
  const e = norm(email);
  if (!db || !e || !forfait) return null;
  const now = new Date().toISOString();
  const col = forfaitColumn(forfait);
  if (status === "canceled" || status === "paused") {
    await db
      .prepare(
        `UPDATE customers SET ${col} = CASE WHEN ${col} = ?2 THEN NULL ELSE ${col} END, updated_at = ?3 WHERE email = ?1`,
      )
      .bind(e, forfait, now)
      .run();
    await db
      .prepare(
        `UPDATE customers SET status = ?2, updated_at = ?3 WHERE email = ?1 AND ${FORFAIT_COLUMNS.map((c) => `${c} IS NULL`).join(" AND ")}`,
      )
      .bind(e, status, now)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO customers (email, ${col}, status, processor, source, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'paddle', 'abonnement', ?4, ?4)
         ON CONFLICT(email) DO UPDATE SET ${col} = excluded.${col}, status = excluded.status, updated_at = excluded.updated_at`,
      )
      .bind(e, forfait, status, now)
      .run();
  }
  return getCustomer(env, e);
}

/** Insert a customer imported from a legacy system without overwriting a newer local record. */
export async function importCustomer(env, c) {
  const email = norm(c.email);
  if (!env?.BW_DB || !email || !(c.forfait || c.forfait_cellulaire)) return false;
  const now = new Date().toISOString();
  const r = await env.BW_DB
    .prepare(
      `INSERT OR IGNORE INTO customers (email, prenom, nom, entreprise, forfait, forfait_cellulaire, status, processor, last_payment_id, source, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'active', NULL, NULL, ?7, ?8, ?8)`,
    )
    .bind(
      email,
      String(c.prenom || "").trim(),
      String(c.nom || "").trim(),
      String(c.entreprise || "").trim(),
      c.forfait || null,
      c.forfait_cellulaire || null,
      c.source || "import",
      c.created_at || now,
    )
    .run();
  return (r.meta?.changes || 0) > 0;
}

export async function listCustomers(env, limit = 200) {
  if (!env?.BW_DB) return { customers: [], payments: [] };
  const [customers, payments] = await Promise.all([
    env.BW_DB.prepare("SELECT * FROM customers ORDER BY updated_at DESC LIMIT ?1").bind(limit).all(),
    env.BW_DB.prepare("SELECT * FROM payments ORDER BY created_at DESC LIMIT ?1").bind(limit).all(),
  ]);
  return { customers: customers.results || [], payments: payments.results || [] };
}

export async function getMeta(env, k) {
  if (!env?.BW_DB) return null;
  const row = await env.BW_DB.prepare("SELECT v FROM meta WHERE k = ?1").bind(k).first();
  return row?.v ?? null;
}

export async function setMeta(env, k, v) {
  if (!env?.BW_DB) return;
  await env.BW_DB
    .prepare("INSERT INTO meta (k, v) VALUES (?1, ?2) ON CONFLICT(k) DO UPDATE SET v = excluded.v")
    .bind(k, String(v))
    .run();
}
