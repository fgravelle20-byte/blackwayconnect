import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLang } from "../i18n";
import { paymentPlanUrl, hasCheckoutUrl } from "../paymentCatalog";

/**
 * Checkout redirect — sends the user to the Wix Payments checkout URL
 * configured for the requested plan. If no Wix URL is configured yet,
 * falls back to the contact page.
 */
export function CheckoutPage() {
  const [params] = useSearchParams();
  const { lang, path } = useLang();
  const plan = params.get("plan") || "";
  const ready = hasCheckoutUrl(plan);

  useEffect(() => {
    if (!plan) return;
    const url = paymentPlanUrl(plan, { lang, source: "site_web", content: "checkout" });
    // Only auto-redirect if we have a real checkout URL (not the contact fallback)
    if (ready) {
      window.location.assign(url);
    }
  }, [plan, lang, ready]);

  return (
    <main className="shell section section--page">
      <h1>{lang === "fr" ? "Abonnement BlackWayConnect" : "BlackWayConnect subscription"}</h1>
      {ready ? (
        <p>{lang === "fr" ? "Redirection vers le paiement sécurisé…" : "Redirecting to secure checkout…"}</p>
      ) : plan ? (
        <p>
          {lang === "fr"
            ? "Paiement en cours de configuration. Contactez-nous pour souscrire."
            : "Checkout is being configured. Contact us to subscribe."}
        </p>
      ) : (
        <p>{lang === "fr" ? "Forfait introuvable." : "Plan not found."}</p>
      )}
      <a href={path("/contact")}>
        {lang === "fr" ? "Contacter BlackWayConnect" : "Contact BlackWayConnect"}
      </a>
    </main>
  );
}