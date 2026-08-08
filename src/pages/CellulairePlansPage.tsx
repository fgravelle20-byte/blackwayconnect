import { Link } from "react-router-dom";
import {
  CELLULAIRE_ORDER,
  CELLULAIRE_PLANS,
  FEATURED_CELLULAIRE,
  STRIPE_CELLULAIRE_TODO,
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
        <div className="page-hero">
          <p className="eyebrow">
            {fr
              ? "Revenu #2 optionnel · Pack Cellulaire / Terrain"
              : "Optional revenue #2 · Cellular / Field Pack"}
          </p>
          <h1 className="display page-hero__title">
            {fr
              ? "Outils terrain en surplus — merge avec ton Portail."
              : "Field tools as surplus — merge with your Portal."}
          </h1>
          <p className="lede">
            {fr
              ? "Ce n’est pas l’app dashboard (déjà incluse avec Grow Hub). C’est un pack d’outils terrain différents (Signal → Command) qui se combine dans le même Portail Client Master."
              : "This is not the dashboard app (already included with Grow Hub). It is a pack of different field tools (Signal → Command) that merges into the same Client Master Portal."}
          </p>
          <div className="cta-row" style={{ marginTop: "1.25rem" }}>
            <Link className="btn btn--primary" to={path("/forfaits")}>
              {fr ? "D’abord : Grow Hub web (revenu #1)" : "First: Grow Hub web (revenue #1)"}
            </Link>
            <Link className="btn btn--ghost" to={path("/portail")}>
              {fr ? "Dashboard mobile (inclus)" : "Mobile dashboard (included)"}
            </Link>
          </div>
        </div>

        {!anyLive ? (
          <p className="form-status" role="status">
            {fr
              ? "Checkout Stripe Pack Cellulaire en préparation — demandez Cell Fleet ci-dessous. Les Payment Links seront branchés dès création."
              : "Cellular Pack Stripe checkout pending — request Cell Fleet below. Payment Links wire in when created."}
          </p>
        ) : null}

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
                <ul className="plan-item__blurb" style={{ marginBottom: "1rem", paddingLeft: "1.1rem" }}>
                  {plan.tools
                    .filter((t) => t !== "support" && t !== "forfaits_cellulaire")
                    .map((t) => (
                      <li key={t}>{toolLabel(t, fr)}</li>
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

        <div id="outils" className="app-plans-lead" style={{ marginTop: "2.5rem" }}>
          <h2 className="display">
            {fr ? "Outils terrain (différents du web)" : "Field tools (different from web)"}
          </h2>
          <p className="lede">
            {fr
              ? "Capture, pipeline mobile, checkout prospect, streak, fleet, merge web — pas le score/ROI/comparateur du site. Dashboard mobile = Portail (inclus)."
              : "Capture, mobile pipeline, prospect checkout, streak, fleet, web merge — not the site score/ROI/comparer. Mobile dashboard = Portal (included)."}
          </p>
        </div>

        <div className="app-plans-lead">
          <h2 className="display">
            {fr ? "Pas prêt ? Lead pack → HubSpot." : "Not ready? Pack lead → HubSpot."}
          </h2>
          <ContactForm source="app_mobile" />
        </div>

        <details style={{ marginTop: "2rem" }}>
          <summary className="lede">
            {fr
              ? "Stripe à créer (Payment Links Pack Cellulaire)"
              : "Stripe to create (Cellular Pack Payment Links)"}
          </summary>
          <ul className="lede">
            {STRIPE_CELLULAIRE_TODO.map((row) => (
              <li key={row.key}>
                <code>{row.key}</code> — {row.name} — {row.amountCad} CAD/mo — metadata{" "}
                <code>{row.metadata}</code> — success{" "}
                <code>https://blackwayconnect.com/portail?session_id=&#123;CHECKOUT_SESSION_ID&#125;</code>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </section>
  );
}

function toolLabel(id: string, fr: boolean): string {
  const map: Record<string, { fr: string; en: string }> = {
    cell_capture: { fr: "Capture lead terrain", en: "Field lead capture" },
    cell_pipeline: { fr: "Pipeline mobile", en: "Mobile pipeline" },
    cell_checkout: { fr: "Checkout prospect", en: "Prospect checkout" },
    cell_streak: { fr: "Streak quotidien", en: "Daily streak" },
    cell_fleet_ops: { fr: "Ops multi-user", en: "Multi-user ops" },
    cell_merge: { fr: "Merge Grow Hub web", en: "Merge Grow Hub web" },
  };
  const row = map[id];
  return row ? (fr ? row.fr : row.en) : id;
}

export function featuredCellulaireKey(): CellulairePlanKey {
  return FEATURED_CELLULAIRE;
}
