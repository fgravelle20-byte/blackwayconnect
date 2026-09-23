import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLang } from "../i18n";
import { isPaddlePlanKey, PADDLE_PRICES } from "../paddleCatalog";

type PaddleClient = {
  Initialize(options: { token: string }): void;
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
        const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
        if (!token || !token.startsWith("live_")) throw new Error("Paddle client token missing");
        await loadPaddle();
        if (cancelled || !window.Paddle) return;
        if (!initialized) {
          window.Paddle.Initialize({ token });
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
      } catch {
        if (!cancelled) setError(lang === "fr" ? "Paiement temporairement indisponible. Contactez-nous." : "Checkout is temporarily unavailable. Contact us.");
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
