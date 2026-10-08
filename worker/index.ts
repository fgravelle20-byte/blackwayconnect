import { CELLULAIRE_PLANS, cellulaireCheckoutUrl } from "../src/cellulaireConfig";
import { isPaddlePlanKey, type PaddlePlanKey } from "../src/paddleCatalog";
import { CHECKOUT_LINKS, PLANS, paymentLinkToForfait } from "../src/stripeConfig";
import { handleChat, type ChatLang, type ChatMessage } from "./chat";
import { injectSeoHtml, shouldInjectHtml } from "./seoInject";
import { authorizeOwner } from "./ownerAuth";
import { crmAuthorized, crmCookieHeader, crmLoginOk, getEngine, listCrm, patchCrm, recordSiteLead, tickCrm } from "./crm";

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
  /** Cloudflare AI Gateway id (Dash → AI → AI Gateway) */
  AI_GATEWAY_ID?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  BW_OWNER_EMAIL?: string;
}

const SITE_ORIGIN = "https://blackwayconnect.com";
/** Mobile dashboard = Portail (included with Grow Hub). Not Pack Cellulaire. */
const DEFAULT_APP = "https://blackwayconnect.com/portail";
const BASE44_PREVIEW = "https://black-way-link.base44.app/";

/** Live checkout — Paddle /payer only for paid plans. Stripe-hosted checkout is retired. */
const CHECKOUT = CHECKOUT_LINKS;

const LEGACY_BUY_PATHS = new Set([
  "/paddle",
  "/acheter",
  "/checkout",
  "/encaisser",
  "/stripe",
  "/paiement-stripe",
  "/payment",
  "/pay",
  "/payment-link",
  "/checkout-stripe",
  "/stripe-checkout",
  "/subscribe",
  "/abonnement",
]);

const LEGACY_STRIPE_PLINK_TO_PLAN = paymentLinkToForfait();
const LEGACY_STRIPE_PRICE_TO_PLAN = Object.fromEntries(
  Object.values(PLANS).map((plan) => [plan.priceId, plan.key]),
) as Record<string, PaddlePlanKey>;
const LEGACY_STRIPE_PRODUCT_TO_PLAN = Object.fromEntries(
  Object.values(PLANS).map((plan) => [plan.productId, plan.key]),
) as Record<string, PaddlePlanKey>;

const LEGACY_PLAN_ALIASES: Record<string, PaddlePlanKey> = {
  spark: "grow_hub_spark",
  launch: "grow_hub_launch",
  growth: "grow_hub_growth",
  scale: "grow_hub_scale",
  automation: "grow_hub_scale",
  command: "grow_hub_command",
  partner: "grow_hub_partner",
  signal: "cell_signal",
  route: "cell_route",
  fleet: "cell_fleet",
};

function resolveLegacyCheckoutPlan(url: URL): PaddlePlanKey | null {
  for (const key of ["plan", "forfait", "bw_forfait", "tier"]) {
    const raw = String(url.searchParams.get(key) || "").trim().toLowerCase();
    if (!raw) continue;
    if (isPaddlePlanKey(raw)) return raw;
    if (LEGACY_PLAN_ALIASES[raw]) return LEGACY_PLAN_ALIASES[raw];
  }

  const plink =
    url.searchParams.get("payment_link") ||
    url.searchParams.get("payment_link_id") ||
    url.searchParams.get("plink") ||
    "";
  const plinkPlan = LEGACY_STRIPE_PLINK_TO_PLAN[plink];
  if (plinkPlan && isPaddlePlanKey(plinkPlan)) return plinkPlan;

  const price = url.searchParams.get("price_id") || url.searchParams.get("price") || "";
  const pricePlan = LEGACY_STRIPE_PRICE_TO_PLAN[price];
  if (pricePlan && isPaddlePlanKey(pricePlan)) return pricePlan;

  const product = url.searchParams.get("product_id") || url.searchParams.get("product") || "";
  const productPlan = LEGACY_STRIPE_PRODUCT_TO_PLAN[product];
  if (productPlan && isPaddlePlanKey(productPlan)) return productPlan;

  return null;
}

