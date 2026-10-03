import { PageIntro } from "../PageIntro";
import { Link } from "react-router-dom";
import {
  CELLULAIRE_ORDER,
  CELLULAIRE_PLANS,
  FEATURED_CELLULAIRE,
  cellulaireCheckoutUrl,
  isCellulaireCheckoutReady,
  type CellulairePlanKey,
} from "../cellulaireConfig";
import { useLang } from "../i18n";
import { ContactForm } from "../ContactForm";

/**
 * Revenu #2 optionnel — Pack Cellulaire / Terrain.
 * NOT the mobile app (app = Portail inclus with Grow Hub).
 */
export function CellulairePlansPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const anyLive = CELLULAIRE_ORDER.some((k) => isCellulaireCheckoutReady(k));

  return (
    <section className="section section--page section--app-plans">
      <div className="shell">
        <PageIntro image="/office-morning.jpg">
          <p className="eyebrow">
            {fr
              ? "Outils mobiles optionnels · Pack Cellulaire / Terrain"
              : "Optional revenue #2 · Cellular / Field Pack"}
          </p>
          <h1 className="display page-hero__title">
            {fr
              ? "Des outils mobiles réunis dans votre portail."
              : "Field tools as surplus — merge with your Portal."}
          </h1>
          <p className="lede">
            {fr
              ? "Le portail mobile est inclus avec Grow Hub. Le Pack Cellulaire ajoute des outils de terrain, de Signal à Command, dans le même espace client."
              : "This is not the dashboard app (already included with Grow Hub). It is a pack of different field tools (Signal → Command) that merges into the same Client Master Portal."}
          </p>
          <div className="cta-row">
            <Link className="btn btn--primary" to={path("/forfaits")}>
              {fr ? "D’abord : Grow Hub web (revenu #1)" : "First: Grow Hub web (revenue #1)"}
            </Link>
            <Link className="btn btn--ghost" to={path("/portail")}>
              {fr ? "Tableau de bord mobile inclus" : "Mobile dashboard (included)"}
            </Link>
          </div>
        </PageIntro>

        <p className="form-status" role="status">
          {anyLive
            ? fr
              ? "Essai gratuit 14 jours, paiement sécurisé Paddle. Le pack s’active dans votre Portail dès l’abonnement."
              : "14-day free trial, secure Paddle payment. The pack unlocks in your Portal as soon as you subscribe."
            : fr
              ? "Pack Cellulaire sur demande — parlez à BlackWay ci-dessous. Le paiement Paddle sera proposé avec l’offre finale."
              : "Cellular Pack is quote-based — contact BlackWay below. Paddle payment will be included with the final offer."}
        </p>

        <div className="plan-rail">
          {CELLULAIRE_ORDER.map((key) => {
            const plan = CELLULAIRE_PLANS[key];
            const href = cellulaireCheckoutUrl(key, {
              lang,
              source: "cellulaire",
              content: "cellulaire_page",
            });
            const ready = isCellulaireCheckoutReady(key);
            const featured = key === FEATURED_CELLULAIRE;
            return (
              <article
                key={key}
                id={`plan-${key}`}
                className={`plan-item${featured ? " plan-item--featured" : ""}`}
              >
                {featured ? (
                  <span className="plan-item__badge">{fr ? "Recommandé" : "Recommended"}</span>
                ) : null}
                <h2>{fr ? plan.nameFr : plan.nameEn}</h2>
                <p className="price">
                  {plan.amountCad} $ / {fr ? "mois" : "mo"}
                </p>
                <p className="plan-item__blurb">{fr ? plan.blurbFr : plan.blurbEn}</p>
                <ul className="plan-item__blurb" style={{  paddingLeft: "1.1rem" }}>
                  {plan.tools
                    .filter((t) => t !== "support" && t !== "forfaits_cellulaire")
                    .map((t) => (
                      <li key={t}>
                        <Link to={path(TOOL_HREF[t] || "/portail")}>{toolLabel(t, fr)}</Link>
                      </li>
                    ))}
                </ul>
                <a
                  className="btn btn--primary plan-item__cta"
                  href={href}
                  rel="noopener noreferrer"
                  target={ready ? "_blank" : undefined}
                >
                  {ready
                    ? fr
                      ? "Ajouter ce pack"
                      : "Add this pack"
                    : fr
                      ? "Demander ce pack"
                      : "Request this pack"}
                </a>
              </article>
            );
          })}
        </div>

        <div id="outils" className="app-plans-lead">
          <h2 className="display">
            {fr ? "Outils terrain (différents du web)" : "Field tools (different from web)"}
          </h2>
          <p className="lede">
            {fr
              ? "Capture de demandes, suivi commercial mobile et coordination de vos activités : retrouvez vos outils de terrain dans votre portail client."
              : "Capture, mobile pipeline, prospect checkout, streak, fleet, web merge — not the site score/ROI/comparer. Mobile dashboard = Portal (included)."}
          </p>
        </div>

        <div className="app-plans-lead">
          <h2 className="display">
            {fr ? "Pas prêt ? Envoyez la demande au CRM BlackWay." : "Not ready? Send the request to BlackWay CRM."}
          </h2>
          <ContactForm source="app_mobile" />
        </div>

      </div>
    </section>
  );
}

const TOOL_HREF: Record<string, string> = {
  cell_capture: "/portail/capture",
  cell_pipeline: "/portail/pipeline",
  cell_checkout: "/portail/cell-checkout",
  cell_merge: "/portail/merge",
  cell_streak: "/portail/streak",
  cell_fleet_ops: "/portail/fleet",
};

function toolLabel(id: string, fr: boolean): string {
  const map: Record<string, { fr: string; en: string }> = {
    cell_capture: { fr: "Capture prospect terrain", en: "Field lead capture" },
    cell_pipeline: { fr: "Pipeline mobile", en: "Mobile pipeline" },
    cell_checkout: { fr: "Checkout prospect", en: "Prospect checkout" },
    cell_streak: { fr: "Streak quotidien", en: "Daily streak" },
    cell_fleet_ops: { fr: "Opérations multi-user", en: "Multi-user ops" },
    cell_merge: { fr: "Merge Grow Hub web", en: "Merge Grow Hub web" },
  };
  const row = map[id];
  return row ? (fr ? row.fr : row.en) : id;
}

export function featuredCellulaireKey(): CellulairePlanKey {
  return FEATURED_CELLULAIRE;
}

