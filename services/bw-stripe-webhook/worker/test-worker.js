/** Test de la verification de signature et du routage, sans reseau. */
import { verifierSignature } from './src/stripe.js';
import { resoudreForfait, calculerScore } from './src/handler.js';
import { CATALOGUE } from './src/config.js';

const enc = new TextEncoder();
const SECRET = 'whsec_test_secret';
let ok = 0, ko = 0;
const check = (n, a, b) => {
  const p = JSON.stringify(a) === JSON.stringify(b);
  console.log(`${p ? 'OK  ' : 'ECHEC'} ${n}${p ? '' : ` -> attendu ${JSON.stringify(a)}, obtenu ${JSON.stringify(b)}`}`);
  p ? ok++ : ko++;
};

async function signer(payload, ts) {
  const key = await crypto.subtle.importKey('raw', enc.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}.${payload}`));
  return [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const body = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' });
const ts = Math.floor(Date.now() / 1000);

const bonne = await signer(body, ts);
const ev = await verifierSignature(body, `t=${ts},v1=${bonne}`, SECRET);
check('signature valide acceptee', 'evt_1', ev.id);

try { await verifierSignature(body, `t=${ts},v1=${'0'.repeat(64)}`, SECRET); check('signature falsifiee refusee', true, false); }
catch { console.log('OK   signature falsifiee refusee'); ok++; }

const vieux = ts - 1000;
try { await verifierSignature(body, `t=${vieux},v1=${await signer(body, vieux)}`, SECRET); check('rejeu ancien refuse', true, false); }
catch { console.log('OK   rejeu ancien refuse'); ok++; }

try { await verifierSignature(body + 'x', `t=${ts},v1=${bonne}`, SECRET); check('corps modifie refuse', true, false); }
catch { console.log('OK   corps modifie refuse'); ok++; }

check('routage price_id', 'Grow Hub Scale', resoudreForfait({ metadata: {}, lineItems: [{ price: { id: 'price_1U0CWqAG7HUL9RtrwZ66aT90', metadata: {} } }] }));
check('routage metadonnee', 'AI Scale', resoudreForfait({ metadata: { bw_forfait: 'AI Scale' }, lineItems: [] }));
check('score Revenue System pro', 95, calculerScore('Revenue System', { mode: 'payment', amount_total: 499500, customer_details: { email: 'a@pme.ca' } }));
check('6 forfaits', 6, Object.keys(CATALOGUE).length);

console.log(`\n${ok} reussis / ${ko} echecs`);
process.exit(ko === 0 ? 0 : 1);
