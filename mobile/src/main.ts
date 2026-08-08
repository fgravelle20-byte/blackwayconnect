import "./styles.css";
import {
  TOOLS,
  SUPPORT,
  URLS,
  withTrack,
  type TabId,
} from "./config";
import { initNativeChrome, openExternal, openSystem } from "./native";

type Lang = "fr" | "en";

const copy = {
  fr: {
    brand: "BlackWay",
    brandAccent: "Connect",
    headline: "Contrôle ton dashboard. Partout.",
    sub: "Même Portail Client Master que le site — forfait, outils, support.",
    openPortal: "Ouvrir mon Portail",
    openTools: "Outils",
    openPlans: "Forfaits Grow Hub",
    plansNote: "Checkout Stripe s’ouvre dans Safari / Chrome (règles Apple).",
    trust1: "Stripe → HubSpot",
    trust2: "Bilingue FR/EN",
    trust3: "Québec · Canada · US",
    portalTitle: "Portail Client Master",
    portalBody: "Entre avec le courriel du compte qui a payé Grow Hub.",
    emailLabel: "Courriel du compte payeur",
    emailPlaceholder: "toi@entreprise.com",
    openDash: "Ouvrir mon dashboard",
    openNoEmail: "Ouvrir sans courriel",
    portalHint: "Dashboard mobile inclus avec Grow Hub.",
    toolsTitle: "Outils",
    toolsBody: "Liens réels vers le site — pas de coquille vide.",
    contactTitle: "Contact",
    contactBody: "Support humain BlackWay Connect.",
    callLocal: "Appeler (local)",
    callToll: "Appeler (sans frais)",
    email: "Écrire au support",
    contactPage: "Page contact",
    privacy: "Confidentialité",
    navHome: "Accueil",
    navPortal: "Portail",
    navTools: "Outils",
    navPlans: "Forfaits",
    navContact: "Contact",
    webviewLabel: "Portail live",
    reload: "Recharger",
  },
  en: {
    brand: "BlackWay",
    brandAccent: "Connect",
    headline: "Control your dashboard. Anywhere.",
    sub: "Same Client Master Portal as the site — plan, tools, support.",
    openPortal: "Open my Portal",
    openTools: "Tools",
    openPlans: "Grow Hub plans",
    plansNote: "Stripe checkout opens in Safari / Chrome (Apple rules).",
    trust1: "Stripe → HubSpot",
    trust2: "Bilingual FR/EN",
    trust3: "Quebec · Canada · US",
    portalTitle: "Client Master Portal",
    portalBody: "Sign in with the email of the account that paid for Grow Hub.",
    emailLabel: "Payer account email",
    emailPlaceholder: "you@company.com",
    openDash: "Open my dashboard",
    openNoEmail: "Open without email",
    portalHint: "Mobile dashboard included with Grow Hub.",
    toolsTitle: "Tools",
    toolsBody: "Real site deep links — no empty shell.",
    contactTitle: "Contact",
    contactBody: "Human support at BlackWay Connect.",
    callLocal: "Call (local)",
    callToll: "Call (toll-free)",
    email: "Email support",
    contactPage: "Contact page",
    privacy: "Privacy",
    navHome: "Home",
    navPortal: "Portal",
    navTools: "Tools",
    navPlans: "Plans",
    navContact: "Contact",
    webviewLabel: "Live portal",
    reload: "Reload",
  },
} as const;

const ICONS = {
  home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"/></svg>`,
  portail: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13h5"/></svg>`,
  outils: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5 2.5-2.5z"/></svg>`,
  forfaits: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v12H4z"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/></svg>`,
  contact: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v2a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h2a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.1 9.5a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6A2 2 0 0 1 22 16.9z"/></svg>`,
};

let lang: Lang = (localStorage.getItem("bw_lang") as Lang) || "fr";
let tab: TabId = "home";
let portalLoaded = false;

function t() {
  return copy[lang];
}

function portalUrl(email?: string): string {
  if (email?.trim()) {
    return withTrack("/portail", {
      email: email.trim(),
      utm_campaign: "portal_claim",
    });
  }
  return URLS.portal;
}

