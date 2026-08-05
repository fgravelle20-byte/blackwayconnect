/**
 * BlackWayConnect — Configuration du routage Stripe -> HubSpot
 * Portail HubSpot : 343472254
 * Pipeline deals  : BlackWay – Revenue (2117849055)
 *
 * Grille tarifaire corrigée — 4 août 2026
 * Source : artifacts/Grille tarifaire corrigée BlackWayConnect.md
 */

export const HUBSPOT = {
  portalId: '343472254',
  pipelineId: '2117849055',
  stages: {
    nouvelle_opportunite: '3584700391',
    qualifie: '3584700392',
    soumission_envoyee: '3584700393',
    negociation: '3584700394',
    paiement_recu: '3584700395',
    en_livraison: '3584700396',
    livre_gagne: '3584700397',
    perdu: '3584700398',
  },
  // Association type IDs standards HubSpot (v4)
  assoc: {
    dealToContact: 3,
    dealToCompany: 5,
    noteToDeal: 214,
    noteToContact: 202,
  },
};

/**
 * Catalogue BlackWayConnect (clés = libellés Stripe historiques / metadata).
 * `hubspot` = valeur interne de l'enum bw_forfait côté HubSpot (snake_case).
 * `montant` = grille corrigée du 4 août 2026 (CAD).
 *
 * NOTE Stripe : les price_id ci-dessous sont les prix LIVE historiques.
 * Créer de nouveaux Price objects aux montants corrigés, puis mettre à jour
 * priceId + payment links. Les anciens price_id restent indexés pour
 * reconnaître les paiements déjà en cours.
 */
export const CATALOGUE = {
  'Website & Lead Launch': {
    hubspot: 'website_lead_launch',
    label: 'Site haute conversion',
    sku: 'PRJ-SITE',
    type: 'activation',
    montant: 1995,
    devise: 'CAD',
    priceId: 'price_1U0CWRAG7HUL9RtrKszbmNvn',
    delaiJours: 21,
    scoreBase: 70,
    upsell: 'Grow Hub Launch',
  },
  'Revenue System': {
    hubspot: 'revenue_system',
    label: 'Système de revenus complet',
    sku: 'PRJ-REVENU',
    type: 'activation',
    montant: 4995,
    devise: 'CAD',
    priceId: 'price_1U0CWYAG7HUL9RtrqiOYoSVL',
    delaiJours: 35,
    scoreBase: 85,
    upsell: 'Grow Hub Growth',
  },
  'AI Scale': {
    hubspot: 'ai_scale',
    label: 'Application mobile iOS & Android',
    sku: 'PRJ-APP',
    type: 'activation',
    montant: 7995,
    devise: 'CAD',
    priceId: 'price_1U0CWYAG7HUL9RtrEHxzww0T',
    delaiJours: 45,
    scoreBase: 95,
    upsell: 'Grow Hub Scale',
  },
  'Grow Hub Launch': {
    hubspot: 'grow_hub_launch',
    label: 'Grow Hub Launch',
    sku: 'GH-LAUNCH',
    type: 'abonnement',
    montant: 299,
    devise: 'CAD',
    priceId: 'price_1U0CWiAG7HUL9RtrKaR00BRz',
    delaiJours: 7,
    scoreBase: 65,
    upsell: 'Grow Hub Growth',
  },
  'Grow Hub Growth': {
    hubspot: 'grow_hub_growth',
    label: 'Grow Hub Growth',
    sku: 'GH-GROWTH',
    type: 'abonnement',
    montant: 749,
    devise: 'CAD',
    priceId: 'price_1U0CWhAG7HUL9RtrRUDlmp9v',
    delaiJours: 7,
    scoreBase: 80,
    upsell: 'Grow Hub Scale',
  },
  'Grow Hub Scale': {
    hubspot: 'grow_hub_scale',
    label: 'Grow Hub Scale',
    sku: 'GH-SCALE',
    type: 'abonnement',
    montant: 1495,
    devise: 'CAD',
    priceId: 'price_1U0CWqAG7HUL9RtrwZ66aT90',
    delaiJours: 7,
    scoreBase: 92,
    upsell: null,
  },
};

/** Alias metadata / libellés FR / snake_case → clé catalogue. */
export const ALIASES = {
  website_lead_launch: 'Website & Lead Launch',
  revenue_system: 'Revenue System',
  ai_scale: 'AI Scale',
  grow_hub_launch: 'Grow Hub Launch',
  grow_hub_growth: 'Grow Hub Growth',
  grow_hub_scale: 'Grow Hub Scale',
  'Site haute conversion': 'Website & Lead Launch',
  'Système de revenus complet': 'Revenue System',
  'Système de revenus': 'Revenue System',
  'Application mobile iOS & Android': 'AI Scale',
  'Application mobile & IA': 'AI Scale',
};

/** Index inverse : price_id -> cle catalogue. Fallback si la metadonnee manque. */
export const PRICE_INDEX = Object.fromEntries(
  Object.entries(CATALOGUE).map(([label, c]) => [c.priceId, label])
);

/** Index par nom de produit Stripe (« BlackWayConnect — Revenue System »). */
export const NAME_INDEX = Object.fromEntries(
  Object.keys(CATALOGUE).map((label) => [
    label.toLowerCase().replace(/\s+/g, ' ').trim(),
    label,
  ])
);

export function normaliserForfait(valeur) {
  if (!valeur) return null;
  if (CATALOGUE[valeur]) return valeur;
  if (ALIASES[valeur]) return ALIASES[valeur];
  const lower = String(valeur).toLowerCase().replace(/\s+/g, ' ').trim();
  if (NAME_INDEX[lower]) return NAME_INDEX[lower];
  for (const [alias, cle] of Object.entries(ALIASES)) {
    if (alias.toLowerCase() === lower) return cle;
  }
  return null;
}

export const ENV = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  hubspotToken: process.env.HUBSPOT_TOKEN,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || null,
  port: Number(process.env.PORT || 8080),
  dryRun: process.env.DRY_RUN === '1',
};
