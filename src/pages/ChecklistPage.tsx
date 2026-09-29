import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { FEATURED_PLAN, PLANS, checkoutUrl } from "../stripeConfig";
import { trackInitiateCheckout, trackLead, trackViewContent } from "../tracking";
import { postLead } from "../lib/postLead";
import { CHECKLIST_KEY } from "../lib/portalSession";

const OPS_FR = [
  "Formulaire site → CRM BlackWay en moins de 60 s",
  "Première relance planifiée (SMS ou courriel) sous 15 min",
  "Score lead visible dans le pipeline",
  "Soumission avec TON lien de paiement — pas un PDF mort",
  "Devis abandonné = 3 relances / 7 jours",
  "Paiement confirmé → Won + activation",
  "Portail Master ouvert (session)",
  "Pack Cellulaire évalué si l’équipe est sur le terrain",
];

const OPS_EN = [
  "Site form → BlackWay CRM in under 60s",
  "First follow-up scheduled within 15 min",
  "Lead score visible in the pipeline",
  "Quote with YOUR payment link — no dead PDFs",
  "Abandoned quote = 3 touches / 7 days",
  "Payment confirmed → Won + activation",
  "Master Portal session open",
  "Cellular Pack evaluated if the team is in the field",
];

const CLOSE_FR = [
  "Appel le jour même",
  "Devis envoyé sous 24 h",
  "Relance J+2",
  "Relance J+5",
  "Fermeture ou lost clair",
];

const CLOSE_EN = ["Same-day call", "Quote sent within 24h", "Follow-up day +2", "Follow-up day +5", "Won or clear lost"];

type Persist = {
  opsDone: string[];
  close: { id: string; text: string; done: boolean }[];
};

function loadPersist(fr: boolean): Persist {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    if (raw) return JSON.parse(raw) as Persist;
  } catch {
    /* ignore */
  }
  const seed = fr ? CLOSE_FR : CLOSE_EN;
  return {
    opsDone: [],
    close: seed.map((text, i) => ({ id: `c${i}`, text, done: false })),
  };
}

