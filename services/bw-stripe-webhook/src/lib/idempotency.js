/**
 * Garde-fou anti-doublon.
 * Stripe re-livre un evenement jusqu'a 3 jours en cas d'echec : sans cette garde,
 * un meme paiement peut creer 2 deals. Store en memoire + fichier JSON (suffisant
 * pour une instance unique). Pour du multi-instance, remplacer par Redis/Postgres.
 */
import fs from 'node:fs';
import path from 'node:path';

const FILE = process.env.IDEMPOTENCY_FILE || path.join(process.cwd(), '.processed-events.json');
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours

let store = {};
try {
  if (fs.existsSync(FILE)) store = JSON.parse(fs.readFileSync(FILE, 'utf8'));
} catch {
  store = {};
}

function persist() {
  try {
    fs.writeFileSync(FILE, JSON.stringify(store));
  } catch {
    /* non bloquant */
  }
}

function prune() {
  const cutoff = Date.now() - TTL_MS;
  let dirty = false;
  for (const [k, v] of Object.entries(store)) {
    if (v < cutoff) {
      delete store[k];
      dirty = true;
    }
  }
  if (dirty) persist();
}

export function alreadyProcessed(eventId) {
  prune();
  return Object.prototype.hasOwnProperty.call(store, eventId);
}

export function markProcessed(eventId) {
  store[eventId] = Date.now();
  persist();
}
