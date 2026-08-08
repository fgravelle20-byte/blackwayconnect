/** Edge HTML SEO injection for social crawlers (no JS). */

const SITE = "https://blackwayconnect.com";
const OG_IMAGE = `${SITE}/og.png`;

type PageMeta = {
  title: string;
  description: string;
  ogTitle: string;
};

function pageMeta(pageKey: string, lang: "fr" | "en"): PageMeta {
  const fr = lang === "fr";
  const map: Record<string, PageMeta> = {
    home: {
      title: fr
        ? "BlackWayConnect | Plateforme lead-to-revenue · CA + US"
        : "BlackWayConnect | Lead-to-revenue platform · CA + US",
      ogTitle: fr
        ? "BlackWayConnect — fermez plus, sans empiler d'outils"
        : "BlackWayConnect — close more without tool sprawl",
      description: fr
        ? "Plateforme bilingue lead-to-revenue : site, CRM, soumissions et paiements. Québec, Canada et États-Unis — un seul système pour encaisser."
        : "Bilingual lead-to-revenue platform: site, CRM, quotes and payments. Quebec, Canada and the U.S. — one system to collect cash.",
    },
    outils: {
      title: fr
        ? "BlackWayConnect | Master Tools — arsenal lead-to-revenue"
        : "BlackWayConnect | Master Tools — lead-to-revenue toolkit",
      ogTitle: fr
        ? "Master Tools — Leak Score, relance, soumission"
        : "Master Tools — Leak Score, recovery, quotes",
      description: fr
        ? "Leak Score, relance panier, générateur de soumission Stripe, checklist, ROI, Grow Hub — outils pour fermer plus et encaisser."
        : "Leak Score, cart recovery, Stripe quote generator, checklist, ROI, Grow Hub — tools to close more and collect cash.",
    },
    "outils/relance-panier": {
      title: fr
        ? "BlackWayConnect | Relance panier / devis abandonnés"
        : "BlackWayConnect | Abandoned cart / quote recovery",
      ogTitle: fr ? "Relance panier — combien dorment ?" : "Cart recovery — how much sits idle?",
      description: fr
        ? "Estimateur libre-service : devis abandonnés → dollars exposés → gain Grow Hub Growth 499 $."
        : "Self-serve checker: abandoned quotes → dollars exposed → Grow Hub Growth $499 lift.",
    },
    "outils/soumission": {
      title: fr
        ? "BlackWayConnect | Générateur de soumission → Stripe"
        : "BlackWayConnect | Quote generator → Stripe",
      ogTitle: fr ? "Soumission → lien Stripe Growth" : "Quote → Stripe Growth link",
      description: fr
        ? "Rédigez une soumission, copiez le texte et ouvrez le paiement Stripe Growth. Capture CRM incluse."
        : "Draft a quote, copy the text and open Stripe Growth payment. CRM capture included.",
    },
    "outils/checklist": {
      title: fr
        ? "BlackWayConnect | Checklist fermeture 7 jours"
        : "BlackWayConnect | 7-day close checklist",
      ogTitle: fr ? "Checklist lead magnet — gratuit" : "Checklist lead magnet — free",
      description: fr
        ? "Huit actions pour fermer sans fuite. Courriel → checklist PDF. CTA Growth + Portail."
        : "Eight actions to close without leakage. Email → PDF checklist. Growth + Portal CTAs.",
    },
    "grow-hub": {
      title: fr
        ? "BlackWayConnect | Grow Hub — aperçu pipeline"
        : "BlackWayConnect | Grow Hub — pipeline preview",
      ogTitle: fr
        ? "Grow Hub — pipeline bilingue interactif"
        : "Grow Hub — interactive bilingual pipeline",
      description: fr
        ? "Pipeline bilingue interactif : prochaines actions, étapes et chemin vers l'abonnement Grow Hub."
        : "Interactive bilingual pipeline: next actions, stages and a path to Grow Hub subscribe.",
    },
    forfaits: {
      title: fr
        ? "BlackWayConnect | Forfaits Grow Hub · Spark → Partner"
        : "BlackWayConnect | Grow Hub plans · Spark → Partner",
      ogTitle: fr
        ? "Forfaits Grow Hub — 99 $ à 2 499 $ CAD/mois"
        : "Grow Hub plans — $99 to $2,499 CAD/mo",
      description: fr
        ? "Spark 99 $ à Partner 2 499 $ CAD/mois. Choisissez le palier qui ferme vos fuites — Stripe Checkout, sans changer de système."
        : "Spark $99 to Partner $2,499 CAD/mo. Pick the tier that closes your leaks — Stripe Checkout, same system as you grow.",
    },
    "forfaits-growth": {
      title: fr
        ? "BlackWayConnect | Grow Hub Growth · 499 $/mois"
        : "BlackWayConnect | Grow Hub Growth · $499/mo",
      ogTitle: fr ? "Growth 499 $ — ferme plus de leads" : "Growth $499 — close more leads",
      description: fr
        ? "Landing pub : Grow Hub Growth 499 $ CAD/mois. Portail + dashboard mobile inclus."
        : "Ad landing: Grow Hub Growth $499 CAD/mo. Portal + mobile dashboard included.",
    },
    diagnostic: {
      title: fr
        ? "BlackWayConnect | Revenue Leak Score · 60 secondes"
        : "BlackWayConnect | Revenue Leak Score · 60 seconds",
      ogTitle: fr
        ? "Revenue Leak Score — où fuit votre revenu ?"
        : "Revenue Leak Score — where is revenue leaking?",
      description: fr
        ? "Diagnostic 60 secondes : six questions, un score de fuite et le forfait Grow Hub recommandé. Partagez-le avec votre équipe."
        : "60-second diagnostic: six questions, one leak score and the recommended Grow Hub plan. Share it with your team.",
    },
    portail: {
      title: fr
        ? "BlackWayConnect | Portail Client Master"
        : "BlackWayConnect | Client Master Portal",
      ogTitle: fr
        ? "Portail Client — dashboard web et mobile"
        : "Client Portal — web and mobile dashboard",
      description: fr
        ? "Accédez à votre Portail Client Master après paiement Grow Hub. Outils, forfaits et support — un seul dashboard."
        : "Access your Client Master Portal after Grow Hub payment. Tools, plans and support — one dashboard.",
    },
    portal: {
      title: fr
        ? "BlackWayConnect | Portail Client Master"
        : "BlackWayConnect | Client Master Portal",
      ogTitle: fr
        ? "Portail Client — dashboard web et mobile"
        : "Client Portal — web and mobile dashboard",
      description: fr
        ? "Accédez à votre Portail Client Master après paiement Grow Hub."
        : "Access your Client Master Portal after Grow Hub payment.",
    },
  };
  return map[pageKey] || map.home;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function replaceMeta(html: string, attr: "name" | "property", key: string, content: string) {
  const re = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`, "i");
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function replaceLink(html: string, rel: string, href: string, hreflang?: string) {
  if (hreflang) {
    const re = new RegExp(
      `<link\\s+rel="${rel}"\\s+hreflang="${hreflang}"\\s+href="[^"]*"\\s*/?>`,
      "i",
    );
    const tag = `<link rel="${rel}" hreflang="${hreflang}" href="${escapeHtml(href)}" />`;
    if (re.test(html)) return html.replace(re, tag);
    return html.replace("</head>", `    ${tag}\n  </head>`);
  }
  const re = new RegExp(`<link\\s+rel="${rel}"\\s+href="[^"]*"\\s*/?>`, "i");
  const tag = `<link rel="${rel}" href="${escapeHtml(href)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function replaceTitle(html: string, title: string) {
  if (/<title>[^<]*<\/title>/i.test(html)) {
    return html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  }
  return html.replace("</head>", `    <title>${escapeHtml(title)}</title>\n  </head>`);
}

/** Map SPA path → page key + lang. */
export function resolveRoute(pathname: string): {
  lang: "fr" | "en";
  pageKey: string;
  frPath: string;
  enPath: string;
  canonical: string;
} {
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const bare = (isEn ? pathname.replace(/^\/en(?=\/|$)/, "") : pathname) || "/";
  const clean = bare === "/" ? "/" : bare.replace(/\/$/, "") || "/";
  const pageKey = clean === "/" ? "home" : clean.replace(/^\//, "") || "home";
  const frPath = clean === "/" ? "/" : clean;
  const enPath = clean === "/" ? "/en" : `/en${clean}`;
  const lang: "fr" | "en" = isEn ? "en" : "fr";
  const canonical = `${SITE}${lang === "en" ? enPath : frPath}`;
  return { lang, pageKey, frPath, enPath, canonical };
}

export function injectSeoHtml(html: string, pathname: string): string {
  const { lang, pageKey, frPath, enPath, canonical } = resolveRoute(pathname);
  const meta = pageMeta(pageKey, lang);
  let out = html;

  out = out.replace(/<html\s+lang="[^"]*"/i, `<html lang="${lang}"`);
  out = replaceTitle(out, meta.title);
  out = replaceMeta(out, "name", "description", meta.description);
  out = replaceMeta(out, "property", "og:title", meta.ogTitle);
  out = replaceMeta(out, "property", "og:description", meta.description);
  out = replaceMeta(out, "property", "og:url", canonical);
  out = replaceMeta(out, "property", "og:image", OG_IMAGE);
  out = replaceMeta(out, "property", "og:image:secure_url", OG_IMAGE);
  out = replaceMeta(out, "property", "og:locale", lang === "fr" ? "fr_CA" : "en_CA");
  out = replaceMeta(out, "property", "og:locale:alternate", lang === "fr" ? "en_CA" : "fr_CA");
  out = replaceMeta(out, "name", "twitter:title", meta.ogTitle);
  out = replaceMeta(out, "name", "twitter:description", meta.description);
  out = replaceMeta(out, "name", "twitter:image", OG_IMAGE);
  out = replaceLink(out, "canonical", canonical);
  out = replaceLink(out, "alternate", `${SITE}${frPath}`, "fr");
  out = replaceLink(out, "alternate", `${SITE}${enPath}`, "en");
  out = replaceLink(out, "alternate", `${SITE}/`, "x-default");

  return out;
}

export function shouldInjectHtml(request: Request, pathname: string): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (pathname.startsWith("/api/")) return false;
  if (/\.[a-z0-9]{1,8}$/i.test(pathname)) return false;
  return true;
}