function setTab(next: TabId) {
  tab = next;
  document.querySelectorAll<HTMLElement>("[data-panel]").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.panel === next);
  });
  document.querySelectorAll<HTMLButtonElement>("[data-nav]").forEach((el) => {
    el.classList.toggle("is-on", el.dataset.nav === next);
  });
  if (next === "portail") {
    ensurePortalFrame(portalUrl());
  }
}

function ensurePortalFrame(url: string) {
  const frame = document.getElementById("portal-frame") as HTMLIFrameElement | null;
  const loader = document.getElementById("portal-loader");
  if (!frame) return;
  loader?.classList.add("is-on");
  if (!portalLoaded || frame.src !== url) {
    frame.src = url;
    portalLoaded = true;
  }
  frame.onload = () => loader?.classList.remove("is-on");
}

async function onForfaits() {
  await openExternal(URLS.forfaits);
}

function render(): void {
  const c = t();
  const root = document.getElementById("app");
  if (!root) return;

  root.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <img src="/logo.png" alt="" width="34" height="34" />
        <div class="brand">${c.brand} <span>${c.brandAccent}</span></div>
      </header>
      <main class="content">
        <section class="panel ${tab === "home" ? "is-active" : ""}" data-panel="home">
          <div class="hero">
            <p class="hero-brand">${c.brand}<span>${c.brandAccent}</span></p>
            <h1>${c.headline}</h1>
            <p>${c.sub}</p>
            <div class="cta-stack">
              <button class="btn btn--primary" type="button" data-action="open-portal">${c.openPortal}</button>
              <button class="btn btn--soft" type="button" data-action="open-tools">${c.openTools}</button>
              <button class="btn btn--ghost" type="button" data-action="open-plans">${c.openPlans}</button>
            </div>
            <p class="note">${c.plansNote}</p>
            <div class="trust">
              <span>${c.trust1}</span>
              <span>${c.trust2}</span>
              <span>${c.trust3}</span>
            </div>
          </div>
        </section>

        <section class="panel panel--webview ${tab === "portail" ? "is-active" : ""}" data-panel="portail">
          <div class="loading-line" id="portal-loader"></div>
          <div class="webview-bar">
            <span>${c.webviewLabel}</span>
            <div style="display:flex;gap:.4rem">
              <button type="button" data-action="portal-reload">${c.reload}</button>
              <button type="button" data-action="portal-external">Safari</button>
            </div>
          </div>
          <div class="section" style="padding-bottom:.5rem">
            <h2>${c.portalTitle}</h2>
            <p>${c.portalBody}</p>
            <form class="portal-form" id="portal-form">
              <label for="portal-email">${c.emailLabel}</label>
              <input id="portal-email" name="email" type="email" autocomplete="email" placeholder="${c.emailPlaceholder}" />
              <button class="btn btn--primary" type="submit">${c.openDash}</button>
              <button class="btn btn--ghost" type="button" data-action="portal-blank">${c.openNoEmail}</button>
            </form>
            <p class="note">${c.portalHint}</p>
          </div>
          <iframe
            id="portal-frame"
            class="webview-frame"
            title="Portail Client Master"
            referrerpolicy="no-referrer-when-downgrade"
            allow="clipboard-read; clipboard-write"
          ></iframe>
        </section>

        <section class="panel ${tab === "outils" ? "is-active" : ""}" data-panel="outils">
          <div class="section">
            <h2>${c.toolsTitle}</h2>
            <p>${c.toolsBody}</p>
            <div class="tools-grid" id="tools-grid">
              ${TOOLS.map(
                (tool) => `
                <button class="tool-tile" type="button" data-tool="${tool.id}">
                  ${lang === "fr" ? tool.labelFr : tool.labelEn}
                </button>`,
              ).join("")}
            </div>
            <p class="note" style="margin-top:1rem">${c.plansNote}</p>
            <button class="btn btn--ghost" type="button" data-action="open-plans" style="width:100%;margin-top:.5rem">${c.openPlans}</button>
          </div>
        </section>

        <section class="panel ${tab === "contact" ? "is-active" : ""}" data-panel="contact">
          <div class="section">
            <h2>${c.contactTitle}</h2>
            <p>${c.contactBody}</p>
            <div class="contact-list">
              <a class="contact-card" href="${SUPPORT.telLocal}" data-system="${SUPPORT.telLocal}">
                <strong>${c.callLocal}</strong>
                <span>${SUPPORT.phoneLocal}</span>
              </a>
              <a class="contact-card" href="${SUPPORT.telTollFree}" data-system="${SUPPORT.telTollFree}">
                <strong>${c.callToll}</strong>
                <span>${SUPPORT.phoneTollFree}</span>
              </a>
              <a class="contact-card" href="${SUPPORT.mailto}" data-system="${SUPPORT.mailto}">
                <strong>${c.email}</strong>
                <span>${SUPPORT.email}</span>
              </a>
              <button class="contact-card" type="button" data-action="open-contact-page">
                <strong>${c.contactPage}</strong>
                <span>blackwayconnect.com/contact</span>
              </button>
              <button class="contact-card" type="button" data-action="open-privacy">
                <strong>${c.privacy}</strong>
                <span>blackwayconnect.com/confidentialite</span>
              </button>
            </div>
            <div class="lang-row">
              <button type="button" data-lang="fr" class="${lang === "fr" ? "is-on" : ""}">FR</button>
              <button type="button" data-lang="en" class="${lang === "en" ? "is-on" : ""}">EN</button>
            </div>
            <p class="note">BlackWay Connect · com.blackwayconnect.app · v1.0.0</p>
          </div>
        </section>
      </main>

      <nav class="nav" aria-label="Main">
        <button type="button" data-nav="home" class="${tab === "home" ? "is-on" : ""}">${ICONS.home}<span>${c.navHome}</span></button>
        <button type="button" data-nav="portail" class="${tab === "portail" ? "is-on" : ""}">${ICONS.portail}<span>${c.navPortal}</span></button>
        <button type="button" data-nav="outils" class="${tab === "outils" ? "is-on" : ""}">${ICONS.outils}<span>${c.navTools}</span></button>
        <button type="button" data-nav="forfaits" class="nav-external">${ICONS.forfaits}<span>${c.navPlans}</span></button>
        <button type="button" data-nav="contact" class="${tab === "contact" ? "is-on" : ""}">${ICONS.contact}<span>${c.navContact}</span></button>
      </nav>
    </div>
  `;

  bind();
}

function bind(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.nav;
      if (id === "forfaits") {
        void onForfaits();
        return;
      }
      if (id === "home" || id === "portail" || id === "outils" || id === "contact") {
        setTab(id);
      }
    });
  });

  document.querySelectorAll<HTMLElement>("[data-action]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const action = (e.currentTarget as HTMLElement).dataset.action;
      if (action === "open-portal") setTab("portail");
      if (action === "open-tools") setTab("outils");
      if (action === "open-plans") void onForfaits();
      if (action === "portal-blank") ensurePortalFrame(portalUrl());
      if (action === "portal-reload") {
        const frame = document.getElementById("portal-frame") as HTMLIFrameElement | null;
        if (frame?.src) {
          portalLoaded = false;
          ensurePortalFrame(frame.src);
        }
      }
      if (action === "portal-external") void openExternal(portalUrl());
      if (action === "open-contact-page") void openExternal(URLS.contact);
      if (action === "open-privacy") void openExternal(URLS.privacy);
    });
  });

  const form = document.getElementById("portal-form") as HTMLFormElement | null;
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = (document.getElementById("portal-email") as HTMLInputElement | null)?.value;
    ensurePortalFrame(portalUrl(email));
  });

  document.querySelectorAll<HTMLButtonElement>("[data-tool]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tool = TOOLS.find((x) => x.id === btn.dataset.tool);
      if (tool) void openExternal(tool.url);
    });
  });

  document.querySelectorAll<HTMLElement>("[data-system]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const url = (e.currentTarget as HTMLElement).dataset.system;
      if (!url) return;
      e.preventDefault();
      void openSystem(url);
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.lang as Lang;
      lang = next;
      localStorage.setItem("bw_lang", next);
      render();
    });
  });
}

async function boot() {
  await initNativeChrome();
  render();
  // Warm bootstrap (URLs already hardcoded from live API; refresh if needed later)
  try {
    await fetch(URLS.bootstrap, { method: "GET" });
  } catch {
    /* offline ok — hardcoded URLs still work */
  }
}

boot();
