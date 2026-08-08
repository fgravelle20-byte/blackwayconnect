import { handleChat, type ChatLang, type ChatMessage } from "./chat";
import { injectSeoHtml, shouldInjectHtml } from "./seoInject";

export interface Env {
  ASSETS: Fetcher;
  PIPE_URL: string;
  BW_LEAD_KEY: string;
  /** Optional Base44 Admin/SDK key — server-side only */
  BW_BASE44_API_KEY?: string;
  /** Public preview / production app URL (no secret) */
  APP_WEB_URL?: string;
  APP_STORE_URL?: string;
  PLAY_STORE_URL?: string;
  /** Workers AI binding */
  AI?: Ai;
  /** Optional OpenAI fallback secret */
  OPENAI_API_KEY?: string;
}

const SITE_ORIGIN = "https://blackwayconnect.com";
/** Mobile dashboard = Portail (included with Grow Hub). Not Pack Cellulaire. */
const DEFAULT_APP = "https://blackwayconnect.com/portail";
const BASE44_PREVIEW = "https://black-way-link.base44.app/";

const CHECKOUT = {
  grow_hub_spark: "https://buy.stripe.com/00w14m2HH4wX57M2d0eIw0w",
  grow_hub_launch: "https://buy.stripe.com/aFaaEWeqpd3t57M6tgeIw0z",
  grow_hub_growth: "https://buy.stripe.com/28E8wO8218NdfMq5pceIw0x",
  grow_hub_scale: "https://buy.stripe.com/3cI5kC0zz5B143IbNAeIw0B",
  grow_hub_command: "https://buy.stripe.com/fZucN4eqp7J97fU18WeIw0y",
  grow_hub_partner: "https://buy.stripe.com/6oUaEW9655B11VA4l8eIw0A",
  currency: "cad" as const,
};

const PLAN_AMOUNTS: Record<string, number> = {
  grow_hub_spark: 99,
  grow_hub_launch: 249,
  grow_hub_growth: 499,
  grow_hub_scale: 749,
  grow_hub_command: 1249,
  grow_hub_partner: 2499,
};

/** Type B — cellulaire (Payment Links empty until Stripe created). */
const CELLULAIRE_AMOUNTS: Record<string, number> = {
  cell_signal: 79,
  cell_route: 199,
  cell_fleet: 399,
  cell_command: 799,
};

const CELLULAIRE_CHECKOUT: Record<string, string> = {
  cell_signal: "",
  cell_route: "",
  cell_fleet: "",
  cell_command: "",
};

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === SITE_ORIGIN) return true;
  try {
    const u = new URL(origin);
    return u.protocol === "https:" && (u.hostname === "base44.app" || u.hostname.endsWith(".base44.app"));
  } catch {
    return false;
  }
}

function corsHeaders(request: Request, extraAllowHeaders = ""): Record<string, string> {
  const origin = request.headers.get("Origin");
  const allowOrigin = isAllowedOrigin(origin) ? (origin as string) : SITE_ORIGIN;
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": `Content-Type, X-BW-Key, X-BW-Base44-Key, Authorization${extraAllowHeaders}`,
    Vary: "Origin",
  };
  if (allowOrigin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

function corsJson(request: Request, data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: corsHeaders(request) });
}

