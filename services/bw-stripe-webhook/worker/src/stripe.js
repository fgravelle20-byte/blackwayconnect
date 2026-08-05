/**
 * Verification de signature Stripe en Web Crypto (pas de SDK Node dans un Worker).
 * Implemente le meme schema que stripe.webhooks.constructEvent.
 */

const enc = new TextEncoder();

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function bytesToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Comparaison a temps constant : evite les attaques par mesure de temps. */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * @param {string} payload  corps brut de la requete
 * @param {string} header   valeur de l'en-tete Stripe-Signature
 * @param {string} secret   whsec_...
 * @param {number} toleranceSec  fenetre anti-rejeu (defaut 5 min, comme Stripe)
 */
export async function verifierSignature(payload, header, secret, toleranceSec = 300) {
  if (!header) throw new Error('En-tete Stripe-Signature absent');

  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const i = p.indexOf('=');
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) throw new Error('Signature malformee');

  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (Math.abs(age) > toleranceSec) throw new Error(`Horodatage hors tolerance (${age}s)`);

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${payload}`));
  const attendu = bytesToHex(mac);

  if (!timingSafeEqual(hexToBytes(attendu), hexToBytes(signature))) {
    throw new Error('Signature invalide');
  }
  return JSON.parse(payload);
}

/** Recupere les line items enrichis (absents du payload du webhook). */
export async function listLineItems(sessionId, secretKey) {
  const url = `https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items?limit=20&expand[]=data.price.product`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${secretKey}` } });
  if (!res.ok) throw new Error(`Stripe ${res.status} line_items :: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return json.data || [];
}
