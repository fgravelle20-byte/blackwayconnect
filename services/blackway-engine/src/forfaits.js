/**
 * forfaits.js
 * ------------------------------------------------------------------
 * Grille tarifaire corrigée BlackWayConnect (4 août 2026)
 * + identifiants Stripe LIVE historiques (acct_1TDZjzAG7HUL9Rtr).
 *
 * Source : artifacts/Grille tarifaire corrigée BlackWayConnect.md
 *
 * NOTE : les priceId / payment links ci-dessous correspondent encore
 * aux anciens montants Stripe. Créer de nouveaux Price + Payment Links
 * aux montants corrigés, puis mettre à jour ce fichier.
 * ------------------------------------------------------------------
 */

/** Montants en dollars canadiens (pour HubSpot) — grille corrigée. */
export const PRIX = {
  'Website & Lead Launch': 1995,
  'Revenue System': 4995,
  'AI Scale': 7995,
  'Grow Hub Launch': 299,
  'Grow Hub Growth': 749,
  'Grow Hub Scale': 1495,
  'Site haute conversion': 1995,
  'Système de revenus complet': 4995,
  'Application mobile iOS & Android': 7995,
  website_lead_launch: 1995,
  revenue_system: 4995,
  ai_scale: 7995,
  grow_hub_launch: 299,
  grow_hub_growth: 749,
  grow_hub_scale: 1495,
  Autre: 4995,
};

/** Catalogue Stripe LIVE : un bloc par forfait. */
export const FORFAITS = {
  'Website & Lead Launch': {
    type: 'activation',
    hubspot: 'website_lead_launch',
    label: 'Site haute conversion',
    montantCad: 1995,
    delaiJours: 21,
    scoreBase: 70,
    productId: 'prod_V0Cv1dDC5eC0C9',
    priceId: 'price_1U0CWRAG7HUL9RtrKszbmNvn',
    paymentLinkId: 'plink_1U0CWqAG7HUL9Rtr4J2ZEzkR',
    paymentLinkUrl: 'https://buy.stripe.com/fZu9AS2HH3sT2ZEdVIeIw0q',
    growHub: 'Grow Hub Launch',
  },
  'Revenue System': {
    type: 'activation',
    hubspot: 'revenue_system',
    label: 'Système de revenus complet',
    montantCad: 4995,
    delaiJours: 35,
    scoreBase: 85,
    productId: 'prod_V0CvPLTwUMUkf5',
    priceId: 'price_1U0CWYAG7HUL9RtrqiOYoSVL',
    paymentLinkId: 'plink_1U0CYLAG7HUL9RtrNTfiAtBc',
    paymentLinkUrl: 'https://buy.stripe.com/14A7sKeqpfbB8jY5pceIw0r',
    growHub: 'Grow Hub Growth',
  },
  'AI Scale': {
    type: 'activation',
    hubspot: 'ai_scale',
    label: 'Application mobile iOS & Android',
    montantCad: 7995,
    delaiJours: 45,
    scoreBase: 95,
    productId: 'prod_V0CvaVl6B0EDYB',
    priceId: 'price_1U0CWYAG7HUL9RtrEHxzww0T',
    paymentLinkId: 'plink_1U0CYQAG7HUL9RtrnwAlCNxb',
    paymentLinkUrl: 'https://buy.stripe.com/dRm8wO965fbB8jY5pceIw0s',
    growHub: 'Grow Hub Scale',
  },
  'Grow Hub Launch': {
    type: 'abonnement',
    hubspot: 'grow_hub_launch',
    label: 'Grow Hub Launch',
    montantCad: 299,
    delaiJours: 7,
    scoreBase: 65,
    recurrence: 'mois',
    productId: 'prod_V0Cw4lDSQG8ni9',
    priceId: 'price_1U0CWiAG7HUL9RtrKaR00BRz',
    paymentLinkId: 'plink_1U0CYWAG7HUL9RtrYxrC4Lvr',
    paymentLinkUrl: 'https://buy.stripe.com/6oUfZgbedgfFgQu2d0eIw0t',
    forfaitParent: 'Website & Lead Launch',
  },
  'Grow Hub Growth': {
    type: 'abonnement',
    hubspot: 'grow_hub_growth',
    label: 'Grow Hub Growth',
    montantCad: 749,
    delaiJours: 7,
    scoreBase: 80,
    recurrence: 'mois',
    productId: 'prod_V0CwXaZSeLKWuy',
    priceId: 'price_1U0CWhAG7HUL9RtrRUDlmp9v',
    paymentLinkId: 'plink_1U0CYcAG7HUL9RtraIy6aIJG',
    paymentLinkUrl: 'https://buy.stripe.com/28EeVc1DDd3tbwag3QeIw0u',
    forfaitParent: 'Revenue System',
  },
  'Grow Hub Scale': {
    type: 'abonnement',
    hubspot: 'grow_hub_scale',
    label: 'Grow Hub Scale',
    montantCad: 1495,
    delaiJours: 7,
    scoreBase: 92,
    recurrence: 'mois',
    productId: 'prod_V0CwXQVCdNCNIO',
    priceId: 'price_1U0CWqAG7HUL9RtrwZ66aT90',
    paymentLinkId: 'plink_1U0CYiAG7HUL9RtrimBRfroT',
    paymentLinkUrl: 'https://buy.stripe.com/6oUfZg0zz6F57fU3h4eIw0v',
    forfaitParent: 'AI Scale',
  },
};