function corsEmpty(request: Request, status = 204): Response {
  return new Response(null, { status, headers: corsHeaders(request) });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function authorizeMobileLead(request: Request, env: Env): boolean {
  const leadKey = request.headers.get("X-BW-Key") || "";
  const base44Key = request.headers.get("X-BW-Base44-Key") || "";
  if (env.BW_LEAD_KEY && timingSafeEqual(leadKey, env.BW_LEAD_KEY)) return true;
  if (env.BW_BASE44_API_KEY && timingSafeEqual(base44Key, env.BW_BASE44_API_KEY)) return true;
  return false;
}

function mobileBootstrap(env: Env) {
  return {
    ok: true,
    service: "blackway-site",
    brand: "BlackWayConnect",
    currency: "cad",
    app: {
      /** Real product surface for clients = Portail Master */
      web: env.APP_WEB_URL || DEFAULT_APP,
      /** Base44 wrapper preview (may still be a shell until Builder republish) */
      base44: BASE44_PREVIEW,
      appStore: env.APP_STORE_URL || "",
      playStore: env.PLAY_STORE_URL || "",
      status: "published",
      appId: "6a65880b394194e76123d165",
    },
    site: {
      home: SITE_ORIGIN,
      tools: `${SITE_ORIGIN}/outils`,
      diagnostic: `${SITE_ORIGIN}/diagnostic`,
      compare: `${SITE_ORIGIN}/comparer`,
      pricing: `${SITE_ORIGIN}/forfaits`,
      pricingCellulaire: `${SITE_ORIGIN}/forfaits-cellulaire`,
      contact: `${SITE_ORIGIN}/contact`,
      privacy: `${SITE_ORIGIN}/confidentialite`,
      thankYou: `${SITE_ORIGIN}/portail`,
      portal: `${SITE_ORIGIN}/portail`,
      growHub: `${SITE_ORIGIN}/grow-hub`,
      relancePanier: `${SITE_ORIGIN}/outils/relance-panier`,
      soumission: `${SITE_ORIGIN}/outils/soumission`,
      checklist: `${SITE_ORIGIN}/outils/checklist`,
      roi: `${SITE_ORIGIN}/outils#roi`,
    },
    checkout: CHECKOUT,
    checkoutCellulaire: CELLULAIRE_CHECKOUT,
    /** Type A — Grow Hub web. App dashboard = portal (included); app paid grid = Type B only. */
    plans: [
      {
        key: "grow_hub_spark",
        name: "Spark",
        amountCad: PLAN_AMOUNTS.grow_hub_spark,
        paymentLink: CHECKOUT.grow_hub_spark,
        line: "web",
      },
      {
        key: "grow_hub_launch",
        name: "Launch",
        amountCad: PLAN_AMOUNTS.grow_hub_launch,
        paymentLink: CHECKOUT.grow_hub_launch,
        line: "web",
      },
      {
        key: "grow_hub_growth",
        name: "Growth",
        amountCad: PLAN_AMOUNTS.grow_hub_growth,
        paymentLink: CHECKOUT.grow_hub_growth,
        featured: true,
        line: "web",
      },
      {
        key: "grow_hub_scale",
        name: "Scale",
        amountCad: PLAN_AMOUNTS.grow_hub_scale,
        paymentLink: CHECKOUT.grow_hub_scale,
        line: "web",
      },
      {
        key: "grow_hub_command",
        name: "Command",
        amountCad: PLAN_AMOUNTS.grow_hub_command,
        paymentLink: CHECKOUT.grow_hub_command,
        line: "web",
      },
      {
        key: "grow_hub_partner",
        name: "Partner",
        amountCad: PLAN_AMOUNTS.grow_hub_partner,
        paymentLink: CHECKOUT.grow_hub_partner,
        line: "web",
      },
    ],
    /** Type B — Pack Cellulaire optional (revenue #2). Not the included mobile dashboard. */
    plansCellulaire: [
      {
        key: "cell_signal",
        name: "Cell Signal",
        amountCad: CELLULAIRE_AMOUNTS.cell_signal,
        paymentLink: CELLULAIRE_CHECKOUT.cell_signal || null,
        line: "cellulaire",
        tools: ["cell_capture"],
      },
      {
        key: "cell_route",
        name: "Cell Route",
        amountCad: CELLULAIRE_AMOUNTS.cell_route,
        paymentLink: CELLULAIRE_CHECKOUT.cell_route || null,
        line: "cellulaire",
        tools: ["cell_capture", "cell_pipeline", "cell_checkout"],
      },
      {
        key: "cell_fleet",
        name: "Cell Fleet",
        amountCad: CELLULAIRE_AMOUNTS.cell_fleet,
        paymentLink: CELLULAIRE_CHECKOUT.cell_fleet || null,
        featured: true,
        line: "cellulaire",
        tools: ["cell_capture", "cell_pipeline", "cell_checkout", "cell_streak", "cell_fleet_ops"],
      },
      {
        key: "cell_command",
        name: "Cell Command",
        amountCad: CELLULAIRE_AMOUNTS.cell_command,
        paymentLink: CELLULAIRE_CHECKOUT.cell_command || null,
        line: "cellulaire",
        tools: [
          "cell_capture",
          "cell_pipeline",
          "cell_checkout",
          "cell_streak",
          "cell_fleet_ops",
          "cell_merge",
        ],
      },
    ],
    model: {
      revenue1: "grow_hub_web",
      includedSurplus: "mobile_dashboard_portal",
      revenue2Optional: "pack_cellulaire_field_tools",
      pitch: "Control your dashboard wherever you are — mobile access included with Grow Hub.",
    },
    provenance: {
      source: "app_mobile",
      bw_source: "mobile_dashboard",
      checkoutSource: "cellulaire",
      webCheckoutSource: "site_web",
      stripeWebhook: `${env.PIPE_URL}/webhooks/stripe`,
    },
    qr: {
      app: `${SITE_ORIGIN}/qr-app.svg`,
      site: `${SITE_ORIGIN}/qr-site.svg`,
      outils: `${SITE_ORIGIN}/qr-outils.svg`,
      /** Mobile dashboard = Portail (included surplus), not cellulaire storefront. */
      appUrl: `${SITE_ORIGIN}/portail?utm_source=blackwayconnect_site&utm_medium=referral&utm_campaign=mobile_dashboard&utm_content=site_footer_qr&bw_ref=site_footer_qr&bw_source=mobile_dashboard`,
      cellulaireUrl: `${SITE_ORIGIN}/forfaits-cellulaire?utm_source=blackwayconnect_site&utm_medium=referral&utm_campaign=pack_cellulaire&bw_source=cellulaire`,
      base44Url: BASE44_PREVIEW,
      siteUrl: SITE_ORIGIN,
      outilsUrl: `${SITE_ORIGIN}/outils`,
      portalUrl: `${SITE_ORIGIN}/portail`,
    },
    support: {
      email: "serviceclient@blackwayconnect.com",
      phoneLocal: "tel:+14502316911",
      phoneTollFree: "tel:+18888539080",
    },
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Force canonical host (www → apex) if somehow hit on www via this worker
    if (url.hostname === "www.blackwayconnect.com") {
      url.hostname = "blackwayconnect.com";
      return Response.redirect(url.toString(), 301);
    }

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return corsEmpty(request);
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      // Booleans only — never leak secrets or key material.
      return corsJson(request, {
        service: "blackway-site",
        ok: true,
        pipe: !!env.PIPE_URL,
        lead_key: !!env.BW_LEAD_KEY,
        base44_key: !!env.BW_BASE44_API_KEY,
        ai: !!env.AI,
        chat: true,
        leadProxy: true,
        mobile: true,
      });
    }

    if (url.pathname === "/api/mobile/bootstrap" && request.method === "GET") {
      return corsJson(request, mobileBootstrap(env));
    }

    if (url.pathname === "/api/mobile/lead") {
      if (request.method !== "POST") {
        return corsJson(request, { erreur: "methode non autorisee" }, 405);
      }
      if (!authorizeMobileLead(request, env)) {
        return corsJson(request, { erreur: "non autorise" }, 401);
      }
      try {
        const raw = await request.json().catch(() => null);
        if (!raw || typeof raw !== "object") {
          return corsJson(request, { erreur: "json invalide" }, 400);
        }
        const incoming = raw as Record<string, unknown>;
        const email = String(incoming.email || "").trim();
        if (!email || !email.includes("@")) {
          return corsJson(request, { erreur: "email requis" }, 400);
        }
        const body = {
          ...incoming,
          email,
          prenom: String(incoming.prenom || incoming.firstName || "").trim(),
          nom: String(incoming.nom || incoming.lastName || "").trim(),
          entreprise: String(incoming.entreprise || incoming.company || "").trim(),
          telephone: String(incoming.telephone || incoming.phone || "").trim(),
          message: String(incoming.message || "").trim(),
          forfait: String(incoming.forfait || "grow_hub_growth").trim(),
          source: "app_mobile",
          urgence: String(incoming.urgence || "normal").trim(),
          langue: String(incoming.langue || incoming.lang || "fr").trim(),
          bw_source: "mobile_app",
          bw_ref: String(incoming.bw_ref || "base44_app").trim(),
        };
        const upstream = await fetch(`${env.PIPE_URL}/lead`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-BW-Key": env.BW_LEAD_KEY || "",
          },
          body: JSON.stringify(body),
        });
        const text = await upstream.text();
        return new Response(text, {
          status: upstream.status,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        return corsJson(request, { erreur: "proxy indisponible", detail: String(e) }, 502);
      }
    }

    if (url.pathname === "/api/config" && request.method === "GET") {
      return corsJson(request, {
        pipe: env.PIPE_URL,
        leadProxy: "/api/lead",
        chat: "/api/chat",
        health: "/api/health",
        mobileBootstrap: "/api/mobile/bootstrap",
        mobileLead: "/api/mobile/lead",
        thankYou: "/portail",
        portal: "/portail",
        portalClaim: "/api/portal/claim",
        portalMe: "/api/portal/me",
        stripeWebhook: `${env.PIPE_URL}/webhooks/stripe`,
        checkout: CHECKOUT,
        tools: "/outils",
        agent: {
          id: "ai_secretary_24h",
          name: "BlackWay AI Secretary",
          available: "24/7",
        },
        app: {
          web: env.APP_WEB_URL || DEFAULT_APP,
          appStore: env.APP_STORE_URL || "",
          playStore: env.PLAY_STORE_URL || "",
          status: "published",
          appId: "6a65880b394194e76123d165",
          leadSource: "app_mobile",
        },
        provenance: {
          siteSource: "form_web",
          appSource: "app_mobile",
          checkoutSource: "site_web",
          agentSource: "campagne",
          utmRequired: ["utm_source", "utm_medium", "utm_campaign", "bw_ref", "bw_source"],
        },
      });
    }

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return corsJson(request, { erreur: "methode non autorisee" }, 405);
      }
      try {
        const raw = await request.json().catch(() => null);
        if (!raw || typeof raw !== "object") {
          return corsJson(request, { erreur: "json invalide" }, 400);
        }
        const body = raw as {
          messages?: ChatMessage[];
          lang?: ChatLang;
          message?: string;
        };
        let messages = Array.isArray(body.messages) ? body.messages : [];
        if (!messages.length && typeof body.message === "string") {
          messages = [{ role: "user", content: body.message }];
        }
        if (!messages.length) {
          return corsJson(request, { erreur: "messages requis" }, 400);
        }
        const lang: ChatLang = body.lang === "en" ? "en" : "fr";
        const result = await handleChat({
          messages,
          lang,
          ai: env.AI,
          openaiKey: env.OPENAI_API_KEY,
        });
        return corsJson(request, {
          reply: result.reply,
          actions: result.actions,
          engine: result.engine,
          available: "24/7",
          ...(result.aiError ? { aiError: result.aiError } : {}),
        });
      } catch (e) {
        return corsJson(request, { erreur: "chat indisponible", detail: String(e) }, 502);
      }
    }

    if (url.pathname === "/api/lead") {
      if (request.method !== "POST") {
        return corsJson(request, { erreur: "methode non autorisee" }, 405);
      }
      try {
        const raw = await request.json().catch(() => null);
        if (!raw || typeof raw !== "object") {
          return corsJson(request, { erreur: "json invalide" }, 400);
        }
        const body = {
          ...(raw as Record<string, unknown>),
          source: (raw as { source?: string }).source || "form_web",
          bw_ref: (raw as { bw_ref?: string }).bw_ref || "site",
        };
        const upstream = await fetch(`${env.PIPE_URL}/lead`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-BW-Key": env.BW_LEAD_KEY || "",
          },
          body: JSON.stringify(body),
        });
        const text = await upstream.text();
        return new Response(text, {
          status: upstream.status,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        return corsJson(request, { erreur: "proxy indisponible", detail: String(e) }, 502);
      }
    }

    if (url.pathname === "/api/portal/claim") {
      if (request.method !== "POST") {
        return corsJson(request, { erreur: "methode non autorisee" }, 405);
      }
      try {
        const raw = await request.json().catch(() => null);
        if (!raw || typeof raw !== "object") {
          return corsJson(request, { erreur: "json invalide" }, 400);
        }
        const upstream = await fetch(`${env.PIPE_URL}/portal/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(raw),
        });
        const text = await upstream.text();
        return new Response(text, {
          status: upstream.status,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        return corsJson(request, { erreur: "portail indisponible", detail: String(e) }, 502);
      }
    }

    if (url.pathname === "/api/portal/me") {
      if (request.method !== "GET") {
        return corsJson(request, { erreur: "methode non autorisee" }, 405);
      }
      try {
        const auth = request.headers.get("Authorization") || "";
        const upstream = await fetch(`${env.PIPE_URL}/portal/me`, {
          method: "GET",
          headers: { Authorization: auth },
        });
        const text = await upstream.text();
        return new Response(text, {
          status: upstream.status,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        return corsJson(request, { erreur: "portail indisponible", detail: String(e) }, 502);
      }
    }

    const assetRes = await env.ASSETS.fetch(request);
    const contentType = assetRes.headers.get("content-type") || "";
    if (
      shouldInjectHtml(request, url.pathname) &&
      contentType.includes("text/html") &&
      request.method === "GET"
    ) {
      const html = await assetRes.text();
      const injected = injectSeoHtml(html, url.pathname);
      const headers = new Headers(assetRes.headers);
      headers.delete("content-length");
      headers.set("cache-control", "public, max-age=0, must-revalidate");
      return new Response(injected, {
        status: assetRes.status,
        statusText: assetRes.statusText,
        headers,
      });
    }
    return assetRes;
  },
};
