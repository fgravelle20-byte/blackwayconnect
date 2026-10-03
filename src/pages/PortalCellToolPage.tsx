import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLang } from "../i18n";
import { postLead } from "../lib/postLead";
import { checkoutUrl, isCheckoutReady, PLANS, type PlanKey } from "../stripeConfig";
import { cellulaireCheckoutUrl } from "../cellulaireConfig";

const STORAGE_KEY = "bw_portal_session";
const STREAK_KEY = "bw_cell_streak";
const FLEET_KEY = "bw_cell_fleet";
const LOCAL_LEADS_KEY = "bw_cell_pipeline_local";

type PortalSession = {
  token: string;
  email: string;
  forfait: string;
  forfaitWeb?: string | null;
  forfaitCellulaire?: string | null;
  exp: number;
};
type Mode = "pipeline" | "checkout" | "streak" | "fleet" | "merge";
type PortalLead = {
  id: string;
  name?: string;
  stage?: string;
  score?: number | null;
  forfait?: string | null;
  local?: boolean;
};

const PADDLE_FIELD_PLANS: PlanKey[] = ["grow_hub_launch", "grow_hub_growth", "grow_hub_scale"];
const PIPE_STAGES = ["inbox", "contacted", "qualified", "booked", "won", "lost"];

function readSession(): PortalSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as PortalSession;
    if (!s.token || !s.email || !s.exp || s.exp * 1000 < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function consecutiveStreak(days: string[]): number {
  const set = new Set(days);
  let n = 0;
  const cursor = new Date();
  for (;;) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (!set.has(key)) break;
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

export function PortalCellToolPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const loc = useLocation();
  const mode: Mode = loc.pathname.includes("cell-checkout")
    ? "checkout"
    : loc.pathname.includes("streak")
      ? "streak"
      : loc.pathname.includes("fleet")
        ? "fleet"
        : loc.pathname.includes("merge")
          ? "merge"
          : "pipeline";
  const [session, setSession] = useState<PortalSession | null>(null);
  const [leads, setLeads] = useState<PortalLead[]>([]);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");
  const [streak, setStreak] = useState<string[]>([]);
  const [fleet, setFleet] = useState<string[]>([]);
  const [member, setMember] = useState("");
  const [payPlan, setPayPlan] = useState<PlanKey>("grow_hub_growth");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = readSession();
    setSession(s);
    setStreak(readJson<string[]>(STREAK_KEY, []));
    setFleet(readJson<string[]>(FLEET_KEY, []));
    setLeads(readJson<PortalLead[]>(LOCAL_LEADS_KEY, []));
  }, [mode]);

  useEffect(() => {
    if (!session?.token || mode !== "pipeline") return;
    void (async () => {
      try {
        const res = await fetch("/api/portal/leads", { headers: { Authorization: `Bearer ${session.token}` } });
        const data = (await res.json()) as { leads?: PortalLead[] };
        const remote = data.leads || [];
        const local = readJson<PortalLead[]>(LOCAL_LEADS_KEY, []);
        const seen = new Set(remote.map((l) => l.id));
        setLeads([...remote, ...local.filter((l) => !seen.has(l.id))]);
      } catch {
        setLeads(readJson<PortalLead[]>(LOCAL_LEADS_KEY, []));
      }
    })();
  }, [session?.token, mode]);

  const payHref = useMemo(
    () => checkoutUrl(payPlan, { lang, source: "cell_checkout", content: "field" }),
    [lang, payPlan],
  );
  const cellContactHref = cellulaireCheckoutUrl("cell_fleet", { lang, source: "cell_checkout", content: "pack" });

  function persistLocalLeads(next: PortalLead[]) {
    const localOnly = next.filter((l) => l.local);
    localStorage.setItem(LOCAL_LEADS_KEY, JSON.stringify(localOnly));
    setLeads(next);
  }

  async function addPipelineLead(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const entreprise = String(fd.get("entreprise") || "").trim();
    const out = await postLead({
      prenom: name.split(" ")[0] || "Prospect",
      nom: name.split(" ").slice(1).join(" "),
      email,
      entreprise,
      telephone: String(fd.get("telephone") || ""),
      message: `bw_source=cell_pipeline | captured_by=${session?.email || "field"}`,
      forfait: "grow_hub_growth",
      source: "portail",
      langue: lang,
      bw_ref: "cell_pipeline",
    });
    setBusy(false);
    if (!out.ok) {
      setErr(out.error || (fr ? "Envoi CRM impossible" : "CRM send failed"));
      return;
    }
    const row: PortalLead = {
      id: `local-${Date.now()}`,
      name: entreprise || name || email,
      stage: "inbox",
      score: out.score ?? null,
      local: true,
    };
    persistLocalLeads([row, ...leads]);
    setStatus(fr ? "Lead envoyé au CRM BlackWay." : "Lead sent to BlackWay CRM.");
    e.currentTarget.reset();
  }

  function setStage(id: string, stage: string) {
    persistLocalLeads(leads.map((l) => (l.id === id ? { ...l, stage, local: l.local || true } : l)));
  }

  async function sendCheckout(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const entreprise = String(fd.get("entreprise") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const out = await postLead({
      prenom: String(fd.get("prenom") || "Prospect"),
      nom: "",
      email,
      entreprise,
      telephone: String(fd.get("telephone") || ""),
      message: `bw_source=cell_checkout | paddle=${payHref} | plan=${payPlan}`,
      forfait: payPlan,
      source: "portail",
      langue: lang,
      bw_ref: "cell_checkout",
    });
    if (out.ok) {
      setStatus(fr ? "Prospect envoyé au CRM. Copiez le lien Paddle Grow Hub." : "Prospect sent to CRM. Copy the Grow Hub Paddle link.");
      setErr("");
      e.currentTarget.reset();
      return;
    }
    setErr(out.error || (fr ? "Envoi impossible" : "Send failed"));
  }

  function checkin() {
    const day = todayKey();
    const next = streak[0] === day ? streak : [day, ...streak].slice(0, 60);
    setStreak(next);
    localStorage.setItem(STREAK_KEY, JSON.stringify(next));
    setStatus(fr ? `Présence ${day} enregistrée.` : `Check-in ${day} saved.`);
  }

  function addMember(e: FormEvent) {
    e.preventDefault();
    const email = member.trim().toLowerCase();
    if (!email.includes("@")) {
      setErr(fr ? "Courriel équipe invalide" : "Invalid team email");
      return;
    }
    const next = [...new Set([email, ...fleet])];
    setFleet(next);
    localStorage.setItem(FLEET_KEY, JSON.stringify(next));
    setMember("");
    setErr("");
  }

  function removeMember(email: string) {
    const next = fleet.filter((m) => m !== email);
    setFleet(next);
    localStorage.setItem(FLEET_KEY, JSON.stringify(next));
  }

  const titles: Record<Mode, { fr: string; en: string }> = {
    pipeline: { fr: "Suivi commercial mobile", en: "Mobile pipeline" },
    checkout: { fr: "Paiement du prospect", en: "Prospect checkout" },
    streak: { fr: "Suivi des activités", en: "Field streak" },
    fleet: { fr: "Gestion des équipes", en: "Fleet ops" },
    merge: { fr: "Synchronisation web et mobile", en: "Merge web + cellular" },
  };

  const run = consecutiveStreak(streak);

  return (
    <section className="section section--page">
      <div className="shell">
        <p className="eyebrow">PACK CELLULAIRE</p>
        <h1 className="display page-hero__title">{fr ? titles[mode].fr : titles[mode].en}</h1>
        <p className="lede">
          {session?.email
            ? session.email
            : fr
              ? "Mode terrain — connectez le portail pour lier le CRM du compte payant."
              : "Field mode — sign in to the portal to link the paying account CRM."}
        </p>
        {!session ? (
          <p className="cta-row">
            <Link className="btn btn--ghost" to={path("/portail")}>
              {fr ? "Connexion portail" : "Portal sign-in"}
            </Link>
          </p>
        ) : null}
        {err ? <p className="form-status form-status--err">{err}</p> : null}
        {status ? <p className="form-status form-status--ok">{status}</p> : null}

        {mode === "pipeline" ? (
          <>
            <form className="form" onSubmit={addPipelineLead}>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="entreprise">{fr ? "Entreprise" : "Company"}</label>
                  <input id="entreprise" name="entreprise" required />
                </div>
                <div className="field">
                  <label htmlFor="email">{fr ? "Courriel" : "Email"}</label>
                  <input id="email" name="email" type="email" required />
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="name">{fr ? "Contact" : "Contact"}</label>
                  <input id="name" name="name" />
                </div>
                <div className="field">
                  <label htmlFor="telephone">{fr ? "Téléphone" : "Phone"}</label>
                  <input id="telephone" name="telephone" />
                </div>
              </div>
              <button className="btn btn--primary" type="submit" disabled={busy}>
                {fr ? "Capturer → CRM BlackWay" : "Capture → BlackWay CRM"}
              </button>
            </form>
            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>{fr ? "Prospect" : "Lead"}</th>
                    <th>{fr ? "Étape" : "Stage"}</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.id}>
                      <td>{l.name || l.id}</td>
                      <td>
                        <select value={l.stage || "inbox"} onChange={(e) => setStage(l.id, e.target.value)}>
                          {PIPE_STAGES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{l.score ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!leads.length ? (
                <p className="crm-empty">
                  {fr
                    ? "Aucun prospect encore — capturez ci-dessus. Les dossiers du portail apparaissent après connexion."
                    : "No leads yet — capture above. Portal records appear after sign-in."}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {mode === "checkout" ? (
          <form className="form" onSubmit={sendCheckout}>
            <div className="field">
              <label htmlFor="payPlan">{fr ? "Lien Grow Hub (Paddle live)" : "Grow Hub link (live Paddle)"}</label>
              <select id="payPlan" value={payPlan} onChange={(e) => setPayPlan(e.target.value as PlanKey)}>
                {PADDLE_FIELD_PLANS.map((key) => (
                  <option key={key} value={key} disabled={!isCheckoutReady(key)}>
                    {key.replace("grow_hub_", "")} · {PLANS[key].amountCad} $ CAD
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="entreprise">{fr ? "Entreprise prospect" : "Prospect company"}</label>
              <input id="entreprise" name="entreprise" required />
            </div>
            <div className="field">
              <label htmlFor="email">{fr ? "Courriel prospect" : "Prospect email"}</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="prenom">{fr ? "Prénom" : "First name"}</label>
              <input id="prenom" name="prenom" />
            </div>
            <div className="field">
              <label htmlFor="telephone">{fr ? "Téléphone" : "Phone"}</label>
              <input id="telephone" name="telephone" />
            </div>
            <p className="lede">
              {fr
                ? "Ceci n’est pas un Pack Cellulaire. C’est le paiement en ligne Grow Hub Launch / Growth / Scale déjà en Paddle. Pack Cellulaire = demande ci-dessous."
                : "This is not a Cellular Pack. It is the live Grow Hub Launch / Growth / Scale Paddle checkout. Cellular Pack = request below."}
            </p>
            <p className="lede">
              {fr ? "Lien Paddle :" : "Paddle link:"} {payHref}
            </p>
            <div className="cta-row">
              <button className="btn btn--primary" type="submit">
                {fr ? "Envoyer au CRM + préparer le lien" : "Send to CRM + prepare link"}
              </button>
              <button className="btn btn--ghost" type="button" onClick={() => void navigator.clipboard.writeText(payHref)}>
                {fr ? "Copier le lien Paddle" : "Copy Paddle link"}
              </button>
              <a className="btn btn--ghost" href={payHref} rel="noopener noreferrer">
                {fr ? "Ouvrir /payer" : "Open /payer"}
              </a>
              <a className="btn btn--ghost" href={cellContactHref}>
                {fr ? "Demander Pack Cellulaire" : "Request Cellular Pack"}
              </a>
            </div>
          </form>
        ) : null}

        {mode === "streak" ? (
          <div>
            <p className="lede">
              {fr
                ? `Série en cours : ${run} jour(s) · Total enregistré : ${streak.length}`
                : `Current run: ${run} day(s) · Logged days: ${streak.length}`}
            </p>
            <button className="btn btn--primary" type="button" onClick={checkin}>
              {fr ? "Check-in aujourd’hui" : "Check in today"}
            </button>
            <ul className="lede">
              {streak.slice(0, 14).map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {mode === "fleet" ? (
          <form className="form" onSubmit={addMember}>
            <div className="field">
              <label htmlFor="member">{fr ? "Courriel équipier" : "Teammate email"}</label>
              <input id="member" value={member} onChange={(e) => setMember(e.target.value)} type="email" required />
            </div>
            <button className="btn btn--primary" type="submit">
              {fr ? "Ajouter à l’équipe" : "Add to team"}
            </button>
            <ul className="lede">
              {fleet.map((m) => (
                <li key={m}>
                  {m}{" "}
                  <button className="btn btn--ghost" type="button" onClick={() => removeMember(m)}>
                    {fr ? "Retirer" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
            {!fleet.length ? (
              <p className="crm-empty">{fr ? "Aucun équipier encore." : "No teammates yet."}</p>
            ) : null}
          </form>
        ) : null}

        {mode === "merge" ? (
          <div>
            <p className="lede">
              {fr
                ? `Compte : web ${session?.forfaitWeb || session?.forfait || "—"} · cellulaire ${session?.forfaitCellulaire || "—"}`
                : `Account: web ${session?.forfaitWeb || session?.forfait || "—"} · cellular ${session?.forfaitCellulaire || "—"}`}
            </p>
            <div className="cta-row">
              <Link className="btn btn--primary" to={path("/portail")}>
                {fr ? "Portail web" : "Web portal"}
              </Link>
              <Link className="btn btn--ghost" to={path("/portail/capture")}>
                Capture
              </Link>
              <Link className="btn btn--ghost" to={path("/portail/pipeline")}>
                Pipeline
              </Link>
              <Link className="btn btn--ghost" to={path("/grow-hub")}>
                Grow Hub
              </Link>
              <Link className="btn btn--ghost" to={path("/forfaits")}>
                {fr ? "Forfaits web" : "Web plans"}
              </Link>
              <Link className="btn btn--ghost" to={path("/forfaits-cellulaire")}>
                Pack Cellulaire
              </Link>
            </div>
          </div>
        ) : null}

        <p>
          <Link to={path("/portail")}>{fr ? "← Portail" : "← Portal"}</Link>
        </p>
      </div>
    </section>
  );
}
