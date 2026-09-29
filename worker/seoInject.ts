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
        ? "Leak Score, courriel de relance, soumission à ton nom, checklist, ROI — 2 minutes, tu sors avec un fichier ou un mail."
        : "Leak Score, follow-up email, quote in your name, checklist, ROI — 2 minutes, you leave with a file or an email.",
    },
    "outils/relance-panier": {
      title: fr
        ? "BlackWayConnect | Courriel de relance panier / devis"
        : "BlackWayConnect | Cart / quote follow-up email",
      ogTitle: fr ? "Relance prête à coller — ton nom, ton lien" : "Follow-up ready to paste — your name, your link",
      description: fr
        ? "Génère le courriel de relance HTML ou texte pour tes paniers abandonnés, à ton nom avec ton lien de paiement. Copie, colle dans Gmail."
        : "Generate the HTML or text follow-up for abandoned carts, in your name with your payment link. Copy, paste into Gmail.",
    },
    "outils/soumission": {
      title: fr
        ? "BlackWayConnect | Soumission à ton nom — imprimable"
        : "BlackWayConnect | Quote in your name — printable",
      ogTitle: fr ? "Soumission à ton nom en 2 minutes" : "Quote in your name in 2 minutes",
      description: fr
        ? "Devis à ta raison sociale avec ton lien de paiement. Copie, imprime en PDF, garde une copie locale."
        : "Quote under your business name with your payment link. Copy, print to PDF, keep a local copy.",
    },
    "outils/checklist": {
      title: fr
        ? "BlackWayConnect | Checklist fermeture 7 jours"
        : "BlackWayConnect | 7-day close checklist",
      ogTitle: fr ? "Checklist fermeture 7 jours — sans courriel" : "7-day close checklist — no email needed",
      description: fr
        ? "Cases à cocher sauvegardées, liste de fermeture éditable, impression PDF. Aucun courriel requis."
        : "Saved checkboxes, editable close list, print to PDF. No email required.",
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
        ? "Spark 99 $ à Partner 2 499 $ CAD/mois. Launch/Growth/Scale en Paddle ; Spark/Command/Partner via /contact."
        : "Spark $99 to Partner $2,499 CAD/mo. Launch/Growth/Scale on Paddle; Spark/Command/Partner via /contact.",
    },
    "forfaits-growth": {
      title: fr
        ? "BlackWayConnect | Grow Hub Growth · 349 $/mois"
        : "BlackWayConnect | Grow Hub Growth · $349/mo",
      ogTitle: fr ? "Growth 349 $ — ferme plus de leads" : "Growth $349 — close more leads",
      description: fr
        ? "Landing pub : Grow Hub Growth 349 $ CAD/mois. Portail + dashboard mobile inclus. Paddle."
        : "Ad landing: Grow Hub Growth $349 CAD/mo. Portal + mobile dashboard included. Paddle.",
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
