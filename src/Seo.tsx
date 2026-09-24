import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLang } from "./i18n";
import { EMAILS, OFFICE, PHONES, SOCIAL } from "./siteContact";

const SITE = "https://blackwayconnect.com";
const OG_IMAGE = `${SITE}/og.png`;
const OG_W = "1200";
const OG_H = "630";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const sel = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(sel) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    if (hreflang) el.hreflang = hreflang;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(id: string, data: Record<string, unknown> | Record<string, unknown>[]) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

type PageSeo = { title: string; description: string; ogTitle?: string };

function pageSeo(pageKey: string, lang: "fr" | "en", fallbackBody: string): PageSeo {
  const fr = lang === "fr";
  const map: Record<string, PageSeo> = {
    home: {
      title: fr
        ? "Master Leads · Twin Turbo Full Performance"
        : "Master Leads · Twin Turbo Full Performance",
      ogTitle: fr
        ? "BlackWayConnect — Master Leads Twin Turbo"
        : "BlackWayConnect — Master Leads Twin Turbo",
      description: fr
        ? "Master Leads Platform : Twin Turbo Volume + Qualité, scoring HubSpot, checkout Paddle, Portail Client. Née au Québec — vendue mondialement."
        : "Master Leads Platform: Twin Turbo Volume + Quality, HubSpot scoring, Paddle checkout, Client Portal. Born in Québec — sold worldwide.",
    },
    outils: {
      title: fr ? "Master Tools — arsenal lead-to-revenue" : "Master Tools — lead-to-revenue toolkit",
      ogTitle: fr
        ? "Master Tools — Leak Score, relance, soumission"
        : "Master Tools — Leak Score, recovery, quotes",
      description: fr
        ? "Leak Score, relance panier, générateur de soumission Paddle, checklist, ROI, Grow Hub — outils pour fermer plus et encaisser."
        : "Leak Score, cart recovery, Paddle quote generator, checklist, ROI, Grow Hub — tools to close more and collect cash.",
    },
    "outils/relance-panier": {
      title: fr ? "Relance panier / devis abandonnés" : "Abandoned cart / quote recovery",
      ogTitle: fr ? "Relance panier — combien dorment ?" : "Cart recovery — how much sits idle?",
      description: fr
        ? "Estimateur libre-service : devis abandonnés → dollars exposés → gain Grow Hub Growth 349 $."
        : "Self-serve checker: abandoned quotes → dollars exposed → Grow Hub Growth $349 lift.",
    },
    "outils/soumission": {
      title: fr ? "Générateur de soumission → Paddle" : "Quote generator → Paddle",
      ogTitle: fr ? "Soumission → lien Paddle Growth" : "Quote → Paddle Growth link",
      description: fr
        ? "Rédigez une soumission, copiez le texte et ouvrez le paiement Paddle Growth. Capture CRM incluse."
        : "Draft a quote, copy the text and open Paddle Growth payment. CRM capture included.",
    },
    "outils/checklist": {
      title: fr ? "Checklist fermeture 7 jours" : "7-day close checklist",
      ogTitle: fr ? "Checklist lead magnet — gratuit" : "Checklist lead magnet — free",
      description: fr
        ? "Huit actions pour fermer sans fuite. Courriel → checklist PDF. CTA Growth + Portail."
        : "Eight actions to close without leakage. Email → PDF checklist. Growth + Portal CTAs.",
    },
    tools: {
      title: "Master Tools",
      description: fr
        ? "Arsenal d’outils BlackWayConnect pour diagnostiquer les fuites revenu et choisir un forfait Grow Hub."
        : "BlackWayConnect toolkit to diagnose revenue leaks and choose a Grow Hub plan.",
    },
    "grow-hub": {
      title: fr ? "Grow Hub — aperçu pipeline" : "Grow Hub — pipeline preview",
      ogTitle: fr
        ? "Grow Hub — pipeline bilingue interactif"
        : "Grow Hub — interactive bilingual pipeline",
      description: fr
        ? "Pipeline bilingue interactif : prochaines actions, étapes et chemin vers l’abonnement Grow Hub."
        : "Interactive bilingual pipeline: next actions, stages and a path to Grow Hub subscribe.",
    },
    forfaits: {
      title: fr ? "Forfaits BlackWayConnect · Launch, Growth, Automation" : "BlackWayConnect plans · Launch, Growth, Automation",
      ogTitle: fr
        ? "Forfaits BlackWayConnect — 149 $ à 699 $ CAD/mois"
        : "BlackWayConnect plans — $149 to $699 CAD/mo",
      description: fr
        ? "Launch 149 $, Growth 349 $ ou Automation 699 $ CAD/mois, avec essai 14 jours et paiement Paddle."
        : "Launch $149, Growth $349, or Automation $699 CAD/mo, with a 14-day trial and Paddle Checkout.",
    },
    "forfaits-growth": {
      title: fr ? "Grow Hub Growth · 349 $/mois" : "Grow Hub Growth · $349/mo",
      ogTitle: fr ? "Growth 349 $ — ferme plus de leads" : "Growth $349 — close more leads",
      description: fr
        ? "Landing pub : Grow Hub Growth 349 $ CAD/mois. Essai 14 jours, Portail + dashboard mobile inclus. Paddle."
        : "Ad landing: Grow Hub Growth $349 CAD/mo. 14-day trial, Portal + mobile dashboard included. Paddle.",
    },
    "forfaits-cellulaire": {
      title: fr
        ? "Pack Cellulaire · Signal → Command"
        : "Cellular Pack · Signal → Command",
      ogTitle: fr
        ? "Pack Cellulaire — 79 $ à 799 $ CAD/mois (optionnel)"
        : "Cellular Pack — $79 to $799 CAD/mo (optional)",
      description: fr
        ? "Revenu #2 optionnel : outils terrain. Dashboard mobile = Portail inclus avec Grow Hub. Les deux se combinent dans le Portail Client Master."
        : "Optional revenue #2: field tools. Mobile dashboard = Portal included with Grow Hub. Both merge in Client Master Portal.",
    },
    "app-forfaits": {
      title: fr ? "Pack Cellulaire" : "Cellular Pack",
      description: fr
        ? "Redirection vers le Pack Cellulaire (revenu #2 optionnel)."
        : "Redirect to Cellular Pack (optional revenue #2).",
    },
    "comment-ca-marche": {
      title: fr ? "Comment ça marche · abonnement Grow Hub" : "How it works · Grow Hub subscription",
      ogTitle: fr
        ? "Comment ça marche — paie, le forfait s’active"
        : "How it works — pay, your plan unlocks",
      description: fr
        ? "Choisis Launch, Growth ou Automation, paie avec Paddle, puis le Portail s’active automatiquement."
        : "Pick Launch, Growth, or Automation, pay with Paddle, and the Portal activates automatically.",
    },
    "how-it-works": {
      title: fr ? "Comment ça marche · abonnement Grow Hub" : "How it works · Grow Hub subscription",
      ogTitle: fr
        ? "Comment ça marche — paie, le forfait s’active"
        : "How it works — pay, your plan unlocks",
      description: fr
        ? "Choisis ton forfait, paie avec Paddle, activation auto du Portail (bw_forfait), puis tu contrôles."
        : "Pick a plan, pay on Paddle, Portal auto-activates (bw_forfait), then you control.",
    },
    diagnostic: {
      title: fr ? "Twin Turbo Leak Score · 60 secondes" : "Twin Turbo Leak Score · 60 seconds",
      ogTitle: fr
        ? "Twin Turbo Full Performance — volume + qualité"
        : "Twin Turbo Full Performance — volume + quality",
      description: fr
        ? "Diagnostic 60 s Twin Turbo : six questions, Turbo Volume + Turbo Qualité, moteur Grow Hub recommandé."
        : "60-second Twin Turbo diagnostic: six questions, Volume + Quality turbos, recommended Grow Hub engine.",
    },
    portail: {
      title: fr ? "Portail Client Master" : "Client Master Portal",
      ogTitle: fr
        ? "Portail Client — dashboard web et mobile"
        : "Client Portal — web and mobile dashboard",
      description: fr
        ? "Accédez à votre Portail Client Master après paiement Grow Hub. Outils, forfaits et support — un seul dashboard."
        : "Access your Client Master Portal after Grow Hub payment. Tools, plans and support — one dashboard.",
    },
    portal: {
      title: fr ? "Portail Client Master" : "Client Master Portal",
      description: fr
        ? "Accédez à votre Portail Client Master après paiement Grow Hub."
        : "Access your Client Master Portal after Grow Hub payment.",
    },
    score: {
      title: "Revenue Leak Score",
      description: fr
        ? "Calculez où votre revenu fuit entre le lead et le paiement."
        : "See where revenue leaks between lead and payment.",
    },
    services: {
      title: "Services",
      description: fr
        ? "Sites haute conversion, apps, agents IA et SEO — toujours branchés sur une seule provenance revenu."
        : "High-conversion sites, apps, AI agents and SEO — always wired to one revenue provenance.",
    },
    equipe: {
      title: fr ? "Équipe" : "Team",
      description: fr
        ? "Stratèges, builders et opérateurs derrière BlackWayConnect — focalisés sur le revenu encaissé."
        : "Strategists, builders and operators behind BlackWayConnect — focused on cash collected.",
    },
    "qui-sommes-nous": {
      title: fr ? "Qui nous sommes · Notre mission" : "Who we are · Our mission",
      ogTitle: fr
        ? "BlackWayConnect — du lead au revenu, sans fuite"
        : "BlackWayConnect — lead to revenue, no leakage",
      description: fr
        ? "Mission BlackWayConnect : système commercial bilingue lead-to-revenue — né au Québec, conçu pour le monde."
        : "BlackWayConnect mission: bilingual lead-to-revenue commercial system — born in Québec, built for the world.",
    },
    mission: {
      title: fr ? "Notre mission" : "Our mission",
      description: fr
        ? "Du lead au revenu, sans fuite — vision, valeurs et équipe BlackWayConnect."
        : "Lead to revenue, no leakage — BlackWayConnect vision, values and team.",
    },
    faq: {
      title: "FAQ",
      description: fr
        ? "Abonnement Paddle, service 24h, bureaux, leads, bilingue FR/EN et choix de forfait — réponses courtes."
        : "Paddle subscribe, 24/7 service, office, leads, bilingual FR/EN and plan choice — short answers.",
    },
    contact: {
      title: fr ? "Consultation stratégique" : "Strategic consultation",
      description: fr
        ? "Isolons vos trois fuites revenu les plus coûteuses — puis choisissons forfait ou mandat. Longueuil, QC."
        : "Isolate your three costliest revenue leaks — then pick plan or retainer. Longueuil, QC.",
    },
    merci: {
      title: fr ? "Client actif — prochaines étapes" : "Active client — next steps",
      description: fr
        ? "Paiement ou demande reçue. Checklist d’activation Grow Hub, CRM et contact."
        : "Payment or request received. Grow Hub activation checklist, CRM and contact.",
    },
    "thank-you": {
      title: fr ? "Active client — next steps" : "Active client — next steps",
      description: fr
        ? "Paiement ou demande reçue. Checklist d’activation Grow Hub, CRM et contact."
        : "Payment or request received. Grow Hub activation checklist, CRM and contact.",
    },
  };
  return (
    map[pageKey] || {
      title: "BlackWayConnect",
      description: fallbackBody,
    }
  );
}

