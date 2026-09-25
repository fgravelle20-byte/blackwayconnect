import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLang } from "../i18n";
import { isPaddlePlanKey, PADDLE_PRICES } from "../paddleCatalog";

type PaddleClient = {
  Initialize(options: {
    token: string;
    eventCallback?: (event: { name?: string; data?: { transaction_id?: string } }) => void;
  }): void;
  Checkout: { open(options: {
    items: { priceId: string; quantity: number }[];
    customData: Record<string, string>;
    settings: { displayMode: "overlay"; variant: "one-page"; successUrl: string };
  }): void };
};
declare global { interface Window { Paddle?: PaddleClient } }
let initialized = false;
let paddleScript: Promise<void> | undefined;

function loadPaddle(): Promise<void> {
  if (window.Paddle) return Promise.resolve();
  if (!paddleScript) paddleScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Paddle unavailable"));
    document.head.appendChild(script);
  });
  return paddleScript;
}

const PIPE_ORIGIN = "https://api.blackwayconnect.com";

/**
 * Paddle client-side tokens are designed to ship in the browser.
 * Domain allowlist is enforced in the Paddle dashboard (blackwayconnect.com).
 * Prefer VITE_ / pipe when present; this is the production fallback.
 *
 * PAYMENT-LOCKED — do not edit token / checkout flow without unlock.
 * See ops/payment-lock/LOCKED.json + README.md.
 */
const PADDLE_CLIENT_TOKEN_LIVE = "live_a4f8ad8f1c8be908ec3784e8d8b";

/** Build-time Vite secret, else runtime pipe, else public live fallback. */
async function resolvePaddleClientToken(): Promise<string> {
  const fromBuild = String(import.meta.env.VITE_PADDLE_CLIENT_TOKEN || "").trim();
  if (fromBuild.startsWith("live_")) return fromBuild;
  try {
    const r = await fetch(`${PIPE_ORIGIN}/paddle/client-config`, { credentials: "omit" });
    if (r.ok) {
      const data = (await r.json()) as { client_token?: string; clientToken?: string };
      const token = String(data.client_token || data.clientToken || "").trim();
      if (token.startsWith("live_")) return token;
    }
  } catch {
    /* pipe optional */
  }
  if (PADDLE_CLIENT_TOKEN_LIVE.startsWith("live_")) return PADDLE_CLIENT_TOKEN_LIVE;
  throw new Error("Paddle client token missing");
}

export function CheckoutPage() {
  const [params] = useSearchParams();
  const { lang, path } = useLang();
  const [error, setError] = useState("");
  const plan = params.get("plan") || "";
  const valid = isPaddlePlanKey(plan);
  useEffect(() => {
    if (!isPaddlePlanKey(plan)) return;
    let cancelled = false;
    const open = async () => {
      try {
        const token = await resolvePaddleClientToken();
        await loadPaddle();
        if (cancelled || !window.Paddle) return;
        if (!initialized) {
          window.Paddle.Initialize({
            token,
            eventCallback: (event) => {
              if (event.name !== "checkout.completed") return;
              const transactionId = String(event.data?.transaction_id || "");
              if (!transactionId.startsWith("txn_")) return;
              const portal = new URL(path("/portail"), window.location.origin);
              portal.searchParams.set("transaction_id", transactionId);
              window.location.assign(portal.toString());
            },
          });
          initialized = true;
        }
        const successUrl = new URL(path("/merci"), window.location.origin);
        successUrl.searchParams.set("src", "paddle");
        successUrl.searchParams.set("plan", plan);
        window.Paddle.Checkout.open({
          items: [{ priceId: PADDLE_PRICES[plan], quantity: 1 }],
          customData: { bw_forfait: plan, platform: "blackwayconnect" },
          settings: { displayMode: "overlay", variant: "one-page", successUrl: successUrl.toString() },
        });
      } catch (err) {
        const missing = String((err as Error)?.message || "").includes("token missing");
        if (!cancelled) {
          setError(
            missing
              ? lang === "fr"
                ? "Paiement indisponible : token Paddle live manquant. Contactez-nous."
                : "Checkout unavailable: missing live Paddle token. Contact us."
              : lang === "fr"
                ? "Paiement temporairement indisponible. Contactez-nous."
                : "Checkout is temporarily unavailable. Contact us.",
          );
        }
      }
    };
    void open();
    return () => { cancelled = true; };
  }, [valid, plan, lang, path]);
  return <main className="shell section section--page">
    <h1>{lang === "fr" ? "Abonnement BlackWayConnect" : "BlackWayConnect subscription"}</h1>
    {valid ? <p>{error || (lang === "fr" ? "Ouverture du paiement sécurisé…" : "Opening secure checkout…")}</p>
      : <p>{lang === "fr" ? "Forfait introuvable." : "Plan not found."}</p>}
    <a href={path("/contact")}>{lang === "fr" ? "Contacter BlackWayConnect" : "Contact BlackWayConnect"}</a>
  </main>;
}
