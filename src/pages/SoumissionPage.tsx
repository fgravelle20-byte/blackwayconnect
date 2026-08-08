import { useEffect, useMemo, useState, type FormEvent } from "react";
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

/** Quote / proposal generator → copy text + Stripe Growth link. */
export function SoumissionPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";

  const [client, setClient] = useState("");
  const [service, setService] = useState(fr ? "Installation / mandat" : "Install / retainer");
  const [amount, setAmount] = useState(4500);
  const [delay, setDelay] = useState(fr ? "14 jours" : "14 days");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    trackViewContent({ name: "Générateur soumission", id: "tool_soumission", value: PLANS[FEATURED_PLAN].amountCad });
  }, []);

  const payLink = checkoutUrl(FEATURED_PLAN, {
    lang,
    source: "tool_soumission",
    content: "quote_demo_pay",
  });

  const proposal = useMemo(() => {
    const who = client.trim() || (fr ? "[Client]" : "[Client]");
    const svc = service.trim() || (fr ? "[Service]" : "[Service]");
    const amt = amount.toLocaleString(fr ? "fr-CA" : "en-CA");
    const extra = notes.trim();
    if (fr) {
      return [
        `SOUMISSION — BlackWayConnect`,
        ``,
        `À l’attention de : ${who}`,
        `Objet : ${svc}`,
        `Montant : ${amt} $ CAD`,
        `Validité : ${delay}`,
        extra ? `Notes : ${extra}` : null,
        ``,
        `Prochaine étape : confirmer et payer via le lien sécurisé ci-dessous.`,
        `Paiement / activation Grow Hub : ${payLink}`,
        ``,
        `— Équipe BlackWayConnect · serviceclient@blackwayconnect.com`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    return [
      `PROPOSAL — BlackWayConnect`,
      ``,
      `Attention: ${who}`,
      `Scope: ${svc}`,
      `Amount: $${amt} CAD`,
      `Valid: ${delay}`,
      extra ? `Notes: ${extra}` : null,
      ``,
      `Next step: confirm and pay via the secure link below.`,
      `Payment / Grow Hub activation: ${payLink}`,
      ``,
      `— BlackWayConnect team · serviceclient@blackwayconnect.com`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [client, service, amount, delay, notes, fr, payLink]);

  async function copyProposal() {
    try {
      await navigator.clipboard.writeText(proposal);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    const summary = [
      "bw_source=tool_soumission",
      `client=${client || "-"}`,
      `service=${service}`,
      `amount=${amount}`,
      `delay=${delay}`,
    ].join(" | ");
    const ok = await postLead({
      prenom: String(fd.get("prenom") || ""),
      nom: "",
      email: String(fd.get("email") || ""),
      entreprise: String(fd.get("entreprise") || client || ""),
      telephone: "",
      message: `${summary}\n\n${proposal}`.slice(0, 2000),
      forfait: FEATURED_PLAN,
      source: "campagne",
      urgence: amount >= 5000 ? "elevee" : "normal",
      langue: lang,
      bw_ref: "tool_soumission",
    });
    if (ok) trackLead();
    setStatus(ok ? "ok" : "err");
    setPending(false);
    if (ok) e.currentTarget.reset();
  }

  return (
    <section className="section section--page section--tools">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">{fr ? "Master Tools · Soumission" : "Master Tools · Quote"}</p>
          <h1 className="display page-hero__title">
            {fr ? "Générateur de soumission → lien Stripe" : "Quote generator → Stripe link"}
          </h1>
          <p className="lede">
            {fr
              ? "Rédigez une soumission propre, copiez-la, et poussez le paiement vers Growth (499 $/mois) — même fil que le Portail."
              : "Draft a clean quote, copy it, and push payment toward Growth ($499/mo) — same thread as the Portal."}
          </p>
        </div>

        <div className="roi-grid">
          <form className="roi-form" onSubmit={(e) => e.preventDefault()}>
            <label>
              {fr ? "Nom du client" : "Client name"}
              <input value={client} onChange={(e) => setClient(e.target.value)} placeholder={fr ? "Entreprise ABC" : "ABC Co."} />
            </label>
            <label>
              {fr ? "Service / mandat" : "Service / scope"}
              <input value={service} onChange={(e) => setService(e.target.value)} />
            </label>
            <label>
              {fr ? "Montant (CAD)" : "Amount (CAD)"}
              <input
                type="number"
                min={50}
                max={500000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
              />
            </label>
            <label>
              {fr ? "Validité" : "Validity"}
              <input value={delay} onChange={(e) => setDelay(e.target.value)} />
            </label>
            <label>
              {fr ? "Notes (optionnel)" : "Notes (optional)"}
              <input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </form>

          <aside className="roi-result">
            <p className="roi-result__label">{fr ? "Aperçu soumission" : "Quote preview"}</p>
            <pre className="quote-preview">{proposal}</pre>
            <div className="cta-row" style={{ marginTop: "1.1rem" }}>
              <button type="button" className="btn btn--ghost" onClick={copyProposal}>
                {copied ? (fr ? "Copié" : "Copied") : fr ? "Copier le texte" : "Copy text"}
              </button>
              <a
                className="btn btn--primary"
                href={payLink}
                rel="noopener noreferrer"
                target="_blank"
                onClick={() => trackInitiateCheckout({ plan: FEATURED_PLAN, value: PLANS[FEATURED_PLAN].amountCad })}
              >
                {fr ? "Ouvrir lien Stripe Growth" : "Open Stripe Growth link"}
              </a>
            </div>
            <p className="roi-result__note">
              {fr
                ? "Démo : le lien active Grow Hub Growth. En production, vos clients paient depuis le Portail / Payment Links."
                : "Demo: link activates Grow Hub Growth. In production, clients pay from Portal / Payment Links."}
            </p>
          </aside>
        </div>

        <form className="tools-capture" onSubmit={onSave}>
          <p className="tools-capture__title">
            {fr
              ? "Envoyer cette soumission à l’équipe (suivi CRM)"
              : "Send this quote to the team (CRM follow-up)"}
          </p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="sq-prenom">{fr ? "Prénom" : "First name"}</label>
              <input id="sq-prenom" name="prenom" required autoComplete="given-name" />
            </div>
            <div className="field">
              <label htmlFor="sq-email">{fr ? "Courriel" : "Email"}</label>
              <input id="sq-email" name="email" type="email" required autoComplete="email" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="sq-ent">{fr ? "Votre entreprise" : "Your company"}</label>
            <input id="sq-ent" name="entreprise" autoComplete="organization" />
          </div>
          <button className="btn btn--primary" type="submit" disabled={pending}>
            {pending ? "…" : fr ? "Capturer + suivre" : "Capture + follow up"}
          </button>
          {status === "ok" && (
            <p className="form-status form-status--ok">
              {fr ? "Reçu. Opportunité créée." : "Received. Opportunity created."}
            </p>
          )}
          {status === "err" && (
            <p className="form-status form-status--err">
              {fr ? "Envoi impossible. Réessayez." : "Could not send. Retry."}
            </p>
          )}
        </form>

        <p className="lede" style={{ marginTop: "2rem" }}>
          <Link to={path("/outils")}>{fr ? "← Master Tools" : "← Master Tools"}</Link>
          {" · "}
          <Link to={path("/portail")}>{fr ? "Portail Master" : "Master Portal"}</Link>
        </p>
      </div>
    </section>
  );
}