function buildJsonLd(lang: "fr" | "en", canonical: string, pageKey: string) {
  const fr = lang === "fr";
  const orgId = `${SITE}/#organization`;
  const websiteId = `${SITE}/#website`;

  const organization = {
    "@type": "Organization",
    "@id": orgId,
    name: "BlackWayConnect",
    url: SITE,
    logo: OG_IMAGE,
    email: EMAILS.service,
    telephone: [PHONES.local.display, PHONES.tollFree.display],
    address: {
      "@type": "PostalAddress",
      streetAddress: OFFICE.street,
      addressLocality: "Longueuil",
      addressRegion: "QC",
      postalCode: "J4L 0B2",
      addressCountry: "CA",
    },
    areaServed: [
      { "@type": "AdministrativeArea", name: "Québec" },
      { "@type": "Country", name: "Canada" },
      { "@type": "Country", name: "United States" },
      { "@type": "Place", name: "Worldwide" },
    ],
    sameAs: [SOCIAL.facebook, SOCIAL.twitter, SOCIAL.instagram, SOCIAL.tiktok],
  };

  const website = {
    "@type": "WebSite",
    "@id": websiteId,
    url: SITE,
    name: "BlackWayConnect",
    inLanguage: ["fr-CA", "en-CA"],
    publisher: { "@id": orgId },
    description: fr
      ? "Plateforme lead-to-revenue bilingue — née au Québec, conçue pour le monde."
      : "Bilingual lead-to-revenue platform — born in Québec, built for the world.",
  };

  const graph: Record<string, unknown>[] = [organization, website];

  if (pageKey === "grow-hub" || pageKey === "forfaits" || pageKey === "outils") {
    graph.push({
      "@type": "SoftwareApplication",
      "@id": `${SITE}/grow-hub#app`,
      name: "Grow Hub",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${SITE}${lang === "en" ? "/en/grow-hub" : "/grow-hub"}`,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "CAD",
        lowPrice: "99",
        highPrice: "2499",
        offerCount: "6",
      },
      description: fr
        ? "Pipeline bilingue lead-to-revenue : relances, soumissions, paiements et CRM."
        : "Bilingual lead-to-revenue pipeline: follow-ups, quotes, payments and CRM.",
      publisher: { "@id": orgId },
      inLanguage: lang === "fr" ? "fr-CA" : "en-CA",
    });
  }

  if (pageKey === "diagnostic" || pageKey === "score") {
    graph.push({
      "@type": "WebApplication",
      "@id": `${SITE}/diagnostic#leak-score`,
      name: "Revenue Leak Score",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: canonical,
      description: fr
        ? "Diagnostic 60 secondes des fuites revenu entre le lead et le paiement."
        : "60-second diagnostic of revenue leaks between lead and payment.",
      publisher: { "@id": orgId },
      inLanguage: lang === "fr" ? "fr-CA" : "en-CA",
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

/** Route-aware FR/EN SEO: title, description, canonical, hreflang, OG/Twitter, JSON-LD. */
export function Seo() {
  const { lang, t } = useLang();
  const { pathname } = useLocation();

  useEffect(() => {
    const bare = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
    const frPath = bare === "/" ? "/" : bare;
    const enPath = bare === "/" ? "/en" : `/en${bare}`;
    const canonical = `${SITE}${lang === "en" ? enPath : frPath}`;

    const pageKey = bare.replace(/^\//, "") || "home";
    const isAvenirChatbot =
      bare === "/vorixa/chatbot" ||
      bare.startsWith("/vorixa/chatbot/") ||
      bare === "/maquettes/l-avenir";
    const isMaquette = bare === "/maquettes" || bare.startsWith("/maquettes/");
    const isVorixaDemo = isAvenirChatbot || isMaquette;
    const { title: pageTitle, description, ogTitle } = pageSeo(pageKey, lang, t.heroBody);

    if (isAvenirChatbot) {
      document.title = "VORIXA | Assistant L'Avenir Clinique Dentaire";
      upsertMeta(
        "name",
        "description",
        "Configuration VorixaChatbot — Assistant L'Avenir Clinique Dentaire, capture de leads.",
      );
      upsertMeta("name", "robots", "noindex, nofollow");
    } else if (isMaquette) {
      document.title = "VORIXA | Maquette de prospection";
      upsertMeta(
        "name",
        "description",
        "Proposition de démonstration commerciale Vorixa — pas un livrable déjà construit ni une promesse de résultats.",
      );
      upsertMeta("name", "robots", "noindex, nofollow");
    } else if (pageKey === "confidentialite") {
      document.title = `${t.brand} | ${t.privacy}`;
      upsertMeta("name", "description", t.privacyBody.slice(0, 160));
      upsertMeta("name", "robots", "index, follow");
    } else if (pageKey === "conditions") {
      document.title = `${t.brand} | ${t.terms}`;
      upsertMeta("name", "description", t.termsBody.slice(0, 160));
      upsertMeta("name", "robots", "index, follow");
    } else if (pageKey === "remboursement" || pageKey === "refund") {
      document.title = `${t.brand} | ${t.refund}`;
      upsertMeta("name", "description", t.refundBody.slice(0, 160));
      upsertMeta("name", "robots", "index, follow");
    } else {
      document.title = `${t.brand} | ${pageTitle}`;
      upsertMeta("name", "description", description);
      upsertMeta("name", "robots", "index, follow");
    }

    const resolvedOgTitle = isVorixaDemo
      ? document.title
      : pageKey === "confidentialite" ||
          pageKey === "conditions" ||
          pageKey === "remboursement" ||
          pageKey === "refund"
        ? document.title
        : ogTitle || document.title;
    const ogDesc = isAvenirChatbot
      ? "Configuration VorixaChatbot — Assistant L'Avenir Clinique Dentaire, capture de leads."
      : isMaquette
      ? "Proposition de démonstration commerciale Vorixa — pas un livrable déjà construit ni une promesse de résultats."
      : pageKey === "confidentialite"
        ? t.privacyBody.slice(0, 160)
        : pageKey === "conditions"
          ? t.termsBody.slice(0, 160)
          : pageKey === "remboursement" || pageKey === "refund"
            ? t.refundBody.slice(0, 160)
            : description;

    document.documentElement.lang = lang === "en" ? "en" : "fr";

    upsertMeta("property", "og:site_name", isVorixaDemo ? "VORIXA" : "BlackWayConnect");
    upsertMeta("property", "og:title", resolvedOgTitle);
    upsertMeta("property", "og:description", ogDesc);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:locale", lang === "fr" ? "fr_CA" : "en_CA");
    upsertMeta("property", "og:locale:alternate", lang === "fr" ? "en_CA" : "fr_CA");
    upsertMeta("property", "og:image", OG_IMAGE);
    upsertMeta("property", "og:image:secure_url", OG_IMAGE);
    upsertMeta("property", "og:image:type", "image/png");
    upsertMeta("property", "og:image:width", OG_W);
    upsertMeta("property", "og:image:height", OG_H);
    upsertMeta(
      "property",
      "og:image:alt",
      lang === "fr"
        ? "BlackWayConnect — plateforme lead-to-revenue"
        : "BlackWayConnect — lead-to-revenue platform",
    );

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", resolvedOgTitle);
    upsertMeta("name", "twitter:description", ogDesc);
    upsertMeta("name", "twitter:image", OG_IMAGE);
    upsertMeta(
      "name",
      "twitter:image:alt",
      lang === "fr"
        ? "BlackWayConnect — plateforme lead-to-revenue"
        : "BlackWayConnect — lead-to-revenue platform",
    );

    upsertLink("canonical", canonical);
    upsertLink("alternate", `${SITE}${frPath}`, "fr");
    upsertLink("alternate", `${SITE}${enPath}`, "en");
    upsertLink("alternate", `${SITE}/`, "x-default");

    if (isVorixaDemo) {
      const el = document.getElementById("bw-jsonld");
      if (el) el.textContent = "";
    } else {
      upsertJsonLd("bw-jsonld", buildJsonLd(lang, canonical, pageKey));
    }
  }, [lang, pathname, t]);

  return null;
}
