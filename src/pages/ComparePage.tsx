import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { FEATURED_PLAN, PLANS } from "../stripeConfig";

type Row = { label: string; bwc: string; ghl: string; hub: string; agency: string };

const ROWS_FR: Row[] = [
  {
    label: "Prix typique / mois",
    bwc: "99 $ → 2 499 $ CAD (+ Entreprise)",
    ghl: "~136–697 $ CAD (outil seul)",
    hub: "Marketing Pro ~1 200 $ CAD + sièges",
    agency: "1 500–6 000 $ CAD (mandat)",
  },
  {
    label: "Exécution bilingue QC",
    bwc: "Incluse (FR/EN)",
    ghl: "Non — DIY",
    hub: "Logiciel ; ops en extra",
    agency: "Oui, souvent",
  },
  {
    label: "Pipeline → paiement → CRM",
    bwc: "Native (Stripe + HubSpot)",
    ghl: "Oui (stack GHL)",
    hub: "Oui (sièges / contacts)",
    agency: "Variable / outils multiples",
  },
  {
    label: "Secrétaire IA 24h",
    bwc: "Sur le site, live",
    ghl: "Add-ons / usage",
    hub: "Chatbots séparés",
    agency: "Rarement inclus",
  },
  {
    label: "Diagnostic Leak Score",
    bwc: "Inclus (capture lead)",
    ghl: "Non",
    hub: "Non",
    agency: "Audit facturé à part",
  },
  {
    label: "Ops / account lead",
    bwc: "Dès Scale / Command",
    ghl: "Self-serve",
    hub: "CSM Enterprise",
    agency: "Oui (coût élevé)",
  },
];

const ROWS_EN: Row[] = [
  {
    label: "Typical monthly price",
    bwc: "$99 → $2,499 CAD (+ Enterprise)",
    ghl: "~CAD $136–697 (tool only)",
    hub: "Marketing Pro ~CAD $1,200 + seats",
    agency: "CAD $1,500–6,000 (retainer)",
  },
  {
    label: "Bilingual QC execution",
    bwc: "Included (FR/EN)",
    ghl: "No — DIY",
    hub: "Software; ops extra",
    agency: "Often yes",
  },
  {
    label: "Pipeline → pay → CRM",
    bwc: "Native (Stripe + HubSpot)",
    ghl: "Yes (GHL stack)",
    hub: "Yes (seats / contacts)",
    agency: "Varies / tool sprawl",
  },
  {
    label: "24/7 AI Secretary",
    bwc: "Live on site",
    ghl: "Add-ons / usage",
    hub: "Separate chatbots",
    agency: "Rarely included",
  },
  {
    label: "Leak Score diagnostic",
    bwc: "Included (lead capture)",
    ghl: "No",
    hub: "No",
    agency: "Paid audit",
  },
  {
    label: "Ops / account lead",
    bwc: "From Scale / Command",
    ghl: "Self-serve",
    hub: "CSM at Enterprise",
    agency: "Yes (high cost)",
  },
];

export function ComparePage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const rows = fr ? ROWS_FR : ROWS_EN;
  const hero = PLANS[FEATURED_PLAN].amountCad;

  return (
    <section className="section section--page">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">{fr ? "Comparatif" : "Compare"}</p>
          <h1 className="display page-hero__title">
            {fr
              ? "GHL, HubSpot ou agence — où BlackWay gagne."
              : "GHL, HubSpot or agency — where BlackWay wins."}
          </h1>
          <p className="lede">
            {fr
              ? "Les outils seuls sous-exécutent. Les retainers agence sur-chargent. BlackWayConnect = plateforme lead-to-revenue + exécution bilingue, de 99 $ à l’Entreprise."
              : "Tool-only under-delivers. Agency retainers overcharge. BlackWayConnect = lead-to-revenue platform + bilingual execution, from $99 to Enterprise."}
          </p>
        </div>

        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>{fr ? "Critère" : "Criterion"}</th>
                <th>BlackWayConnect</th>
                <th>GoHighLevel</th>
                <th>HubSpot</th>
                <th>{fr ? "Agence QC" : "QC agency"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td className="compare-table__win">{r.bwc}</td>
                  <td>{r.ghl}</td>
                  <td>{r.hub}</td>
                  <td>{r.agency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cta-row" style={{ marginTop: "2.25rem" }}>
          <Link className="btn btn--primary" to={path("/forfaits")}>
            {fr ? `Voir les forfaits (dès ${hero} $ Growth)` : `See plans (from $${hero} Growth)`}
          </Link>
          <Link className="btn btn--ghost" to={`${path("/outils")}#roi`}>
            {fr ? "Calculer mon ROI" : "Calculate my ROI"}
          </Link>
          <Link className="btn btn--ghost" to={path("/contact")}>
            {fr ? "Parler Entreprise" : "Talk Enterprise"}
          </Link>
        </div>
      </div>
    </section>
  );
}