const ALIASES = {
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

/** Index inversés pour retrouver un forfait à partir d'un objet Stripe. */
export const PAR_PRICE_ID = Object.fromEntries(
  Object.entries(FORFAITS).map(([nom, f]) => [f.priceId, nom]),
);

export const PAR_PRODUCT_ID = Object.fromEntries(
  Object.entries(FORFAITS).map(([nom, f]) => [f.productId, nom]),
);

export const PAR_PAYMENT_LINK_ID = Object.fromEntries(
  Object.entries(FORFAITS).map(([nom, f]) => [f.paymentLinkId, nom]),
);

/**
 * Déduit le nom du forfait à partir d'un événement Stripe.
 * Ordre de priorité : metadata.bw_forfait > payment_link > price > product.
 * @param {object} objet - objet Stripe (session, invoice, payment_intent…)
 * @returns {string} nom du forfait, ou 'Autre' si non reconnu
 */
export function detecterForfait(objet = {}) {
  const meta = objet.metadata || {};
  if (meta.bw_forfait) {
    if (PRIX[meta.bw_forfait] !== undefined && FORFAITS[meta.bw_forfait]) {
      return meta.bw_forfait;
    }
    if (ALIASES[meta.bw_forfait]) return ALIASES[meta.bw_forfait];
  }
  if (objet.payment_link && PAR_PAYMENT_LINK_ID[objet.payment_link]) {
    return PAR_PAYMENT_LINK_ID[objet.payment_link];
  }
  const priceId =
    objet.price?.id ||
    objet.lines?.data?.[0]?.price?.id ||
    objet.items?.data?.[0]?.price?.id;
  if (priceId && PAR_PRICE_ID[priceId]) return PAR_PRICE_ID[priceId];

  const productId = objet.price?.product || objet.lines?.data?.[0]?.price?.product;
  if (productId && PAR_PRODUCT_ID[productId]) return PAR_PRODUCT_ID[productId];

  return 'Autre';
}

/**
 * Retourne l'offre Grow Hub à proposer après une activation payée.
 * @param {string} forfait
 * @returns {{nom: string, montantCad: number, lien: string}|null}
 */
export function offreGrowHub(forfait) {
  const cle = ALIASES[forfait] || forfait;
  const nom = FORFAITS[cle]?.growHub;
  if (!nom) return null;
  const gh = FORFAITS[nom];
  return { nom, montantCad: gh.montantCad, lien: gh.paymentLinkUrl };
}
