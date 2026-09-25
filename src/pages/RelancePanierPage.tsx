import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { FEATURED_PLAN, PLANS, checkoutUrl } from "../stripeConfig";
import { trackInitiateCheckout, trackLead, trackViewContent } from "../tracking";
import { useEffect } from "react";
import { postLead } from "../lib/postLead";

/** Abandoned quote / cart recovery checker → Growth checkout + HubSpot. */
export function RelancePanierPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";

  const [abandoned, setAbandoned] = useState(12);
  const [ticket, setTicket] = useState(1800);
  const [recoverNow, setRecoverNow] = useState(8);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [pending, setPending] = useState(false);
  const [leadScore, setLeadScore] = useState<number | null>(null);

  useEffect(() => {
    trackViewContent({ name: "Relance panier", id: "tool_relance_panier", value: PLANS[FEATURED_PLAN].amountCad });
  }, []);

  const result = useMemo(() => {
    const exposed = abandoned * ticket;
    const recoveredNow = exposed * (Math.min(100, Math.max(0, recoverNow)) / 100);
    const withSystem = exposed * 0.42;
    const lift = Math.max(0, withSystem - recoveredNow);
    const volumeTurbo = Math.min(100, Math.round(20 + Math.min(abandoned, 80)));
    const qualityTurbo = Math.min(100, Math.round(35 + Math.min(100, recoverNow) * 0.4 + (lift > 5000 ? 15 : 0)));
    const twinScore = Math.round(volumeTurbo * 0.42 + qualityTurbo * 0.58);
    return { exposed, recoveredNow, withSystem, lift, volumeTurbo, qualityTurbo, twinScore };
  }, [abandoned, ticket, recoverNow]);

  const growthHref = checkoutUrl(FEATURED_PLAN, {
    lang,
    source: "tool_relance_panier",
    content: "growth_cta",
  });

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    setLeadScore(null);
    const fd = new FormData(e.currentTarget);
    const summary = [
      "bw_source=tool_relance_panier",
      `abandoned=${abandoned}`,
      `ticket=${ticket}`,
      `recover_now=${recoverNow}%`,
      `exposed=${Math.round(result.exposed)}`,
      `lift=${Math.round(result.lift)}`,
      `twin=${result.twinScore}`,
    ].join(" | ");
    const out = await postLead({
      prenom: String(fd.get("prenom") || ""),
      nom: "",
      email: String(fd.get("email") || ""),
      entreprise: String(fd.get("entreprise") || ""),
      telephone: String(fd.get("telephone") || ""),
      message: summary.slice(0, 2000),
      forfait: FEATURED_PLAN,
      source: "campagne",
      urgence: result.lift >= 5000 ? "elevee" : "normal",
      langue: lang,
      bw_ref: "tool_relance_panier",
      engine_mode: "twin_turbo_full_performance",
      volume_turbo: result.volumeTurbo,
      quality_turbo: result.qualityTurbo,
      twin_score: result.twinScore,
      band: result.lift >= 5000 ? "high" : result.lift >= 1500 ? "mid" : "low",
      answers: {
        tool: "relance_panier",
        abandoned,
        ticket,
        recover_now: recoverNow,
        lift: Math.round(result.lift),
      },
    });
    if (out.ok) {
      trackLead();
      setLeadScore(out.score ?? result.twinScore);
      setStatus("ok");
      e.currentTarget.reset();
    } else {
      setStatus("err");
    }
    setPending(false);
  }

  return (
    <section className="section section--page section--tools">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">{fr ? "Master Tools · Relance panier" : "Master Tools · Cart recovery"}</p>
          <h1 className="display page-hero__title">
            {fr ? "Combien dorment dans vos devis abandonnés ?" : "How much sits in abandoned quotes?"}
          </h1>
          <p className="lede">
            {fr
              ? "Estimateur libre-service : paniers / devis non payés → dollars exposés → gain Growth (relances + Paddle)."
              : "Self-serve checker: unpaid carts / quotes → dollars exposed → Growth lift (follow-ups + Paddle)."}
          </p>
        </div>

        <div className="roi-grid">
          <form className="roi-form" onSubmit={(e) => e.preventDefault()}>
            <label>
              {fr ? "Devis / paniers abandonnés / mois" : "Abandoned quotes / carts / month"}
              <input
                type="number"
                min={1}
                max={2000}
                value={abandoned}
                onChange={(e) => setAbandoned(Number(e.target.value) || 0)}
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
              {fr ? "Récupération actuelle (%)" : "Current recovery (%)"}
              <input
                type="number"
                min={0}
                max={100}
                value={recoverNow}
                onChange={(e) => setRecoverNow(Number(e.target.value) || 0)}
              />
            </label>
            <p className="roi-result__note">
              {fr
                ? `Twin Turbo estimé · volume ${result.volumeTurbo} · qualité ${result.qualityTurbo} · twin ${result.twinScore}`
                : `Twin Turbo est. · volume ${result.volumeTurbo} · quality ${result.qualityTurbo} · twin ${result.twinScore}`}
            </p>
          </form>

          <aside className="roi-result">
            <p className="roi-result__label">{fr ? "Exposé mensuel" : "Monthly exposed"}</p>
            <p className="roi-result__big">
              {Math.round(result.exposed).toLocaleString(fr ? "fr-CA" : "en-CA")} $
            </p>
            <p className="roi-result__row">
              <span>{fr ? "Récupéré aujourd’hui" : "Recovered today"}</span>
              <strong>
                {Math.round(result.recoveredNow).toLocaleString(fr ? "fr-CA" : "en-CA")} $
              </strong>
            </p>
            <p className="roi-result__row">
              <span>{fr ? "Avec relances Growth (~42 %)" : "With Growth follow-ups (~42%)"}</span>
              <strong>
                {Math.round(result.withSystem).toLocaleString(fr ? "fr-CA" : "en-CA")} $
              </strong>
            </p>
            <p className="roi-result__row">
              <span>{fr ? "Gain mensuel estimé" : "Est. monthly lift"}</span>
              <strong>
                {Math.round(result.lift).toLocaleString(fr ? "fr-CA" : "en-CA")} $
              </strong>
            </p>
            <div className="cta-row" style={{ marginTop: "1.1rem" }}>
              <a
                className="btn btn--primary"
                href={growthHref}
                rel="noopener noreferrer"
                target="_blank"
                onClick={() => trackInitiateCheckout({ plan: FEATURED_PLAN, value: PLANS[FEATURED_PLAN].amountCad })}
              >
                {fr
                  ? `Activer Growth — ${PLANS[FEATURED_PLAN].amountCad} $/mois`
                  : `Activate Growth — $${PLANS[FEATURED_PLAN].amountCad}/mo`}
              </a>
              <Link className="btn btn--ghost" to={path("/portail")}>
                {fr ? "Portail Master" : "Master Portal"}
              </Link>
            </div>
          </aside>
        </div>

        <form className="tools-capture" onSubmit={onSave}>
          <p className="tools-capture__title">
            {fr
              ? "Envoyer l’estimé → HubSpot (contact + deal scoré)"
              : "Send estimate → HubSpot (scored contact + deal)"}
          </p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="rp-prenom">{fr ? "Prénom" : "First name"}</label>
              <input id="rp-prenom" name="prenom" required autoComplete="given-name" />
            </div>
            <div className="field">
              <label htmlFor="rp-email">{fr ? "Courriel" : "Email"}</label>
              <input id="rp-email" name="email" type="email" required autoComplete="email" />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="rp-ent">{fr ? "Entreprise" : "Company"}</label>
              <input id="rp-ent" name="entreprise" autoComplete="organization" />
            </div>
            <div className="field">
              <label htmlFor="rp-tel">{fr ? "Téléphone" : "Phone"}</label>
              <input id="rp-tel" name="telephone" autoComplete="tel" inputMode="tel" />
            </div>
          </div>
          <button className="btn btn--primary" type="submit" disabled={pending}>
            {pending ? "…" : fr ? "Créer dans HubSpot" : "Create in HubSpot"}
          </button>
          {status === "ok" && (
            <p className="form-status form-status--ok">
              {fr
                ? `Reçu dans HubSpot${leadScore != null ? ` · score ${leadScore}` : ""}.`
                : `Saved to HubSpot${leadScore != null ? ` · score ${leadScore}` : ""}.`}{" "}
              <a href={growthHref}>{fr ? "Passer à Growth →" : "Go to Growth →"}</a>
            </p>
          )}
          {status === "err" && (
            <p className="form-status form-status--err">
              {fr ? "Envoi HubSpot impossible. Réessayez." : "HubSpot send failed. Retry."}
            </p>
          )}
        </form>

        <p className="lede" style={{ marginTop: "2rem" }}>
          <Link to={path("/outils")}>{fr ? "← Master Tools" : "← Master Tools"}</Link>
          {" · "}
          <Link to={path("/forfaits-cellulaire")}>
            {fr ? "Upsell Pack Cellulaire" : "Cellular Pack upsell"}
          </Link>
        </p>
      </div>
    </section>
  );
}
