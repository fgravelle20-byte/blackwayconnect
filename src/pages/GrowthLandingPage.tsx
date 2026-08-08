import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ConvertStickyBar } from "../ConvertStickyBar";
import { useLang } from "../i18n";
import { EMAILS, PHONES } from "../siteContact";
import { checkoutUrl, PLANS } from "../stripeConfig";
import { trackInitiateCheckout, trackViewContent } from "../tracking";

/** Paid-ads landing — single offer Growth 499 CAD. */
export function GrowthLandingPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const plan = PLANS.grow_hub_growth;
  const href = checkoutUrl("grow_hub_growth", {
    lang,
    source: "ads_growth",
    content: "landing_growth",
  });

  useEffect(() => {
    trackViewContent({ name: "Grow Hub Growth", id: "grow_hub_growth", value: plan.amountCad });
  }, [plan.amountCad]);

  function onBuy() {
    trackInitiateCheckout({ plan: "grow_hub_growth", value: plan.amountCad });
  }

  return (
    <>
      <section className="section section--page section--growth-landing">
        <div className="shell">
          <div className="page-hero">
            <p className="eyebrow">
              {fr ? "Essaie BlackWay · Grow Hub Growth" : "Try BlackWay · Grow Hub Growth"}
            </p>
            <h1 className="display page-hero__title">
              {fr
                ? "Les leads entrent. Toi, tu encaisses. 499 $/mois."
                : "Leads come in. You get paid. $499/mo."}
            </h1>
            <p className="lede">
              {fr
                ? "Un clic Stripe : score, relances, soumissions, paiements — Portail Client Master + mobile inclus. Annulable. Pas une pile d’outils : un système qui ferme."
                : "One Stripe click: scoring, follow-ups, quotes, payments — Client Master Portal + mobile included. Cancel anytime. Not a tool pile — a system that closes."}
            </p>
            <div className="cta-row" style={{ marginTop: "1.5rem" }}>
              <a
                className="btn btn--primary"
                href={href}
                rel="noopener noreferrer"
                target="_blank"
                onClick={onBuy}
              >
                {fr ? "S’abonner Growth — 499 $/mois" : "Subscribe Growth — $499/mo"}
              </a>
              <a className="btn btn--ghost" href={PHONES.tollFree.href}>
                {fr ? `Appeler ${PHONES.tollFree.display}` : `Call ${PHONES.tollFree.display}`}
              </a>
              <Link className="btn btn--ghost" to={path("/diagnostic")}>
                {fr ? "D’abord : Leak Score 60 s" : "First: 60s Leak Score"}
              </Link>
            </div>
            <p className="lede" style={{ marginTop: "1.25rem" }}>
              {fr ? "Humain local :" : "Local human:"}{" "}
              <a href={PHONES.local.href}>{PHONES.local.display}</a>
              {" · "}
              <a href={`mailto:${EMAILS.service}`}>{EMAILS.service}</a>
              {fr
                ? " · Après paiement → Portail inclus."
                : " · After payment → Portal included."}
            </p>
          </div>

          <ul className="lede" style={{ maxWidth: "36rem", marginTop: "2rem", paddingLeft: "1.2rem" }}>
            <li>{fr ? "Pipeline + CRM HubSpot branché — l’action est forcée" : "Pipeline + HubSpot wired — action is forced"}</li>
            <li>{fr ? "Portail Master + accès mobile le jour 1" : "Master Portal + mobile access on day one"}</li>
            <li>{fr ? "Secrétaire IA 24h sur le site" : "AI Secretary 24/7 on the site"}</li>
            <li>{fr ? "Stripe. Annulable. Upsell Cellulaire optionnel." : "Stripe. Cancel anytime. Optional Cellular upsell."}</li>
          </ul>

          <p className="lede" style={{ marginTop: "2rem" }}>
            <Link to={path("/forfaits")}>
              {fr ? "Voir tous les paliers Spark → Partner" : "See all tiers Spark → Partner"}
            </Link>
            {" · "}
            <Link to={path("/contact")}>{fr ? "Formulaire contact" : "Contact form"}</Link>
          </p>
        </div>
      </section>

      <ConvertStickyBar
        primaryHref={href}
        primaryLabel={fr ? "Acheter Growth — 499 $" : "Buy Growth — $499"}
        external
        onPrimaryClick={onBuy}
      />
    </>
  );
}
