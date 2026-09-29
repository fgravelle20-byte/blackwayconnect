import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { FEATURED_PLAN, PLANS, checkoutUrl } from "../stripeConfig";
import { trackInitiateCheckout, trackLead, trackViewContent } from "../tracking";
import { postLead } from "../lib/postLead";
import { copyText } from "../lib/clientMailHtml";
import { QUOTE_KEY, readPortalSession } from "../lib/portalSession";

type QuoteState = {
  vendorCompany: string;
  vendorPhone: string;
  vendorEmail: string;
  client: string;
  service: string;
  amount: number;
  delay: string;
  notes: string;
  payUrl: string;
};

/** Devis au nom du client BlackWay — pas le checkout Growth dans le corps. */
export function SoumissionPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const session = typeof window !== "undefined" ? readPortalSession() : null;

  const [vendorCompany, setVendorCompany] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorEmail, setVendorEmail] = useState(session?.email || "");
  const [client, setClient] = useState("");
  const [service, setService] = useState(fr ? "Installation / mandat" : "Install / retainer");
  const [amount, setAmount] = useState(4500);
  const [delay, setDelay] = useState(fr ? "14 jours" : "14 days");
  const [notes, setNotes] = useState("");
  const [payUrl, setPayUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [crm, setCrm] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    trackViewContent({ name: "Générateur soumission", id: "tool_soumission", value: PLANS[FEATURED_PLAN].amountCad });
    try {
      const raw = localStorage.getItem(QUOTE_KEY);
      if (!raw) return;
      const q = JSON.parse(raw) as QuoteState;
      if (q.vendorCompany) setVendorCompany(q.vendorCompany);
      if (q.vendorPhone) setVendorPhone(q.vendorPhone);
      if (q.vendorEmail) setVendorEmail(q.vendorEmail);
      if (q.client) setClient(q.client);
      if (q.service) setService(q.service);
      if (q.amount) setAmount(q.amount);
      if (q.delay) setDelay(q.delay);
      if (q.notes) setNotes(q.notes);
      if (q.payUrl) setPayUrl(q.payUrl);
    } catch {
      /* ignore */
    }
  }, []);

  const growthHref = checkoutUrl(FEATURED_PLAN, {
    lang,
    source: "tool_soumission",
    content: "quote_footer",
  });

  const payIsBlackWay = /blackwayconnect\.com|\/payer\b/i.test(payUrl);

  const proposal = useMemo(() => {
    const shop = vendorCompany.trim() || (fr ? "[Ton entreprise]" : "[Your company]");
    const who = client.trim() || (fr ? "[Client]" : "[Client]");
    const svc = service.trim() || (fr ? "[Service]" : "[Service]");
    const amt = amount.toLocaleString(fr ? "fr-CA" : "en-CA");
    const extra = notes.trim();
    const pay = payUrl.trim();
    const sign = [vendorEmail.trim(), vendorPhone.trim()].filter(Boolean).join(" · ");
    if (fr) {
      return [
        `SOUMISSION — ${shop}`,
        ``,
        `À l’attention de : ${who}`,
        `Objet : ${svc}`,
        `Montant : ${amt} $ CAD`,
        `Validité : ${delay}`,
        extra ? `Notes : ${extra}` : null,
        ``,
        pay ? `Paiement : ${pay}` : `Paiement : (ajoute ton lien Interac / facture / Paddle)`,
        ``,
        sign ? `— ${shop} · ${sign}` : `— ${shop}`,
      ]
        .filter((x) => x !== null)
        .join("\n");
    }
    return [
      `PROPOSAL — ${shop}`,
      ``,
      `Attention: ${who}`,
      `Scope: ${svc}`,
      `Amount: $${amt} CAD`,
      `Valid: ${delay}`,
      extra ? `Notes: ${extra}` : null,
      ``,
      pay ? `Payment: ${pay}` : `Payment: (add your e-transfer / invoice / Paddle link)`,
      ``,
      sign ? `— ${shop} · ${sign}` : `— ${shop}`,
    ]
      .filter((x) => x !== null)
      .join("\n");
  }, [vendorCompany, vendorEmail, vendorPhone, client, service, amount, delay, notes, payUrl, fr]);

  function persist() {
    const q: QuoteState = {
      vendorCompany,
      vendorPhone,
      vendorEmail,
      client,
      service,
      amount,
      delay,
      notes,
      payUrl,
    };
    try {
      localStorage.setItem(QUOTE_KEY, JSON.stringify(q));
    } catch {
      /* ignore */
    }
  }

  async function copyProposal() {
    persist();
    const ok = await copyText(proposal);
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 2000);
  }

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    persist();
    if (!crm) {
      setStatus("ok");
      return;
    }
    setPending(true);
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    const summary = [
      "bw_source=tool_soumission",
      `vendor=${vendorCompany || "-"}`,
      `client=${client || "-"}`,
      `service=${service}`,
      `amount=${amount}`,
      `delay=${delay}`,
    ].join(" | ");
    const out = await postLead({
      prenom: String(fd.get("prenom") || ""),
      nom: "",
      email: String(fd.get("email") || vendorEmail || ""),
      entreprise: vendorCompany || String(fd.get("entreprise") || ""),
      telephone: vendorPhone || String(fd.get("telephone") || ""),
      message: `${summary}\n\n${proposal}`.slice(0, 2000),
      forfait: FEATURED_PLAN,
      source: "campagne",
      urgence: amount >= 5000 ? "elevee" : "normal",
      langue: lang,
      bw_ref: "tool_soumission",
      answers: { tool: "soumission", client, service, amount, delay },
    });
    if (out.ok) {
      trackLead();
      setStatus("ok");
    } else {
      setStatus("err");
    }
    setPending(false);
  }

  return (
    <section className="section section--page section--tools">
      <div className="shell">
        <div className="page-hero no-print">
          <p className="eyebrow">{fr ? "Master Tools · Soumission" : "Master Tools · Quote"}</p>
          <h1 className="display page-hero__title">
            {fr ? "Devis à TON nom — imprimable en 2 minutes." : "Quote in YOUR name — printable in 2 minutes."}
          </h1>
          <p className="lede">
            {fr
              ? "Le lien de paiement est le tien. BlackWay n’est pas le vendeur sur ce papier."
              : "The payment link is yours. BlackWay is not the vendor on this paper."}
          </p>
        </div>

        <div className="roi-grid">
          <form className="roi-form no-print" onSubmit={(e) => e.preventDefault()}>
            <label>
              {fr ? "Ton entreprise" : "Your company"}
              <input value={vendorCompany} onChange={(e) => setVendorCompany(e.target.value)} />
            </label>
            <label>
              {fr ? "Ton courriel" : "Your email"}
              <input value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} />
            </label>
            <label>
              {fr ? "Ton téléphone" : "Your phone"}
              <input value={vendorPhone} onChange={(e) => setVendorPhone(e.target.value)} />
            </label>
            <label>
              {fr ? "Nom du client (leur client)" : "Client name (their customer)"}
              <input value={client} onChange={(e) => setClient(e.target.value)} placeholder={fr ? "Entreprise ABC" : "ABC Co."} />
            </label>
            <label>
              {fr ? "Service / mandat" : "Service / scope"}
              <input value={service} onChange={(e) => setService(e.target.value)} />
            </label>
            <label>
              {fr ? "Montant (CAD)" : "Amount (CAD)"}
              <input type="number" min={50} value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
            </label>
            <label>
              {fr ? "Validité" : "Validity"}
              <input value={delay} onChange={(e) => setDelay(e.target.value)} />
            </label>
            <label>
              {fr ? "Notes" : "Notes"}
              <input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <label>
              {fr ? "Ton lien de paiement" : "Your payment link"}
              <input
                value={payUrl}
                onChange={(e) => setPayUrl(e.target.value)}
                placeholder={fr ? "https://… (pas blackwayconnect.com/payer)" : "https://… (not blackwayconnect.com/payer)"}
              />
            </label>
            {payIsBlackWay ? (
              <p className="form-status form-status--err">
                {fr
                  ? "Ce lien est le checkout BlackWay. Ton client doit payer TON lien (Interac, facture, ton Paddle/Stripe)."
                  : "That's the BlackWay checkout. Your customer must pay YOUR link (e-transfer, invoice, your Paddle/Stripe)."}
              </p>
            ) : null}
          </form>

          <aside className="roi-result quote-print-root">
            <p className="roi-result__label no-print">{fr ? "Aperçu soumission" : "Quote preview"}</p>
            <pre className="quote-preview">{proposal}</pre>
            <div className="cta-row no-print" style={{ marginTop: "1.1rem" }}>
              <button type="button" className="btn btn--ghost" onClick={copyProposal}>
                {copied ? (fr ? "Copié" : "Copied") : fr ? "Copier le texte" : "Copy text"}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  persist();
                  window.print();
                }}
              >
                {fr ? "Imprimer / PDF" : "Print / PDF"}
              </button>
            </div>
          </aside>
        </div>

        <form className="tools-capture no-print" onSubmit={onSave}>
          <label className="field" style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <input type="checkbox" checked={crm} onChange={(e) => setCrm(e.target.checked)} />
            <span>{fr ? "Garder une copie dans Master CRM (optionnel)" : "Keep a copy in Master CRM (optional)"}</span>
          </label>
          {crm ? (
            <div className="form-grid">
              <div className="field">
                <label htmlFor="sq-prenom">{fr ? "Prénom" : "First name"}</label>
                <input id="sq-prenom" name="prenom" required autoComplete="given-name" />
              </div>
              <div className="field">
                <label htmlFor="sq-email">{fr ? "Courriel CRM" : "CRM email"}</label>
                <input id="sq-email" name="email" type="email" required autoComplete="email" defaultValue={vendorEmail} />
              </div>
            </div>
          ) : null}
          <button className="btn btn--primary" type="submit" disabled={pending}>
            {pending
              ? "…"
              : crm
                ? fr
                  ? "Enregistrer + copie Master CRM"
                  : "Save + Master CRM copy"
                : fr
                  ? "Enregistrer sur cet appareil"
                  : "Save on this device"}
          </button>
          {status === "ok" && (
            <p className="form-status form-status--ok">
              {crm
                ? fr
                  ? "Soumission enregistrée ici + copie dans Master CRM."
                  : "Quote saved here + copy in Master CRM."
                : fr
                  ? "Soumission enregistrée sur cet appareil."
                  : "Quote saved on this device."}
            </p>
          )}
          {status === "err" && (
            <p className="form-status form-status--err">{fr ? "Envoi CRM impossible." : "CRM send failed."}</p>
          )}
        </form>

        <div className="cta-row no-print" style={{ marginTop: "1.5rem" }}>
          <a
            className="btn btn--ghost"
            href={growthHref}
            rel="noopener noreferrer"
            target="_blank"
            onClick={() => trackInitiateCheckout({ plan: FEATURED_PLAN, value: PLANS[FEATURED_PLAN].amountCad })}
          >
            {fr ? "BlackWay Growth (toi, pas ton client)" : "BlackWay Growth (you, not your customer)"}
          </a>
          <Link className="btn btn--ghost" to={path("/outils")}>
            {fr ? "← Master Tools" : "← Master Tools"}
          </Link>
        </div>
      </div>
    </section>
  );
}
