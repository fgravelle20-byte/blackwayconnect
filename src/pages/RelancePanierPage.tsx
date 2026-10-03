import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { FEATURED_PLAN, PLANS, checkoutUrl } from "../stripeConfig";
import { trackInitiateCheckout, trackViewContent } from "../tracking";
import { copyHtmlAndText, copyText, followupHtml, followupSubject, followupText } from "../lib/clientMailHtml";
import { VENDOR_KEY, readPortalSession } from "../lib/portalSession";

type CartRow = { id: string; name: string; email: string; amount: number; payUrl: string };
type Vendor = { name: string; company: string; phone: string; email: string };

function loadVendor(): Vendor {
  const v: Vendor = { name: "", company: "", phone: "", email: "" };
  try {
    const raw = localStorage.getItem(VENDOR_KEY);
    if (raw) Object.assign(v, JSON.parse(raw) as Partial<Vendor>);
  } catch {
    /* ignore */
  }
  if (!v.email) v.email = readPortalSession()?.email || "";
  return v;
}

function newRow(): CartRow {
  return { id: crypto.randomUUID?.() || String(Date.now()), name: "", email: "", amount: 1800, payUrl: "" };
}

/** Relance : messages prêts à coller dans Gmail — leur marque, leur lien. */
export function RelancePanierPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const [vendor] = useState(loadVendor);
  const [vendorName, setVendorName] = useState(vendor.name);
  const [vendorCompany, setVendorCompany] = useState(vendor.company);
  const [vendorPhone, setVendorPhone] = useState(vendor.phone);
  const [vendorEmail, setVendorEmail] = useState(vendor.email);
  const [rows, setRows] = useState<CartRow[]>(() => [newRow()]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [abandoned, setAbandoned] = useState(12);
  const [ticket, setTicket] = useState(1800);
  const [recoverNow, setRecoverNow] = useState(8);

  useEffect(() => {
    trackViewContent({ name: "Relance panier", id: "tool_relance_panier", value: PLANS[FEATURED_PLAN].amountCad });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        VENDOR_KEY,
        JSON.stringify({ name: vendorName, company: vendorCompany, phone: vendorPhone, email: vendorEmail } satisfies Vendor),
      );
    } catch {
      /* ignore */
    }
  }, [vendorName, vendorCompany, vendorPhone, vendorEmail]);

  const result = useMemo(() => {
    const exposed = abandoned * ticket;
    const recoveredNow = exposed * (Math.min(100, Math.max(0, recoverNow)) / 100);
    const withSystem = exposed * 0.42;
    const lift = Math.max(0, withSystem - recoveredNow);
    return { exposed, recoveredNow, withSystem, lift };
  }, [abandoned, ticket, recoverNow]);

  const growthHref = checkoutUrl(FEATURED_PLAN, {
    lang,
    source: "tool_relance_panier",
    content: "growth_cta",
  });

  function mailFor(row: CartRow) {
    return {
      fr,
      vendorName,
      vendorCompany,
      vendorPhone,
      vendorEmail,
      buyerName: row.name,
      amountCad: row.amount,
      payUrl: row.payUrl,
    };
  }

  async function copyRow(row: CartRow, mode: "html" | "text") {
    const p = mailFor(row);
    const html = followupHtml(p);
    const text = followupText(p);
    const ok = mode === "html" ? await copyHtmlAndText(html, text) : await copyText(text);
    if (ok) {
      setCopiedId(`${row.id}-${mode}`);
      window.setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function patch(id: string, patch: Partial<CartRow>) {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <section className="section section--page section--tools">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">{fr ? "Outils de travail · Relance panier" : "Master Tools · Cart recovery"}</p>
          <h1 className="display page-hero__title">
            {fr ? "2 minutes : le courriel de relance, prêt à coller." : "2 minutes: the follow-up email, ready to paste."}
          </h1>
          <p className="lede">
            {fr
              ? "Préparez votre relance avec le nom de votre entreprise et vos instructions de paiement. Copiez le message au format HTML ou texte, puis envoyez-le depuis votre messagerie."
              : "Your clients, your name, YOUR payment link. Copy HTML or text — paste into Gmail. We don’t send for you."}
          </p>
        </div>

        <div className="roi-form">
          <label>
            {fr ? "Votre prénom (signature)" : "Your first name (sign-off)"}
            <input value={vendorName} onChange={(e) => setVendorName(e.target.value)} />
          </label>
          <label>
            {fr ? "Votre entreprise" : "Your company"}
            <input value={vendorCompany} onChange={(e) => setVendorCompany(e.target.value)} />
          </label>
          <label>
            {fr ? "Votre téléphone" : "Your phone"}
            <input value={vendorPhone} onChange={(e) => setVendorPhone(e.target.value)} inputMode="tel" />
          </label>
          <label>
            {fr ? "Votre courriel" : "Your email"}
            <input value={vendorEmail} onChange={(e) => setVendorEmail(e.target.value)} type="email" />
          </label>
        </div>

        {rows.map((row, i) => {
          const p = mailFor(row);
          const html = followupHtml(p);
          return (
            <article key={row.id} className="tools-panel" style={{ marginTop: i === 0 ? 0 : "1rem" }}>
              <p className="tools-capture__title">
                {fr ? `Panier ${i + 1}` : `Cart ${i + 1}`}
              </p>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor={`rp-name-${row.id}`}>{fr ? "Nom du client" : "Client name"}</label>
                  <input id={`rp-name-${row.id}`} value={row.name} onChange={(e) => patch(row.id, { name: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor={`rp-email-${row.id}`}>{fr ? "Courriel du client" : "Client email"}</label>
                  <input
                    id={`rp-email-${row.id}`}
                    type="email"
                    value={row.email}
                    onChange={(e) => patch(row.id, { email: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor={`rp-amount-${row.id}`}>{fr ? "Montant CAD" : "Amount CAD"}</label>
                  <input
                    id={`rp-amount-${row.id}`}
                    type="number"
                    min={0}
                    value={row.amount}
                    onChange={(e) => patch(row.id, { amount: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="field">
                  <label htmlFor={`rp-pay-${row.id}`}>
                    {fr ? "Votre lien ou instruction de paiement" : "Your payment link or instruction"}
                  </label>
                  <input
                    id={`rp-pay-${row.id}`}
                    value={row.payUrl}
                    onChange={(e) => patch(row.id, { payUrl: e.target.value })}
                    placeholder={fr ? "https://… ou Interac à paiement@votreentreprise.ca" : "https://… or e-transfer to pay@yourshop.ca"}
                  />
                </div>
              </div>
              <div className="cta-row no-print">
                <button type="button" className="btn btn--primary" onClick={() => copyRow(row, "html")}>
                  {copiedId === `${row.id}-html` ? (fr ? "Copié" : "Copied") : fr ? "Copier le HTML" : "Copy HTML"}
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => copyRow(row, "text")}>
                  {copiedId === `${row.id}-text` ? (fr ? "Copié" : "Copied") : fr ? "Copier le texte" : "Copy text"}
                </button>
                {row.email.trim() ? (
                  <a
                    className="btn btn--ghost"
                    href={`mailto:${encodeURIComponent(row.email.trim())}?subject=${encodeURIComponent(followupSubject(p))}&body=${encodeURIComponent(followupText(p))}`}
                  >
                    {fr ? "Ouvrir dans ma messagerie" : "Open in my mail app"}
                  </a>
                ) : null}
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setPreviewId(previewId === row.id ? null : row.id)}
                >
                  {fr ? "Aperçu" : "Preview"}
                </button>
                {rows.length > 1 ? (
                  <button type="button" className="btn btn--ghost" onClick={() => setRows((l) => l.filter((r) => r.id !== row.id))}>
                    {fr ? "Retirer" : "Remove"}
                  </button>
                ) : null}
              </div>
              {previewId === row.id ? (
                <iframe title={`preview-${row.id}`} className="mail-preview" sandbox="" srcDoc={html} />
              ) : null}
              <pre className="quote-preview">{followupText(p)}</pre>
            </article>
          );
        })}

        {rows.length < 8 ? (
          <button type="button" className="btn btn--ghost no-print"  onClick={() => setRows((l) => [...l, newRow()])}>
            {fr ? "+ Autre panier" : "+ Another cart"}
          </button>
        ) : null}

        <div className="roi-grid">
          <form className="roi-form" onSubmit={(e) => e.preventDefault()}>
            <p className="tools-capture__title">{fr ? "Estimateur (optionnel)" : "Estimator (optional)"}</p>
            <label>
              {fr ? "Devis abandonnés / mois" : "Abandoned quotes / month"}
              <input type="number" min={1} value={abandoned} onChange={(e) => setAbandoned(Number(e.target.value) || 0)} />
            </label>
            <label>
              {fr ? "Ticket moyen (CAD)" : "Avg ticket (CAD)"}
              <input type="number" min={50} value={ticket} onChange={(e) => setTicket(Number(e.target.value) || 0)} />
            </label>
            <label>
              {fr ? "Récupération actuelle (%)" : "Current recovery (%)"}
              <input type="number" min={0} max={100} value={recoverNow} onChange={(e) => setRecoverNow(Number(e.target.value) || 0)} />
            </label>
          </form>
          <aside className="roi-result">
            <p className="roi-result__label">{fr ? "Exposé mensuel" : "Monthly exposed"}</p>
            <p className="roi-result__big">{Math.round(result.exposed).toLocaleString(fr ? "fr-CA" : "en-CA")} $</p>
            <p className="roi-result__row">
              <span>{fr ? "Gain si vous relances (~42 %)" : "Lift if you follow up (~42%)"}</span>
              <strong>{Math.round(result.lift).toLocaleString(fr ? "fr-CA" : "en-CA")} $</strong>
            </p>
          </aside>
        </div>

        <div className="cta-row no-print">
          <a
            className="btn btn--ghost"
            href={growthHref}
            rel="noopener noreferrer"
            target="_blank"
            onClick={() => trackInitiateCheckout({ plan: FEATURED_PLAN, value: PLANS[FEATURED_PLAN].amountCad })}
          >
            {fr ? `BlackWay Growth — ${PLANS[FEATURED_PLAN].amountCad} $/mois` : `BlackWay Growth — $${PLANS[FEATURED_PLAN].amountCad}/mo`}
          </a>
          <Link className="btn btn--ghost" to={path("/portail")}>
            {fr ? "Portail Master" : "Master Portal"}
          </Link>
        </div>

        <p className="lede">
          <Link to={path("/outils")}>{fr ? "← Outils de travail" : "← Master Tools"}</Link>
        </p>
      </div>
    </section>
  );
}
