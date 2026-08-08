import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { checkoutUrl, FEATURED_PLAN, PLANS, type PlanKey } from "../stripeConfig";

function pickPlan(leads: number, ticket: number, closeRate: number): PlanKey {
  const monthlyRevenue = leads * ticket * (closeRate / 100);
  if (monthlyRevenue >= 80000 || leads >= 200) return "grow_hub_partner";
  if (monthlyRevenue >= 40000 || leads >= 120) return "grow_hub_command";
  if (monthlyRevenue >= 20000 || leads >= 60) return "grow_hub_scale";
  if (monthlyRevenue >= 8000 || leads >= 25) return "grow_hub_growth";
  if (monthlyRevenue >= 3000) return "grow_hub_launch";
  return "grow_hub_spark";
}

export function RoiPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const [leads, setLeads] = useState(40);
  const [ticket, setTicket] = useState(1500);
  const [closeRate, setCloseRate] = useState(18);
  const [leakPct, setLeakPct] = useState(35);

  const result = useMemo(() => {
    const potential = leads * ticket * (closeRate / 100);
    const leak = potential * (leakPct / 100);
    const recovered = leak * 0.45;
    const plan = pickPlan(leads, ticket, closeRate);
    const cost = PLANS[plan].amountCad;
    const roi = cost > 0 ? Math.round((recovered / cost) * 10) / 10 : 0;
    return { potential, leak, recovered, plan, cost, roi };
  }, [leads, ticket, closeRate, leakPct]);

  const planName = result.plan.replace("grow_hub_", "").replace(/^\w/, (c) => c.toUpperCase());

  return (
    <section className="section section--page">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">{fr ? "Calculateur ROI" : "ROI calculator"}</p>
          <h1 className="display page-hero__title">
            {fr ? "Combien de revenu fuit chaque mois ?" : "How much revenue leaks each month?"}
          </h1>
          <p className="lede">
            {fr
              ? "Estimez la fuite lead→paiement, puis le forfait Grow Hub qui la referme — sans vanity metrics."
              : "Estimate lead→payment leakage, then the Grow Hub plan that closes it — no vanity metrics."}
          </p>
        </div>

        <div className="roi-grid">
          <form className="roi-form" onSubmit={(e) => e.preventDefault()}>
            <label>
              {fr ? "Leads / mois" : "Leads / month"}
              <input
                type="number"
                min={1}
                max={5000}
                value={leads}
                onChange={(e) => setLeads(Number(e.target.value) || 0)}
              />
            </label>
            <label>
              {fr ? "Ticket moyen (CAD)" : "Avg ticket (CAD)"}
              <input
                type="number"
                min={50}
                max={500000}
                value={ticket}
                onChange={(e) => setTicket(Number(e.target.value) || 0)}
              />
            </label>
            <label>
              {fr ? "Taux de closing (%)" : "Close rate (%)"}
              <input
                type="number"
                min={1}
                max={100}
                value={closeRate}
                onChange={(e) => setCloseRate(Number(e.target.value) || 0)}
              />
            </label>
            <label>
              {fr ? "Fuite estimée (%)" : "Estimated leak (%)"}
              <input
                type="number"
                min={5}
                max={90}
                value={leakPct}
                onChange={(e) => setLeakPct(Number(e.target.value) || 0)}
              />
            </label>
          </form>

          <aside className="roi-result">
            <p className="roi-result__label">{fr ? "Revenu potentiel" : "Potential revenue"}</p>
            <p className="roi-result__big">{Math.round(result.potential).toLocaleString(fr ? "fr-CA" : "en-CA")} $</p>
            <p className="roi-result__row">
              <span>{fr ? "Fuite mensuelle" : "Monthly leak"}</span>
              <strong>{Math.round(result.leak).toLocaleString(fr ? "fr-CA" : "en-CA")} $</strong>
            </p>
            <p className="roi-result__row">
              <span>{fr ? "Récupérable (~45 %)" : "Recoverable (~45%)"}</span>
              <strong>{Math.round(result.recovered).toLocaleString(fr ? "fr-CA" : "en-CA")} $</strong>
            </p>
            <p className="roi-result__row">
              <span>{fr ? "Forfait suggéré" : "Suggested plan"}</span>
              <strong>
                {planName} — {result.cost} $/{fr ? "mois" : "mo"}
              </strong>
            </p>
            <p className="roi-result__row">
              <span>{fr ? "ROI indicatif" : "Indicative ROI"}</span>
              <strong>{result.roi}×</strong>
            </p>
            <div className="cta-row" style={{ marginTop: "1.25rem" }}>
              <a
                className="btn btn--primary"
                href={checkoutUrl(result.plan, { lang, source: "roi_calculator", content: "roi_subscribe" })}
                rel="noopener noreferrer"
                target="_blank"
              >
                {fr ? `S’abonner ${planName}` : `Subscribe ${planName}`}
              </a>
              <Link className="btn btn--ghost" to={path("/diagnostic")}>
                {fr ? "Diagnostic 60 s" : "60s diagnostic"}
              </Link>
            </div>
            <p className="roi-result__note">
              {fr
                ? `Growth (${PLANS[FEATURED_PLAN].amountCad} $) reste le volume hero. Entreprise / multi-sites → consultation.`
                : `Growth ($${PLANS[FEATURED_PLAN].amountCad}) stays the volume hero. Enterprise / multi-site → consult.`}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
