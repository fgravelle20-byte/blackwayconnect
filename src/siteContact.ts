/** Bureau + contact public — pas de secrets. */

export const OFFICE = {
  street: "313 Cuvillier Ouest, Local # 302",
  cityLine: "J4L 0B2, Qc, Canada",
  /** Une ligne pour Google Maps / liens. */
  full: "313 Cuvillier Ouest, Local # 302, J4L 0B2, Qc, Canada",
} as const;

export const EMAILS = {
  service: "serviceclient@blackwayconnect.com",
  accounting: "accounting@blackwayconnect.com",
} as const;

/** Numéros publics — affichage + liens `tel:`. */
export const PHONES = {
  local: {
    display: "450-231-6911",
    href: "tel:+14502316911",
  },
  tollFree: {
    display: "1-888-853-9080",
    href: "tel:+18888539080",
  },
  /** Pubs / Growth — même ligne sans frais (ne pas inventer d’autre numéro). */
  ads: {
    display: "1-888-853-9080",
    href: "tel:+18888539080",
  },
} as const;

/** Remplacez par vos vrais profils quand prêts. */
export const SOCIAL = {
  facebook: "https://www.facebook.com/blackwayconnect",
  twitter: "https://twitter.com/blackwayconnect",
  tiktok: "https://www.tiktok.com/@blackwayconnect",
  instagram: "https://www.instagram.com/blackwayconnect",
} as const;

export const MAPS_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(OFFICE.full)}`;

/** Embed sans clé API (output=embed). */
export const MAPS_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(OFFICE.full)}&hl=fr&z=17&output=embed`;
