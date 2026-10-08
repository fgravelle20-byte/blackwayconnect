import { PageIntro } from "../PageIntro";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { ContactForm } from "../ContactForm";
import { trackInitiateCheckout } from "../tracking";
import {
  CHATBOT_ORDER,
  MODULES_IA,
  VOCAL_ORDER,
  moduleIaCheckoutUrl,
  type ModuleIaKey,
} from "../modulesIaConfig";

/** Modules IA — Chatbot IA + Accueil vocal IA, abonnements Wix séparés du Grow Hub. */
export function ModulesIaPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";

  const rail = (keys: ModuleIaKey[]) => (
    <div className="plan-rail">
      {keys.map((key) => {
        const plan = MODULES_IA[key];
        return (
          <article
            key={key}
            id={`plan-${key}`}
            className={`plan-item${plan.featured ? " plan-item--featured" : ""}`}
          >
            {plan.featured ? (
              <span className="plan-item__badge">{fr ? "Populaire" : "Popular"}</span>
            ) : null}
            <h2>{fr ? plan.nameFr : plan.nameEn}</h2>
            <p className="price">
              {plan.amountCad} $ / {fr ? "mois" : "mo"}
            </p>
            <ul className="plan-item__blurb" style={{  paddingLeft: "1.1rem" }}>
              {(fr ? plan.featuresFr : plan.featuresEn).map((f) => (
                <li key={f}>{fr ? f.replace("ton site", "votre site").replace("ta ligne", "votre ligne").replace("ton équipe", "votre équipe").replace("Leads", "Prospects").replace("leads", "prospects") : f}</li>
              ))}
            </ul>
            <a
              className="btn btn--primary plan-item__cta"
              href={moduleIaCheckoutUrl(key, { lang, content: "modules_ia_page" })}
              rel="noopener noreferrer"
              target="_blank"
              onClick={() => trackInitiateCheckout({ plan: key, value: plan.amountCad })}
            >
              {fr ? "S’abonner" : "Subscribe"}
            </a>
          </article>
        );
      })}
    </div>
  );

  return (
    <section className="section section--page section--app-plans">
      <div className="shell">
        <PageIntro image="/office-team.jpg">
          <p className="eyebrow">{fr ? "Modules IA · abonnement mensuel" : "AI modules · monthly subscription"}</p>
          <h1 className="display page-hero__title">
            {fr
              ? "Un assistant IA pour votre site et votre téléphone."
              : "AI chatbot for your website. AI voice reception for your phone line."}
          </h1>
          <p className="lede">
            {fr
              ? "Chaque module s’ajoute à votre portail client, avec ou sans Grow Hub. Paiement sécurisé en ligne, en dollars canadiens, annulable en tout temps."
              : "Each module is added to your Client Master Portal, with or without Grow Hub. Secure online payment in Canadian dollars, cancel anytime."}
          </p>
          <div className="cta-row">
            <Link className="btn btn--ghost" to={path("/forfaits")}>
              {fr ? "Forfaits Grow Hub" : "Grow Hub plans"}
            </Link>
            <Link className="btn btn--ghost" to={path("/forfaits-cellulaire")}>
              {fr ? "Pack Cellulaire" : "Cellular Pack"}
            </Link>
          </div>
        </PageIntro>

        <div id="chatbot" className="app-plans-lead">
          <h2 className="display">{fr ? "Chatbot IA" : "AI Chatbot"}</h2>
        </div>
        {rail(CHATBOT_ORDER)}

        <div id="vocal" className="app-plans-lead">
          <h2 className="display">{fr ? "Accueil vocal IA (ligne téléphonique)" : "AI Voice reception (phone line)"}</h2>
        </div>
        {rail(VOCAL_ORDER)}

        <div className="app-plans-lead">
          <h2 className="display">
            {fr ? "Une question avant de vous abonner ?" : "A question before subscribing?"}
          </h2>
          <ContactForm source="modules_ia" />
        </div>
      </div>
    </section>
  );
}