function legacyPaddleTarget(url: URL, plan: PaddlePlanKey | null): string {
  const english =
    url.pathname === "/en" ||
    url.pathname.startsWith("/en/") ||
    url.searchParams.get("lang") === "en";
  const target = new URL(
    plan ? (english ? "/en/payer" : "/payer") : (english ? "/en/forfaits" : "/forfaits"),
    SITE_ORIGIN,
  );
  if (plan) target.searchParams.set("plan", plan);

  for (const key of ["utm_medium", "utm_campaign", "utm_content", "utm_term", "client_reference_id"]) {
    const value = url.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  target.searchParams.set("utm_source", url.searchParams.get("utm_source") || "legacy_checkout_redirect");
  target.searchParams.set("bw_source", "legacy_checkout");
  target.searchParams.set("bw_ref", "legacy_stripe_redirect");
  return target.toString();
}

function permanentPaymentRedirect(location: string): Response {
  return new Response(null, {
    status: 308,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
      "X-BW-Payment-Route": "paddle-canonical",
    },
  });
}

/** Type B — cellulaire quote via /contact until dedicated Paddle prices exist. */
const CELLULAIRE_CHECKOUT: Record<string, string> = {
  cell_signal: cellulaireCheckoutUrl("cell_signal"),
  cell_route: cellulaireCheckoutUrl("cell_route"),
  cell_fleet: cellulaireCheckoutUrl("cell_fleet"),
  cell_command: cellulaireCheckoutUrl("cell_command"),
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
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
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
      terms: `${SITE_ORIGIN}/conditions`,
      refund: `${SITE_ORIGIN}/remboursement`,
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
        amountCad: PLANS.grow_hub_spark.amountCad,
        paymentLink: CHECKOUT.grow_hub_spark,
        line: "web",
      },
      {
        key: "grow_hub_launch",
        name: "Launch",
        amountCad: PLANS.grow_hub_launch.amountCad,
        paymentLink: CHECKOUT.grow_hub_launch,
        line: "web",
      },
      {
        key: "grow_hub_growth",
        name: "Growth",
        amountCad: PLANS.grow_hub_growth.amountCad,
        paymentLink: CHECKOUT.grow_hub_growth,
        featured: true,
        line: "web",
      },
      {
        key: "grow_hub_scale",
        name: "Scale",
        amountCad: PLANS.grow_hub_scale.amountCad,
        paymentLink: CHECKOUT.grow_hub_scale,
        line: "web",
      },
      {
        key: "grow_hub_command",
        name: "Command",
        amountCad: PLANS.grow_hub_command.amountCad,
        paymentLink: CHECKOUT.grow_hub_command,
        line: "web",
      },
      {
        key: "grow_hub_partner",
        name: "Partner",
        amountCad: PLANS.grow_hub_partner.amountCad,
        paymentLink: CHECKOUT.grow_hub_partner,
        line: "web",
      },
    ],
    /** Type B — Pack Cellulaire optional (revenue #2). Not the included mobile dashboard. */
    plansCellulaire: [
      {
        key: "cell_signal",
        name: "Cell Signal",
        amountCad: CELLULAIRE_PLANS.cell_signal.amountCad,
        paymentLink: CELLULAIRE_CHECKOUT.cell_signal || null,
        checkoutReady: true,
        line: "cellulaire",
        tools: ["cell_capture"],
      },
      {
        key: "cell_route",
        name: "Cell Route",
        amountCad: CELLULAIRE_PLANS.cell_route.amountCad,
        paymentLink: CELLULAIRE_CHECKOUT.cell_route || null,
        checkoutReady: true,
        line: "cellulaire",
        tools: ["cell_capture", "cell_pipeline", "cell_checkout"],
      },
      {
        key: "cell_fleet",
        name: "Cell Fleet",
        amountCad: CELLULAIRE_PLANS.cell_fleet.amountCad,
        paymentLink: CELLULAIRE_CHECKOUT.cell_fleet || null,
        checkoutReady: true,
        featured: true,
        line: "cellulaire",
        tools: ["cell_capture", "cell_pipeline", "cell_checkout", "cell_streak", "cell_fleet_ops"],
      },
      {
        key: "cell_command",
        name: "Cell Command",
        amountCad: CELLULAIRE_PLANS.cell_command.amountCad,
        paymentLink: CELLULAIRE_CHECKOUT.cell_command || null,
        checkoutReady: true,
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

    // Force canonical host (www → apex) if somehow hit on www via this worker.
    if (url.hostname === "www.blackwayconnect.com") {
      url.hostname = "blackwayconnect.com";
      return Response.redirect(url.toString(), 301);
    }

    // If the former pay.* hostname is ever routed back to this Worker, it can
    // never serve an old checkout: permanently converge it to canonical Paddle.
    if (url.hostname === "pay.blackwayconnect.com" && (request.method === "GET" || request.method === "HEAD")) {
      return permanentPaymentRedirect(legacyPaddleTarget(url, resolveLegacyCheckoutPlan(url)));
    }

    // Keep the owner page private even when a GitHub merge deploys before Access setup.
    if (url.pathname === "/controle" || url.pathname.startsWith("/controle/")) {
      if (request.method !== "GET" || !(await authorizeOwner(request, env))) {
        return new Response("Accès propriétaire non autorisé", {
          status: 403,
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        });
      }
    }

    // Every historical purchase entry point converges to the canonical Paddle
    // checkout. Stripe IDs are accepted only as lookup aliases; they are never
    // emitted back to the browser.
    const barePaymentPath = url.pathname.replace(/^\/en(?=\/|$)/, "") || "/";
    const stripeMarkedPayer =
      barePaymentPath === "/payer" &&
      (
        String(url.searchParams.get("provider") || "").toLowerCase() === "stripe" ||
        !!url.searchParams.get("payment_link") ||
        !!url.searchParams.get("payment_link_id") ||
        !!url.searchParams.get("plink") ||
        !!url.searchParams.get("price") ||
        !!url.searchParams.get("price_id")
      );

    if (
      (request.method === "GET" || request.method === "HEAD") &&
      (LEGACY_BUY_PATHS.has(barePaymentPath) || stripeMarkedPayer)
    ) {
      return permanentPaymentRedirect(legacyPaddleTarget(url, resolveLegacyCheckoutPlan(url)));
    }

    if (url.pathname === "/api/owner/overview") {
      const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
      if (request.method !== "GET") return Response.json({ error: "Method not allowed" }, { status: 405, headers });
      if (!(await authorizeOwner(request, env))) {
        return Response.json({ error: "Accès propriétaire non configuré ou refusé" }, { status: 403, headers });
      }
      if (!env.PIPE_URL || !env.BW_LEAD_KEY) {
        return Response.json({ error: "Pipeline de données indisponible" }, { status: 503, headers });
      }
      try {
        const upstream = await fetch(`${env.PIPE_URL}/ops/overview`, {
          headers: { "X-BW-Key": env.BW_LEAD_KEY },
          redirect: "error",
        });
        return new Response(upstream.body, {
          status: upstream.status,
          headers: { ...headers, "X-Content-Type-Options": "nosniff" },
        });
      } catch {
        return Response.json({ error: "Impossible de joindre les données BlackWay" }, { status: 502, headers });
      }
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
        owner_access:
          !!String(env.CF_ACCESS_TEAM_DOMAIN || "").trim() &&
          !!String(env.CF_ACCESS_AUD || "").trim() &&
          !!String(env.BW_OWNER_EMAIL || "").trim(),
        portal_capture: true,
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
        portalLeads: "/api/portal/leads",
        crm: "/crm",
        leads: "/leads",
        cellulaire: "/forfaits-cellulaire",
        growHub: "/grow-hub",
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
          aiGatewayId: env.AI_GATEWAY_ID || "default",
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
        const master = await recordSiteLead(env, body);
        if (!upstream.ok && master) {
          return corsJson(request, {
            contact: master.id,
            score: master.score,
            statut: "master_crm",
            brain: "blackway_master_crm",
          });
        }
        return new Response(text, {
          status: upstream.status,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        });
      } catch (e) {
        return corsJson(request, { erreur: "proxy indisponible", detail: String(e) }, 502);
      }
    }

    if (url.pathname === "/api/ops" && request.method === "GET") {
      try {
        const [siteHealth, pipeHealth] = await Promise.all([
          Promise.resolve({
            ok: true,
            lead_key: !!env.BW_LEAD_KEY,
            ai: !!env.AI,
            chat: true,
          }),
          fetch(`${env.PIPE_URL}/health`)
            .then((r) => r.json() as Promise<Record<string, unknown>>)
            .catch(() => ({ ok: false })),
        ]);
        const pipe = pipeHealth as Record<string, unknown>;
        return corsJson(request, {
          ok: true,
          generatedAt: new Date().toISOString(),
          site: siteHealth,
          pipe: {
            ok: pipe.ok === true || pipe.paddle_ready === true,
            hubspot: pipe.hubspot === true,
            master_crm: true,
            lead_key: pipe.lead_key === true,
            portal_claim_ready: pipe.portal_claim_ready !== false,
            paddle_ready: pipe.paddle_ready === true,
          },
          checkout: CHECKOUT,
          app: {
            portal: "/portail",
            crm: "/crm",
            preview: BASE44_PREVIEW,
            status: "published",
          },
        });
      } catch (e) {
        return corsJson(request, { ok: false, erreur: String(e) }, 502);
      }
    }

    if (url.pathname === "/api/crm/login") {
      if (request.method !== "POST") {
        return corsJson(request, { erreur: "methode non autorisee" }, 405);
      }
      try {
        const raw = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
        const email = String(raw?.email || "");
        const password = String(raw?.password || "");
        if (!(await crmLoginOk(request, env, email, password))) {
          return corsJson(request, { ok: false, erreur: "courriel ou mot de passe invalide" }, 401);
        }
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": crmCookieHeader(),
            ...corsHeaders(request),
          },
        });
      } catch (e) {
        return corsJson(request, { erreur: "login indisponible", detail: String(e) }, 502);
      }
    }

    if (url.pathname === "/api/crm/leads" && request.method === "GET") {
      if (!(await crmAuthorized(request, env))) {
        return corsJson(request, { erreur: "acces refuse" }, 401);
      }
      try {
        const data = await listCrm(env, url.searchParams.toString());
        return corsJson(request, data);
      } catch (e) {
        return corsJson(request, { erreur: "crm indisponible", detail: String(e) }, 502);
      }
    }

    const crmLeadPatch = url.pathname.match(/^\/api\/crm\/leads\/([^/]+)$/);
    if (crmLeadPatch && request.method === "PATCH") {
      if (!(await crmAuthorized(request, env))) {
        return corsJson(request, { erreur: "acces refuse" }, 401);
      }
      try {
        const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const data = await patchCrm(env, decodeURIComponent(crmLeadPatch[1]), raw || {});
        if (!data) return corsJson(request, { erreur: "lead introuvable" }, 404);
        return corsJson(request, { ok: true, lead: data });
      } catch (e) {
        return corsJson(request, { erreur: "crm indisponible", detail: String(e) }, 502);
      }
    }

    if (url.pathname === "/api/crm/engine" && request.method === "GET") {
      if (!(await crmAuthorized(request, env))) {
        return corsJson(request, { erreur: "acces refuse" }, 401);
      }
      try {
        return corsJson(request, await getEngine(env));
      } catch (e) {
        return corsJson(request, { erreur: "engine indisponible", detail: String(e) }, 502);
      }
    }

    if (url.pathname === "/api/crm/engine" && request.method === "POST") {
      if (!(await crmAuthorized(request, env))) {
        return corsJson(request, { erreur: "acces refuse" }, 401);
      }
      try {
        return corsJson(request, await tickCrm(env));
      } catch (e) {
        return corsJson(request, { erreur: "engine indisponible", detail: String(e) }, 502);
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

    if (url.pathname === "/api/portal/leads") {
      if (request.method !== "GET") {
        return corsJson(request, { erreur: "methode non autorisee" }, 405);
      }
      try {
        const auth = request.headers.get("Authorization") || "";
        const upstream = await fetch(`${env.PIPE_URL}/portal/leads`, {
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
    if (assetRes.ok && url.pathname.startsWith("/assets/")) {
      const headers = new Headers(assetRes.headers);
      headers.set("cache-control", "public, max-age=31536000, immutable");
      return new Response(assetRes.body, {
        status: assetRes.status,
        statusText: assetRes.statusText,
        headers,
      });
    }
    return assetRes;
  },
};
