/**
 * Plan #1 — modèle de vente verrouillé
 *
 * Type A (revenu #1): Grow Hub web /forfaits — inclut accès mobile au Portail (surplus $0).
 * Pitch: « Contrôle ton dashboard partout sur mobile. L’app est incluse. »
 * Type B (revenu #2 optionnel): Pack Cellulaire /forfaits-cellulaire — outils terrain.
 * Merge: un Portail Master + HubSpot (union des outils A + B).
 */

export const SITE_ORIGIN = "https://blackwayconnect.com";

/** Mobile dashboard = same Portail (included surplus with Type A). */
export const PORTAL_URL = `${SITE_ORIGIN}/portail`;
export const MOBILE_DASHBOARD_URL = PORTAL_URL;

/** Type B optional upsell storefront — NOT “the app”. */
export const CELLULAIRE_PLANS_URL = `${SITE_ORIGIN}/forfaits-cellulaire`;

/** @deprecated use MOBILE_DASHBOARD_URL — kept for older imports */
export const APP_PLANS_URL = MOBILE_DASHBOARD_URL;
/** @deprecated use MOBILE_DASHBOARD_URL */
export const APP_WEB_URL = MOBILE_DASHBOARD_URL;

/** Empty until App Store listing is Ready for Sale. ASC Apple ID (internal): 6797345749 — not a public URL. */
export const APP_STORE_URL = "";
export const PLAY_STORE_URL = "";

export const STRIPE_WEBHOOK_URL = "https://api.blackwayconnect.com/webhooks/stripe";

export const APP_QR_PATH = "/qr-app.svg";
export const SITE_QR_PATH = "/qr-site.svg";
export const OUTILS_QR_PATH = "/qr-outils.svg";

/** Deep link to Portail Master (mobile dashboard — included with Grow Hub). */
export function mobileDashboardLink(params: {
  source?: string;
  campaign?: string;
  content?: string;
  lang?: "fr" | "en";
  forfait?: string;
  bw_ref?: string;
} = {}) {
  const url = new URL(MOBILE_DASHBOARD_URL);
  if (params.lang === "en") {
    url.pathname = "/en/portail";
  }
  url.searchParams.set("utm_source", params.source || "blackwayconnect_site");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", params.campaign || "mobile_dashboard");
  if (params.content) url.searchParams.set("utm_content", params.content);
  url.searchParams.set("bw_ref", params.bw_ref || "site");
  url.searchParams.set("bw_source", "mobile_dashboard");
  if (params.forfait) url.searchParams.set("bw_forfait", params.forfait);
  return url.toString();
}

/** @deprecated use mobileDashboardLink */
export function appDeepLink(params: {
  source?: string;
  campaign?: string;
  content?: string;
  lang?: "fr" | "en";
  forfait?: string;
  bw_ref?: string;
} = {}) {
  return mobileDashboardLink(params);
}

/** Deep link to optional Pack Cellulaire (revenu #2). */
export function cellulaireDeepLink(params: {
  source?: string;
  campaign?: string;
  content?: string;
  lang?: "fr" | "en";
  forfait?: string;
  bw_ref?: string;
} = {}) {
  const url = new URL(CELLULAIRE_PLANS_URL);
  if (params.lang === "en") {
    url.pathname = "/en/forfaits-cellulaire";
  }
  url.searchParams.set("utm_source", params.source || "blackwayconnect_site");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", params.campaign || "pack_cellulaire");
  if (params.content) url.searchParams.set("utm_content", params.content);
  url.searchParams.set("bw_ref", params.bw_ref || "site");
  url.searchParams.set("bw_source", "cellulaire");
  if (params.forfait) url.searchParams.set("bw_forfait", params.forfait);
  return url.toString();
}

/** Footer QR → Portail mobile (surplus inclus). */
export function footerAppQrUrl(lang: "fr" | "en" = "fr") {
  return mobileDashboardLink({ lang, content: "site_footer_qr", bw_ref: "site_footer_qr" });
}
