import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { EMAILS, PHONES } from "../siteContact";

const STEPS = [
  {
    n: "01",
    img: "/how-it-works/step-1-plans.svg",
    fr: {
      title: "Choisis ton forfait",
      body: "Spark → Partner. Un seul système commercial. Tu prends le palier qui ferme tes fuites — pas une pile d’outils.",
    },
    en: {
      title: "Pick your plan",
      body: "Spark → Partner. One commercial system. Choose the tier that closes your leaks — not a tool pile.",
    },
  },
  {
    n: "02",
    img: "/how-it-works/step-2-stripe.svg",
    fr: {
      title: "Tu paies sur Stripe",
      body: "Checkout sécurisé en CAD. Annulable. Ta carte ne transite pas chez nous — Stripe gère le paiement.",
    },
    en: {
      title: "You pay on Stripe",
      body: "Secure CAD checkout. Cancel anytime. Your card never hits our servers — Stripe handles payment.",
    },
  },
  {
    n: "03",
    img: "/how-it-works/step-3-unlock.svg",
    fr: {
      title: "Ça se déclenche tout seul",
      body: "Webhook Stripe → HubSpot + Portail. Le forfait payé (bw_forfait) s’active automatiquement. Rien à demander à la main.",
    },
    en: {
      title: "It unlocks automatically",
      body: "Stripe webhook → HubSpot + Portal. The paid plan (bw_forfait) activates itself. No manual handoff.",
    },
  },
  {
    n: "04",
    img: "/how-it-works/step-4-control.svg",
    fr: {
      title: "Tu contrôles",
      body: "Portail Client Master + outils selon ton palier. Dashboard web et mobile. Tu opères. Le système ferme.",
    },
    en: {
      title: "You stay in control",
      body: "Client Master Portal + tools for your tier. Web and mobile dashboard. You operate. The system closes.",
    },
  },
] as const;

export function HowItWorksPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";

  return (
    <section className="section section--page section--how">
      <div className="shell">
        <div className="page-hero page-hero--tight">
          <p className="eyebrow">{fr ? "Abonnement Grow Hub" : "Grow Hub subscription"}</p>
          <h1 className="display page-hero__title">
            {fr ? "Comment ça marche ?" : "How it works"}
          </h1>
          <p className="lede">
            {fr
              ? "Quatre étapes. Tu paies le forfait choisi — il s’active tout seul. Portail inclus le jour 1."
              : "Four steps. You pay for the plan you chose — it activates itself. Portal included on day one."}
          </p>
        </div>

        <ol className="how-steps">
          {STEPS.map((step) => {
            const c = fr ? step.fr : step.en;
            return (
              <li key={step.n} className="how-step">
                <div className="how-step__media">
                  <img src={step.img} alt="" width={640} height={400} loading="lazy" decoding="async" />
                </div>
                <div className="how-step__copy">
                  <p className="how-step__n">{step.n}</p>
                  <h2>{c.title}</h2>
                  <p>{c.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="how-cta">
          <h2>{fr ? "Prêt à encaisser ?" : "Ready to get paid?"}</h2>
          <p>
            {fr
              ? "Choisis ton palier. Paiement Stripe → activation auto du Portail."
              : "Pick your tier. Stripe payment → Portal auto-activates."}
          </p>
          <div className="cta-row">
            <Link className="btn btn--primary" to={path("/forfaits")}>
              {fr ? "Voir les forfaits" : "See plans"}
            </Link>
            <Link className="btn btn--ghost" to={path("/forfaits-growth")}>
              {fr ? "Growth 499 $/mois" : "Growth $499/mo"}
            </Link>
            <a className="btn btn--ghost" href={PHONES.tollFree.href}>
              {PHONES.tollFree.display}
            </a>
            <a className="btn btn--ghost" href={PHONES.local.href}>
              {PHONES.local.display}
            </a>
          </div>
          <p className="how-cta__note">
            <a href={`mailto:${EMAILS.service}`}>{EMAILS.service}</a>
            {fr
              ? " · Paiement reçu = forfait choisi déclenché automatiquement."
              : " · Payment received = chosen plan triggers automatically."}
          </p>
        </div>
      </div>
    </section>
  );
}
