import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { ShareBar } from "../ShareBar";
import {
  checkoutUrl,
  FEATURED_PLAN,
  PLAN_ORDER,
  PLANS,
  type PlanKey,
} from "../stripeConfig";

type Row = { label: string; bwc: string; ghl: string; hub: string; agency: string };

const COMPARE_FR: Row[] = [
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
    ghl: "Non — à faire soi-même",
    hub: "Logiciel ; ops en extra",
    agency: "Oui, souvent",
  },
  {
    label: "Pipeline → paiement → CRM",
    bwc: "Natif (Stripe + HubSpot)",
    ghl: "Oui (écosystème GHL)",
    hub: "Oui (sièges / contacts)",
    agency: "Variable / plusieurs outils",
  },
  {
    label: "Secrétaire IA 24h",
    bwc: "Sur le site, en direct",
    ghl: "Modules / usage",
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
    label: "Ops / responsable compte",
    bwc: "Dès Scale / Command",
    ghl: "Libre-service",
    hub: "CSM Enterprise",
    agency: "Oui (coût élevé)",
  },
];

const COMPARE_EN: Row[] = [
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
    ghl: "No — do it yourself",
    hub: "Software; ops extra",
    agency: "Often yes",
  },
  {
    label: "Pipeline → pay → CRM",
    bwc: "Native (Stripe + HubSpot)",
    ghl: "Yes (GHL ecosystem)",
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

const PLAN_LABEL: Record<PlanKey, { fr: string; en: string }> = {
  grow_hub_spark: { fr: "Spark", en: "Spark" },
  grow_hub_launch: { fr: "Launch", en: "Launch" },
  grow_hub_growth: { fr: "Growth", en: "Growth" },
  grow_hub_scale: { fr: "Scale", en: "Scale" },
  grow_hub_command: { fr: "Command", en: "Command" },
  grow_hub_partner: { fr: "Partner", en: "Partner" },
};

function pickPlan(leads: number, ticket: number, closeRate: number, lagDays: number): PlanKey {
  const monthlyRevenue = leads * ticket * (closeRate / 100);
  const lagPenalty = lagDays >= 5 ? 1.15 : lagDays >= 3 ? 1.08 : 1;
  const pressure = monthlyRevenue * lagPenalty;
  if (pressure >= 80000 || leads >= 200) return "grow_hub_partner";
  if (pressure >= 40000 || leads >= 120) return "grow_hub_command";
  if (pressure >= 20000 || leads >= 60) return "grow_hub_scale";
  if (pressure >= 8000 || leads >= 25) return "grow_hub_growth";
  if (pressure >= 3000) return "grow_hub_launch";
  return "grow_hub_spark";
}

function openSecretary(prompt: string) {
  window.dispatchEvent(new CustomEvent("bw-open-secretary", { detail: { prompt } }));
}

async function postLead(payload: Record<string, unknown>) {
  const res = await fetch("/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export function ToolsPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const rows = fr ? COMPARE_FR : COMPARE_EN;

  const [leads, setLeads] = useState(40);
  const [ticket, setTicket] = useState(1500);
  const [closeRate, setCloseRate] = useState(18);
  const [lagDays, setLagDays] = useState(4);
  const [roiStatus, setRoiStatus] = useState<"idle" | "ok" | "err">("idle");
  const [roiPending, setRoiPending] = useState(false);
  const [cmpStatus, setCmpStatus] = useState<"idle" | "ok" | "err">("idle");
  const [cmpPending, setCmpPending] = useState(false);

  const result = useMemo(() => {
    const potential = leads * ticket * (closeRate / 100);
    // Follow-up lag amplifies leakage (each extra day beyond 1 ≈ +6% of potential lost).
    const lagFactor = Math.min(0.75, 0.18 + Math.max(0, lagDays - 1) * 0.06);
    const leak = potential * lagFactor;
    const recovered = leak * 0.45;
    const plan = pickPlan(leads, ticket, closeRate, lagDays);
    const cost = PLANS[plan].amountCad;
    const roi = cost > 0 ? Math.round((recovered / cost) * 10) / 10 : 0;
    return { potential, leak, recovered, plan, cost, roi, lagFactor };
  }, [leads, ticket, closeRate, lagDays]);

  const planName = PLAN_LABEL[result.plan][lang];

  async function onSaveRoi(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRoiPending(true);
    setRoiStatus("idle");
    const fd = new FormData(e.currentTarget);
    const prenom = String(fd.get("prenom") || "");
    const email = String(fd.get("email") || "");
    const entreprise = String(fd.get("entreprise") || "");
    const summary = [
      "bw_source=master_tools_roi",
      `leads=${leads}`,
      `ticket=${ticket}`,
      `close=${closeRate}%`,
      `lag_days=${lagDays}`,
      `leak=${Math.round(result.leak)}`,
      `recovered=${Math.round(result.recovered)}`,
      `plan=${result.plan}`,
      `roi=${result.roi}x`,
    ].join(" | ");
    const ok = await postLead({
      prenom,
      nom: "",
      email,
      entreprise,
      telephone: "",
      message: summary.slice(0, 2000),
      forfait: result.plan,
      source: "campagne",
      urgence: result.leak >= 8000 ? "elevee" : "normal",
      langue: lang,
      bw_ref: "master_tools",
    });
    setRoiStatus(ok ? "ok" : "err");
    setRoiPending(false);
    if (ok) e.currentTarget.reset();
  }

  async function onSaveCompare(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCmpPending(true);
    setCmpStatus("idle");
    const fd = new FormData(e.currentTarget);
    const prenom = String(fd.get("prenom") || "");
    const email = String(fd.get("email") || "");
    const interest = String(fd.get("interest") || "compare");
    const summary = [
      "bw_source=master_tools_compare",
      `interest=${interest}`,
      "vs=ghl|hubspot|agency",
      `featured_plan=${FEATURED_PLAN}`,
    ].join(" | ");
    const ok = await postLead({
      prenom,
      nom: "",
      email,
      entreprise: "",
      telephone: "",
      message: summary.slice(0, 2000),
      forfait: FEATURED_PLAN,
      source: "campagne",
      urgence: "normal",
      langue: lang,
      bw_ref: "master_tools",
    });
    setCmpStatus(ok ? "ok" : "err");
    setCmpPending(false);
    if (ok) e.currentTarget.reset();
  }

  const arsenal = [
    {
      id: "leak",
      featured: true,
      eyebrow: "01",
      title: fr ? "Revenue Leak Score" : "Revenue Leak Score",
      body: fr
        ? "Diagnostic ~60 s. Score de fuite + forfait recommandé. Demande capturée vers le CRM."
        : "≈60s diagnostic. Leak score + recommended plan. Inquiry captured into the CRM.",
      to: path("/diagnostic"),
      cta: fr ? "Lancer le diagnostic" : "Run diagnostic",
      primary: true,
    },
    {
      id: "grow",
      featured: true,
      eyebrow: "02",
      title: fr ? "Aperçu Grow Hub" : "Grow Hub Preview",
      body: fr
        ? "Pipeline interactif : étapes, prochaines actions, chemin vers l’abonnement Stripe."
        : "Interactive pipeline: stages, next actions, path to Stripe subscribe.",
      to: path("/grow-hub"),
      cta: fr ? "Ouvrir Grow Hub" : "Open Grow Hub",
      primary: true,
    },
    {
      id: "relance",
      featured: true,
      eyebrow: "03",
      title: fr ? "Relance panier / devis" : "Cart / quote recovery",
      body: fr
        ? "Devis abandonnés → $ exposés → gain Growth. Capture lead + checkout 499 $."
        : "Abandoned quotes → $ exposed → Growth lift. Lead capture + $499 checkout.",
      to: path("/outils/relance-panier"),
      cta: fr ? "Estimer ma relance" : "Estimate recovery",
      primary: true,
    },
    {
      id: "soumission",
      featured: true,
      eyebrow: "04",
      title: fr ? "Générateur de soumission → Stripe" : "Quote generator → Stripe",
      body: fr
        ? "Rédigez, copiez, ouvrez le lien Stripe Growth. Suivi CRM inclus."
        : "Draft, copy, open the Stripe Growth link. CRM follow-up included.",
      to: path("/outils/soumission"),
      cta: fr ? "Créer une soumission" : "Create a quote",
      primary: true,
    },
    {
      id: "checklist",
      featured: false,
      eyebrow: "05",
      title: fr ? "Checklist fermeture 7 jours" : "7-day close checklist",
      body: fr
        ? "Lead magnet : courriel → checklist PDF. CTA Growth + Portail + Pack Cellulaire."
        : "Lead magnet: email → PDF checklist. Growth + Portal + Cellular Pack CTAs.",
      to: path("/outils/checklist"),
      cta: fr ? "Débloquer gratuit" : "Unlock free",
      primary: false,
    },
    {
      id: "roi",
      featured: false,
      eyebrow: "06",
      title: fr ? "Calculateur ROI / capture de marché" : "ROI / market-capture calculator",
      body: fr
        ? "Leads, taux de conclusion, ticket, délai de relance → fuite $ + palier recommandé."
        : "Leads, close rate, ticket, follow-up lag → $ leakage + recommended tier.",
      to: "#roi",
      cta: fr ? "Calculer ma fuite" : "Calculate my leak",
      primary: false,
    },
    {
      id: "compare",
      featured: false,
      eyebrow: "07",
      title: fr ? "Comparateur GHL / HubSpot / Agence" : "GHL / HubSpot / Agency comparer",
      body: fr
        ? "Où BlackWay gagne sur le prix, l’exécution bilingue et le parcours lead-to-revenue."
        : "Where BlackWay wins on price, bilingual execution and lead-to-revenue.",
      to: "#comparateur",
      cta: fr ? "Voir le comparatif" : "See comparison",
      primary: false,
    },
    {
      id: "ai",
      featured: false,
      eyebrow: "08",
      title: fr ? "Secrétaire IA 24h" : "AI Secretary 24/7",
      body: fr
        ? "Conseiller sur chaque page — forfaits, diagnostic, prise de coordonnées. Disponible maintenant."
        : "Advisor on every page — plans, diagnostic, lead capture. Available now.",
      to: "#secretaire",
      cta: fr ? "Ouvrir le conseiller" : "Open the advisor",
      primary: false,
      action: () =>
        openSecretary(
          fr
            ? "Quels sont les forfaits Grow Hub et lequel me convient ?"
            : "What are the Grow Hub plans and which fits me?",
        ),
    },
    {
      id: "packs",
      featured: false,
      eyebrow: "09",
      title: fr ? "Packs et forfaits" : "Packs and plans",
      body: fr
        ? "Spark → Partner + Entreprise. Options site, IA et système revenu."
        : "Spark → Partner + Enterprise. Site, AI and revenue-system options.",
      to: path("/forfaits"),
      cta: fr ? "Voir les forfaits" : "See plans",
      primary: false,
    },
  ];

  return (
    <section className="section section--page section--tools">
      <div className="shell shell--wide">
        <div className="page-hero tools-hero">
          <p className="eyebrow">{fr ? "Master Tools" : "Master Tools"}</p>
          <h1 className="display page-hero__title">
            {fr ? "Les outils pour décider et encaisser." : "The tools to decide and cash in."}
          </h1>
          <p className="lede">
            {fr
              ? "Neuf outils lead-to-revenue — diagnostic, pipeline, relance panier, soumission Stripe, checklist, ROI, comparateur, secrétaire IA, forfaits. Chaque parcours mène à Growth, Portail ou Pack Cellulaire."
              : "Nine lead-to-revenue tools — diagnostic, pipeline, cart recovery, Stripe quote, checklist, ROI, comparer, AI secretary, plans. Every path leads to Growth, Portal or Cellular Pack."}
          </p>
        </div>

        <div className="tools-arsenal">
          {arsenal.map((t) => (
            <article
              key={t.id}
              className={`tools-card${t.featured ? " tools-card--featured" : ""}`}
            >
              <span className="tools-card__num">{t.eyebrow}</span>
              <h2>{t.title}</h2>
              <p>{t.body}</p>
              {t.action ? (
                <button type="button" className="btn btn--primary" onClick={t.action}>
                  {t.cta}
                </button>
              ) : t.to.startsWith("#") ? (
                <a className={`btn ${t.primary ? "btn--primary" : "btn--ghost"}`} href={t.to}>
                  {t.cta}
                </a>
              ) : (
                <Link className={`btn ${t.primary ? "btn--primary" : "btn--ghost"}`} to={t.to}>
                  {t.cta}
                </Link>
              )}
            </article>
          ))}
        </div>

        {/* ROI */}
        <div id="roi" className="tools-panel">
          <div className="page-hero page-hero--tight">
            <p className="eyebrow">06 · ROI</p>
            <h2 className="display page-hero__title">
              {fr ? "Combien de revenu fuit chaque mois ?" : "How much revenue leaks each month?"}
            </h2>
            <p className="lede">
              {fr
                ? "Leads, taux de conclusion, ticket moyen et délai de relance → fuite estimée + palier Grow Hub."
                : "Leads, close rate, average ticket and follow-up lag → estimated leak + Grow Hub tier."}
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
                {fr ? "Ticket moyen (CAD)" : "Avg deal (CAD)"}
                <input
                  type="number"
                  min={50}
                  max={500000}
                  value={ticket}
                  onChange={(e) => setTicket(Number(e.target.value) || 0)}
                />
              </label>
              <label>
                {fr ? "Taux de conclusion (%)" : "Close rate (%)"}
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={closeRate}
                  onChange={(e) => setCloseRate(Number(e.target.value) || 0)}
                />
              </label>
              <label>
                {fr ? "Délai de relance (jours)" : "Follow-up lag (days)"}
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={lagDays}
                  onChange={(e) => setLagDays(Number(e.target.value) || 0)}
                />
              </label>
            </form>

            <aside className="roi-result">
              <p className="roi-result__label">{fr ? "Revenu potentiel" : "Potential revenue"}</p>
              <p className="roi-result__big">
                {Math.round(result.potential).toLocaleString(fr ? "fr-CA" : "en-CA")} $
              </p>
              <p className="roi-result__row">
                <span>{fr ? "Fuite mensuelle" : "Monthly leak"}</span>
                <strong>
                  {Math.round(result.leak).toLocaleString(fr ? "fr-CA" : "en-CA")} $
                </strong>
              </p>
              <p className="roi-result__row">
                <span>{fr ? "Récupérable (~45 %)" : "Recoverable (~45%)"}</span>
                <strong>
                  {Math.round(result.recovered).toLocaleString(fr ? "fr-CA" : "en-CA")} $
                </strong>
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
              <div className="cta-row" style={{ marginTop: "1.1rem" }}>
                <a
                  className="btn btn--primary"
                  href={checkoutUrl(result.plan, {
                    lang,
                    source: "master_tools_roi",
                    content: "roi_subscribe",
                  })}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {fr ? `S’abonner ${planName}` : `Subscribe ${planName}`}
                </a>
                <Link className="btn btn--ghost" to={path("/diagnostic")}>
                  {fr ? "Diagnostic 60 s" : "60s diagnostic"}
                </Link>
              </div>
            </aside>
          </div>

          <form className="tools-capture" onSubmit={onSaveRoi}>
            <p className="tools-capture__title">
              {fr
                ? "Sauvegarder mon analyse — l’équipe vous rejoint"
                : "Save my analysis — the team will follow up"}
            </p>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="roi-prenom">{fr ? "Prénom" : "First name"}</label>
                <input id="roi-prenom" name="prenom" required autoComplete="given-name" />
              </div>
              <div className="field">
                <label htmlFor="roi-email">{fr ? "Courriel" : "Email"}</label>
                <input id="roi-email" name="email" type="email" required autoComplete="email" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="roi-ent">{fr ? "Entreprise" : "Company"}</label>
              <input id="roi-ent" name="entreprise" autoComplete="organization" />
            </div>
            <button className="btn btn--primary" type="submit" disabled={roiPending}>
              {roiPending ? "…" : fr ? "Envoyer mon ROI" : "Send my ROI"}
            </button>
            {roiStatus === "ok" && (
              <p className="form-status form-status--ok">
                {fr ? "Reçu. On vous contacte sous peu." : "Received. We’ll reach out shortly."}
              </p>
            )}
            {roiStatus === "err" && (
              <p className="form-status form-status--err">
                {fr ? "Envoi impossible. Réessayez." : "Could not send. Retry."}
              </p>
            )}
          </form>
        </div>

        {/* Comparateur */}
        <div id="comparateur" className="tools-panel">
          <div className="page-hero page-hero--tight">
            <p className="eyebrow">07 · {fr ? "Comparateur" : "Comparer"}</p>
            <h2 className="display page-hero__title">
              {fr
                ? "GHL, HubSpot ou agence — où BlackWay gagne."
                : "GHL, HubSpot or agency — where BlackWay wins."}
            </h2>
            <p className="lede">
              {fr
                ? "Un outil seul sous-exécute. Un mandat seul surfacture. BlackWay = plateforme + exécution bilingue."
                : "Tool-only under-delivers. Retainer-only overcharges. BlackWay = platform + bilingual execution."}
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

          <div className="cta-row" style={{ marginTop: "1.5rem" }}>
            <a
              className="btn btn--primary"
              href={checkoutUrl(FEATURED_PLAN, {
                lang,
                source: "master_tools_compare",
                content: "compare_growth",
              })}
              rel="noopener noreferrer"
              target="_blank"
            >
              {fr
                ? `S’abonner Growth — ${PLANS[FEATURED_PLAN].amountCad} $/mois`
                : `Subscribe Growth — $${PLANS[FEATURED_PLAN].amountCad}/mo`}
            </a>
            <Link className="btn btn--ghost" to={path("/contact")}>
              {fr ? "Parler Entreprise" : "Talk Enterprise"}
            </Link>
          </div>

          <form className="tools-capture" onSubmit={onSaveCompare}>
            <p className="tools-capture__title">
              {fr
                ? "Recevoir le brief comparatif par courriel"
                : "Get the comparison brief by email"}
            </p>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="cmp-prenom">{fr ? "Prénom" : "First name"}</label>
                <input id="cmp-prenom" name="prenom" required autoComplete="given-name" />
              </div>
              <div className="field">
                <label htmlFor="cmp-email">{fr ? "Courriel" : "Email"}</label>
                <input id="cmp-email" name="email" type="email" required autoComplete="email" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="cmp-interest">{fr ? "Vous comparez surtout…" : "You’re mainly comparing…"}</label>
              <select id="cmp-interest" name="interest" defaultValue="ghl">
                <option value="ghl">GoHighLevel</option>
                <option value="hubspot">HubSpot</option>
                <option value="agency">{fr ? "Agence locale" : "Local agency"}</option>
                <option value="all">{fr ? "Les trois" : "All three"}</option>
              </select>
            </div>
            <button className="btn btn--primary" type="submit" disabled={cmpPending}>
              {cmpPending ? "…" : fr ? "Envoyer ma demande" : "Send my request"}
            </button>
            {cmpStatus === "ok" && (
              <p className="form-status form-status--ok">
                {fr ? "Reçu. Brief en route." : "Received. Brief on the way."}
              </p>
            )}
            {cmpStatus === "err" && (
              <p className="form-status form-status--err">
                {fr ? "Envoi impossible. Réessayez." : "Could not send. Retry."}
              </p>
            )}
          </form>
        </div>

        {/* Secrétaire IA */}
        <div id="secretaire" className="tools-panel tools-panel--ai">
          <div className="page-hero page-hero--tight">
            <p className="eyebrow">08 · {fr ? "Secrétaire IA" : "AI Secretary"}</p>
            <h2 className="display page-hero__title">
              {fr ? "Conseiller 24h — déjà sur chaque page." : "24/7 advisor — already on every page."}
            </h2>
            <p className="lede">
              {fr
                ? "Disponible en bas à droite sur chaque page. Essayez une question — forfaits, diagnostic ou prise de coordonnées."
                : "Available bottom-right on every page. Try a question — plans, diagnostic or lead capture."}
            </p>
          </div>
          <div className="tools-prompts">
            {(fr
              ? [
                  "Combien coûtent les forfaits Grow Hub ?",
                  "Aide-moi à choisir entre Growth et Scale.",
                  "Je veux faire le diagnostic Leak Score.",
                  "Prends mes coordonnées pour une consultation.",
                ]
              : [
                  "What do Grow Hub plans cost?",
                  "Help me choose between Growth and Scale.",
                  "I want the Leak Score diagnostic.",
                  "Capture my details for a consultation.",
                ]
            ).map((p) => (
              <button
                key={p}
                type="button"
                className="tools-prompt"
                onClick={() => openSecretary(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Packs */}
        <div id="packs" className="tools-panel">
          <div className="page-hero page-hero--tight">
            <p className="eyebrow">09 · {fr ? "Forfaits" : "Plans"}</p>
            <h2 className="display page-hero__title">
              {fr
                ? "De Spark à Partner — un palier pour chaque pression."
                : "Spark to Partner — a tier for every pressure."}
            </h2>
          </div>
          <div className="tools-plan-strip">
            {PLAN_ORDER.map((key) => {
              const p = PLANS[key];
              return (
                <a
                  key={key}
                  className={`tools-plan${key === FEATURED_PLAN ? " is-featured" : ""}`}
                  href={checkoutUrl(key, { lang, source: "master_tools", content: "pack_strip" })}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>{PLAN_LABEL[key][lang]}</span>
                  <strong>
                    {p.amountCad} $/{fr ? "mois" : "mo"}
                  </strong>
                </a>
              );
            })}
          </div>
          <div className="cta-row" style={{ marginTop: "1.5rem" }}>
            <Link className="btn btn--primary" to={path("/forfaits")}>
              {fr ? "Page forfaits complète" : "Full pricing page"}
            </Link>
            <Link className="btn btn--ghost" to={path("/contact")}>
              {fr ? "Entreprise / sur devis" : "Enterprise / custom"}
            </Link>
          </div>
        </div>

        <ShareBar variant="outils" className="share-bar--panel" />
      </div>
    </section>
  );
}
