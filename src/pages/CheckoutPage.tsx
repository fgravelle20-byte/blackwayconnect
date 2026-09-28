import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLang } from "../i18n";
import { isPaddlePlanKey, PADDLE_PRICES } from "../paddleCatalog";
import { initializePaddleOnce, loadPaddleScript, resolvePaddleClientToken } from "../paddleLoader";

type PaddleClient = {
  Initialize(options: {
    token: string;
    eventCallback?: (event: { name?: string; data?: { transaction_id?: string } }) => void;
  }): void;
  Update(options: { eventCallback: (event: { name?: string; data?: { transaction_id?: string } }) => void }): void;
  Checkout: { open(options: {
    items: { priceId: string; quantity: number }[];
    customData: Record<string, string>;
    settings: { displayMode: "overlay"; variant: "one-page"; successUrl: string };
  }): void };
};
declare global { interface Window { Paddle?: PaddleClient } }

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
        const token = await resolvePaddleClientToken(PADDLE_CLIENT_TOKEN_LIVE);
        await loadPaddleScript();
        if (cancelled || !window.Paddle) return;
        initializePaddleOnce(token, (event) => {
              if (event.name !== "checkout.completed") return;
              const transactionId = String(event.data?.transaction_id || "");
              if (!transactionId.startsWith("txn_")) return;
              const portal = new URL(path("/portail"), window.location.origin);
              portal.searchParams.set("transaction_id", transactionId);
              window.location.assign(portal.toString());
        });
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
