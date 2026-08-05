/**
 * Test local sans Stripe ni HubSpot reels.
 * Lancer : DRY_RUN=1 node test/test-local.js
 */
process.env.DRY_RUN = '1';
process.env.LOG_LEVEL = 'warn';

const { resoudreForfait, calculerScore } = await import('../src/handlers/checkoutSessionCompleted.js');
const { CATALOGUE, PRICE_INDEX } = await import('../src/config.js');

let ok = 0;
let ko = 0;
function check(nom, attendu, obtenu) {
  const pass = JSON.stringify(attendu) === JSON.stringify(obtenu);
  console.log(`${pass ? 'OK  ' : 'ECHEC'} ${nom}${pass ? '' : ` -> attendu ${JSON.stringify(attendu)}, obtenu ${JSON.stringify(obtenu)}`}`);
  pass ? ok++ : ko++;
}

// --- Resolution du forfait ---
check('metadonnee session directe', 'AI Scale',
  resoudreForfait({ metadata: { bw_forfait: 'AI Scale' }, lineItems: [] }));

check('metadonnee sur le prix', 'Revenue System',
  resoudreForfait({ metadata: {}, lineItems: [{ price: { id: 'x', metadata: { bw_forfait: 'Revenue System' } } }] }));

check('fallback par price_id', 'Grow Hub Scale',
  resoudreForfait({ metadata: {}, lineItems: [{ price: { id: 'price_1U0CWqAG7HUL9RtrwZ66aT90', metadata: {} } }] }));

check('fallback par nom produit', 'Website & Lead Launch',
  resoudreForfait({ metadata: {}, lineItems: [{ description: 'BlackWayConnect — Website & Lead Launch', price: { id: 'inconnu', metadata: {} } }] }));

check('alias snake_case metadata', 'Grow Hub Growth',
  resoudreForfait({ metadata: { bw_forfait: 'grow_hub_growth' }, lineItems: [] }));

check('alias libelle FR', 'Website & Lead Launch',
  resoudreForfait({ metadata: { bw_forfait: 'Site haute conversion' }, lineItems: [] }));

check('forfait inconnu', null,
  resoudreForfait({ metadata: {}, lineItems: [{ description: 'Autre chose', price: { id: 'zzz', metadata: {} } }] }));

// --- Scoring (grille corrigée 4 août 2026) ---
check('score AI Scale pro recurrent', 100,
  calculerScore('AI Scale', { mode: 'subscription', amount_total: 799500, customer_details: { email: 'a@entreprise.ca' } }));

check('score Grow Hub Launch gmail', 70,
  calculerScore('Grow Hub Launch', { mode: 'subscription', amount_total: 29900, customer_details: { email: 'a@gmail.com' } }));

check('score Website & Lead Launch pro', 75,
  calculerScore('Website & Lead Launch', { mode: 'payment', amount_total: 199500, customer_details: { email: 'a@pme.qc.ca' } }));

check('montant Grow Hub Growth corrigé', 749, CATALOGUE['Grow Hub Growth'].montant);
check('montant Site haute conversion corrigé', 1995, CATALOGUE['Website & Lead Launch'].montant);

// --- Coherence catalogue ---
check('6 forfaits au catalogue', 6, Object.keys(CATALOGUE).length);
check('6 price_id indexes', 6, Object.keys(PRICE_INDEX).length);
check('valeurs HubSpot uniques', 6, new Set(Object.values(CATALOGUE).map((c) => c.hubspot)).size);

// --- Chaine complete en DRY_RUN ---
const { handleCheckoutSessionCompleted } = await import('../src/handlers/checkoutSessionCompleted.js');
const fauxEvent = {
  id: 'evt_test_1',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_1',
      mode: 'payment',
      payment_status: 'paid',
      amount_total: 499500,
      currency: 'cad',
      payment_intent: 'pi_test_1',
      metadata: { bw_forfait: 'Revenue System' },
      customer_details: { email: 'francis@exemple-pme.ca', name: 'Francis Gravelle', phone: '+15145551234' },
    },
  },
};
try {
  const r = await handleCheckoutSessionCompleted(fauxEvent);
  check('chaine dry-run : forfait', 'Revenue System', r.forfait);
  check('chaine dry-run : montant', 4995, r.montant);
  check('chaine dry-run : score', 95, r.score);
  console.log('OK   chaine complete executee en DRY_RUN');
  ok++;
} catch (e) {
  console.log('ECHEC chaine complete ->', String(e).slice(0, 300));
  ko++;
}

console.log(`\n${ok} reussis / ${ko} echecs`);
process.exit(ko === 0 ? 0 : 1);
