import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { FEATURED_PLAN, PLANS, checkoutUrl } from "../stripeConfig";
import { trackInitiateCheckout, trackLead, trackViewContent } from "../tracking";

async function postLead(payload: Record<string, unknown>) {
  const res = await fetch("/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

const CHECKLIST_FR = [
  "Formulaire site → HubSpot en moins de 60 s",
  "Première relance planifiée (SMS ou courriel) sous 15 min",
  "Score lead (chaud / tiède / froid) visible dans le pipeline",
  "Soumission avec lien de paiement Stripe — pas de PDF mort",
  "Devis abandonné = séquence de relance 3 touches / 7 jours",
  "Paiement confirmé → étape Won + tâche d’activation",
  "Portail Client Master ouvert pour le client (session)",
  "Pack Cellulaire évalué si l’équipe est sur le terrain",
];

const CHECKLIST_EN = [
  "Site form → HubSpot in under 60s",
  "First follow-up scheduled (SMS or email) within 15 min",
  "Lead score (hot / warm / cold) visible in the pipeline",
  "Quote with Stripe payment link — no dead PDFs",
  "Abandoned quote = 3-touch / 7-day recovery sequence",
  "Payment confirmed → Won stage + activation task",
  "Client Master Portal opened for the client (session)",
  "Cellular Pack evaluated if the team is in the field",
];

/** Lead-magnet checklist gate → Growth + Portal. */
export function ChecklistPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const items = fr ? CHECKLIST_FR : CHECKLIST_EN;

  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    trackViewContent({ name: "Checklist lead magnet", id: "tool_checklist", value: PLANS[FEATURED_PLAN].amountCad });
  }, []);

  const growthHref = checkoutUrl(FEATURED_PLAN, {
    lang,
    source: "tool_checklist",
    content: "checklist_growth",
  });

  async function onUnlock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    const prenom = String(fd.get("prenom") || "");
    const email = String(fd.get("email") || "");
    const summary = [
      "bw_source=tool_checklist",
      "magnet=checklist_fermeture_7j",
      `items=${items.length}`,
    ].join(" | ");
    const ok = await postLead({
      prenom,
      nom: "",
      email,
      entreprise: String(fd.get("entreprise") || ""),
      telephone: "",
      message: summary.slice(0, 2000),
      forfait: FEATURED_PLAN,
      source: "campagne",
      urgence: "normal",
      langue: lang,
      bw_ref: "tool_checklist",
    });
    if (ok) {
      trackLead();
      setUnlocked(true);
      setStatus("ok");
    } else {
      setStatus("err");
    }
    setPending(false);
  }

  function printChecklist() {
    window.print();
  }

  return (
    <section className="section section--page section--tools">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">
            {fr ? "Master Tools · Lead magnet" : "Master Tools · Lead magnet"}
          </p>
          <h1 className="display page-hero__title">
            {fr
              ? "Checklist fermeture 7 jours — gratuit"
              : "7-day close checklist — free"}
          </h1>
          <p className="lede">
            {fr
              ? "Huit actions pour arrêter les fuites lead → paiement. Laissez un courriel pour débloquer et télécharger (impression PDF)."
              : "Eight actions to stop lead → payment leaks. Leave an email to unlock and download (print to PDF)."}
          </p>
        </div>

        {!unlocked ? (
          <form className="tools-capture" onSubmit={onUnlock} style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>
            <p className="tools-capture__title">
              {fr ? "Débloquer la checklist" : "Unlock the checklist"}
            </p>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="cl-prenom">{fr ? "Prénom" : "First name"}</label>
                <input id="cl-prenom" name="prenom" required autoComplete="given-name" />
              </div>
              <div className="field">
                <label htmlFor="cl-email">{fr ? "Courriel" : "Email"}</label>
                <input id="cl-email" name="email" type="email" required autoComplete="email" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="cl-ent">{fr ? "Entreprise" : "Company"}</label>
              <input id="cl-ent" name="entreprise" autoComplete="organization" />
            </div>
            <button className="btn btn--primary" type="submit" disabled={pending}>
              {pending ? "…" : fr ? "Recevoir la checklist" : "Get the checklist"}
            </button>
            {status === "err" && (
              <p className="form-status form-status--err">
                {fr ? "Envoi impossible. Réessayez." : "Could not send. Retry."}
              </p>
            )}
          </form>
        ) : (
          <div className="tools-panel" style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>
            <p className="form-status form-status--ok">
              {fr ? "Checklist débloquée. Imprimez en PDF si besoin." : "Checklist unlocked. Print to PDF if needed."}
            </p>
            <ol className="checklist-magnet">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <div className="cta-row" style={{ marginTop: "1.5rem" }}>
              <button type="button" className="btn btn--ghost" onClick={printChecklist}>
                {fr ? "Télécharger / imprimer PDF" : "Download / print PDF"}
              </button>
              <a
                className="btn btn--primary"
                href={growthHref}
                rel="noopener noreferrer"
                target="_blank"
                onClick={() => trackInitiateCheckout({ plan: FEATURED_PLAN, value: PLANS[FEATURED_PLAN].amountCad })}
              >
                {fr
                  ? `Automatiser avec Growth — ${PLANS[FEATURED_PLAN].amountCad} $/mois`
                  : `Automate with Growth — $${PLANS[FEATURED_PLAN].amountCad}/mo`}
              </a>
              <Link className="btn btn--ghost" to={path("/portail")}>
                {fr ? "Portail Master" : "Master Portal"}
              </Link>
            </div>
            <p className="lede" style={{ marginTop: "1.25rem" }}>
              <Link to={path("/forfaits-cellulaire")}>
                {fr ? "Équipe terrain ? Voir Pack Cellulaire →" : "Field team? See Cellular Pack →"}
              </Link>
            </p>
          </div>
        )}

        <p className="lede" style={{ marginTop: "2rem" }}>
          <Link to={path("/outils")}>{fr ? "← Master Tools" : "← Master Tools"}</Link>
          {" · "}
          <Link to={path("/diagnostic")}>{fr ? "Leak Score 60 s" : "60s Leak Score"}</Link>
        </p>
      </div>
    </section>
  );
}