export function ChecklistPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const ops = fr ? OPS_FR : OPS_EN;

  const [opsDone, setOpsDone] = useState<string[]>([]);
  const [close, setClose] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    trackViewContent({ name: "Checklist lead magnet", id: "tool_checklist", value: PLANS[FEATURED_PLAN].amountCad });
    const p = loadPersist(fr);
    setOpsDone(p.opsDone);
    setClose(p.close.length ? p.close : loadPersist(fr).close);
    setReady(true);
  }, [fr]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify({ opsDone, close } satisfies Persist));
    } catch {
      /* ignore */
    }
  }, [opsDone, close, ready]);

  const growthHref = checkoutUrl(FEATURED_PLAN, {
    lang,
    source: "tool_checklist",
    content: "checklist_growth",
  });

  const opsPct = useMemo(
    () => Math.round((opsDone.filter((x) => ops.includes(x)).length / ops.length) * 100),
    [opsDone, ops],
  );
  const closePct = useMemo(() => {
    if (!close.length) return 0;
    return Math.round((close.filter((c) => c.done).length / close.length) * 100);
  }, [close]);

  function toggleOps(item: string) {
    setOpsDone((d) => (d.includes(item) ? d.filter((x) => x !== item) : [...d, item]));
  }

  async function onRemind(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    const out = await postLead({
      prenom: String(fd.get("prenom") || ""),
      nom: "",
      email: String(fd.get("email") || ""),
      entreprise: String(fd.get("entreprise") || ""),
      telephone: "",
      message: `bw_source=tool_checklist | ops=${opsPct}% | close=${closePct}%`.slice(0, 2000),
      forfait: FEATURED_PLAN,
      source: "campagne",
      urgence: "normal",
      langue: lang,
      bw_ref: "tool_checklist",
      answers: { tool: "checklist" },
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
          <p className="eyebrow">{fr ? "Master Tools · Checklist" : "Master Tools · Checklist"}</p>
          <h1 className="display page-hero__title">
            {fr ? "Coche. Imprime. Avance." : "Check. Print. Move."}
          </h1>
          <p className="lede">
            {fr
              ? `Ops BlackWay ${opsPct} % · ta fermeture 7 jours ${closePct} %. Rien n’est derrière un mur email.`
              : `BlackWay ops ${opsPct}% · your 7-day close ${closePct}%. Nothing behind an email wall.`}
          </p>
        </div>

        <div className="tools-panel" style={{ marginTop: 0, borderTop: "none", paddingTop: 0 }}>
          <h2>{fr ? `Ops BlackWay · ${opsPct} %` : `BlackWay ops · ${opsPct}%`}</h2>
          <ul className="checklist-magnet checklist-magnet--boxes">
            {ops.map((item) => (
              <li key={item}>
                <label>
                  <input type="checkbox" checked={opsDone.includes(item)} onChange={() => toggleOps(item)} />
                  {item}
                </label>
              </li>
            ))}
          </ul>

          <h2 style={{ marginTop: "2rem" }}>{fr ? `Ta fermeture 7 jours · ${closePct} %` : `Your 7-day close · ${closePct}%`}</h2>
          <ul className="checklist-magnet checklist-magnet--boxes">
            {close.map((row) => (
              <li key={row.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={row.done}
                    onChange={() =>
                      setClose((list) => list.map((c) => (c.id === row.id ? { ...c, done: !c.done } : c)))
                    }
                  />
                  {row.text}
                </label>
                <button
                  type="button"
                  className="btn btn--ghost no-print"
                  style={{ marginLeft: "0.5rem" }}
                  onClick={() => setClose((list) => list.filter((c) => c.id !== row.id))}
                >
                  {fr ? "Retirer" : "Remove"}
                </button>
              </li>
            ))}
          </ul>
          <div className="cta-row no-print" style={{ marginTop: "1rem" }}>
            <input
              className="checklist-add"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const t = draft.trim();
                if (!t) return;
                setClose((list) => [...list, { id: crypto.randomUUID?.() || String(Date.now()), text: t, done: false }]);
                setDraft("");
              }}
              placeholder={fr ? "Nouvelle ligne" : "New line"}
            />
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                const t = draft.trim();
                if (!t) return;
                setClose((list) => [...list, { id: crypto.randomUUID?.() || String(Date.now()), text: t, done: false }]);
                setDraft("");
              }}
            >
              {fr ? "Ajouter" : "Add"}
            </button>
            <button type="button" className="btn btn--primary" onClick={() => window.print()}>
              {fr ? "Imprimer / PDF" : "Print / PDF"}
            </button>
          </div>
        </div>

        <form className="tools-capture no-print" onSubmit={onRemind}>
          <p className="tools-capture__title">{fr ? "Rappel par courriel (optionnel)" : "Email reminder (optional)"}</p>
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
            {pending ? "…" : fr ? "M’envoyer un rappel" : "Send me a reminder"}
          </button>
          {status === "ok" && <p className="form-status form-status--ok">{fr ? "Reçu." : "Received."}</p>}
          {status === "err" && <p className="form-status form-status--err">{fr ? "Envoi impossible." : "Could not send."}</p>}
        </form>

        <div className="cta-row no-print" style={{ marginTop: "1.5rem" }}>
          <a
            className="btn btn--ghost"
            href={growthHref}
            rel="noopener noreferrer"
            target="_blank"
            onClick={() => trackInitiateCheckout({ plan: FEATURED_PLAN, value: PLANS[FEATURED_PLAN].amountCad })}
          >
            {fr
              ? `BlackWay Growth — ${PLANS[FEATURED_PLAN].amountCad} $/mois`
              : `BlackWay Growth — $${PLANS[FEATURED_PLAN].amountCad}/mo`}
          </a>
          <Link className="btn btn--ghost" to={path("/outils")}>
            {fr ? "← Master Tools" : "← Master Tools"}
          </Link>
        </div>
      </div>
    </section>
  );
}
