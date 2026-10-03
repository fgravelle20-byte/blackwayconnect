import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";

type Lead = {
  id: string;
  created_at: string;
  entreprise: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  market: string;
  marketLabel: string;
  grade: string;
  score: number;
  slaMinutes: number;
  sla_due: string;
  stage: string;
  industrie: string;
  taille: string;
  intent: string;
  message: string;
  briefing: string;
  notes?: { at: string; body: string }[];
  machine?: {
    next_action?: string;
    checkout?: string;
    script?: { channel?: string; subject?: string; body?: string };
    touches?: number;
  };
};

type Board = {
  ok?: boolean;
  erreur?: string;
  counts?: Record<string, number> & { by_market?: Record<string, number> };
  leads?: Lead[];
};

const STAGES = [
  { id: "inbox", fr: "Inbox", en: "Inbox" },
  { id: "contacted", fr: "Contacté", en: "Contacted" },
  { id: "qualified", fr: "Qualifié", en: "Qualified" },
  { id: "booked", fr: "RDV", en: "Booked" },
  { id: "won", fr: "Gagné", en: "Won" },
  { id: "lost", fr: "Perdu", en: "Lost" },
  { id: "leak", fr: "Fuite", en: "Leak" },
  { id: "archive", fr: "Archive", en: "Archive" },
];

const KEY_STORE = "bw_ops_key";

export function MasterCrmPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY_STORE) || "");
  const [email, setEmail] = useState("serviceclient@blackwayconnect.com");
  const [password, setPassword] = useState("");
  const [board, setBoard] = useState<Board | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [signing, setSigning] = useState(false);
  const [filter, setFilter] = useState({ market: "", grade: "", stage: "" });
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [engine, setEngine] = useState<{ at?: string | null; acted?: number; scanned?: number } | null>(null);

  async function load(opsKey = key) {
    const q = new URLSearchParams();
    if (filter.market) q.set("market", filter.market);
    if (filter.grade) q.set("grade", filter.grade);
    if (filter.stage) q.set("stage", filter.stage);
    const headers: Record<string, string> = {};
    if (opsKey) headers["X-BW-Key"] = opsKey;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(`/api/crm/leads?${q}`, {
        headers,
        credentials: "include",
        signal: ctrl.signal,
      });
      const data = (await res.json()) as Board;
      if (!res.ok) {
        setBoard(null);
        return false;
      }
      if (opsKey) sessionStorage.setItem(KEY_STORE, opsKey);
      setKey(opsKey);
      setBoard(data);
      void fetch("/api/crm/engine", { headers, credentials: "include" })
        .then((r) => r.json())
        .then((e) => setEngine(e as { at?: string | null; acted?: number; scanned?: number }))
        .catch(() => undefined);
      return true;
    } catch {
      setBoard(null);
      return false;
    } finally {
      window.clearTimeout(timer);
    }
  }

  async function runEngine() {
    setBusy(true);
    try {
      const headers: Record<string, string> = {};
      if (key) headers["X-BW-Key"] = key;
      const res = await fetch("/api/crm/engine", { method: "POST", headers, credentials: "include" });
      const data = (await res.json()) as { at?: string; acted?: number; scanned?: number };
      if (res.ok) setEngine(data);
      await load();
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.market, filter.grade, filter.stage]);

  async function login(ev: React.FormEvent) {
    ev.preventDefault();
    const courriel = email.trim().toLowerCase();
    const mdp = password.trim();
    if (!courriel || !mdp) {
      setErr(fr ? "Écris le mot de passe, puis clique." : "Enter the password, then click.");
      return;
    }
    setSigning(true);
    setErr("");
    try {
      const res = await fetch("/api/crm/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: courriel, password: mdp }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; erreur?: string };
      if (!res.ok) {
        setErr(data.erreur || (fr ? "Courriel ou mot de passe invalide" : "Invalid email or password"));
        return;
      }
      const ok = await load("");
      if (!ok) setErr(fr ? "Connecté, mais le CRM n’a pas chargé. Réessaie." : "Signed in, but CRM did not load. Retry.");
    } catch {
      setErr(fr ? "Connexion impossible. Réessaie." : "Login failed. Retry.");
    } finally {
      setSigning(false);
    }
  }

  async function move(id: string, stage: string) {
    setBusy(true);
    try {
      await fetch(`/api/crm/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(key ? { "X-BW-Key": key } : {}) },
        credentials: "include",
        body: JSON.stringify({ stage, note: note.trim() || undefined }),
      });
      setNote("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const leads = board?.leads || [];
  const counts = board?.counts;
  const openLead = useMemo(() => leads.find((l) => l.id === open) || null, [leads, open]);

  if (!board) {
    return (
      <section className="section section--page">
        <div className="shell">
          <p className="eyebrow">MASTER CRM</p>
          <h1 className="display page-hero__title">BlackWayConnect</h1>
            <p className="lede">
              {fr
                ? "Connexion propriétaire. Courriel BlackWayConnect + mot de passe opérateur."
                : "Owner login. BlackWayConnect email + operator password."}
            </p>
          <form className="form" onSubmit={login}>
            <div className="field">
              <label htmlFor="email">{fr ? "Courriel" : "Email"}</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="ops">{fr ? "Mot de passe" : "Password"}</label>
              <input
                id="ops"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn btn--primary" type="submit" disabled={signing}>
              {signing
                ? fr
                  ? "Connexion…"
                  : "Signing in…"
                : fr
                  ? "Entrer dans le CRM"
                  : "Enter CRM"}
            </button>
            {err ? <p className="form-status form-status--err">{err}</p> : null}
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="section section--page crm-page">
      <div className="shell shell--wide">
        <div className="page-hero">
          <p className="eyebrow">BLACKWAY · MASTER LEADS & CRM</p>
          <h1 className="display page-hero__title">
            {fr ? "Votre suivi commercial centralisé." : "The leads brain. Here."}
          </h1>
          <p className="lede">
            {fr
              ? "Entreprises · Canada, USA, Europe, monde. Score chirurgical. SLA. Pas HubSpot."
              : "Companies · Canada, USA, Europe, world. Surgical score. SLA. Not HubSpot."}
          </p>
        </div>

        <div className="crm-stats">
          {[
            ["total", fr ? "Leads" : "Leads"],
            ["king", "KING"],
            ["surgical", "SURGICAL"],
            ["inbox", "Inbox"],
            ["qualified", fr ? "Qualifiés" : "Qualified"],
            ["won", fr ? "Gagnés" : "Won"],
            ["leak", fr ? "Fuites" : "Leaks"],
          ].map(([k, label]) => (
            <div key={k} className="crm-stat">
              <strong>{counts?.[k] ?? 0}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {counts?.by_market ? (
          <p className="crm-markets">
            {Object.entries(counts.by_market)
              .map(([m, n]) => `${m} ${n}`)
              .join(" · ")}
          </p>
        ) : null}

        <div className="crm-filters">
          <select value={filter.market} onChange={(e) => setFilter((f) => ({ ...f, market: e.target.value }))}>
            <option value="">{fr ? "Tous marchés" : "All markets"}</option>
            {["CA", "US", "EU", "UK", "LATAM", "APAC", "WORLD"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select value={filter.grade} onChange={(e) => setFilter((f) => ({ ...f, grade: e.target.value }))}>
            <option value="">{fr ? "Tous grades" : "All grades"}</option>
            {["KING", "SURGICAL", "WARM", "REJECT"].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select value={filter.stage} onChange={(e) => setFilter((f) => ({ ...f, stage: e.target.value }))}>
            <option value="">{fr ? "Toutes étapes" : "All stages"}</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {fr ? s.fr : s.en}
              </option>
            ))}
          </select>
          <button className="btn btn--ghost" type="button" onClick={() => void load()} disabled={busy}>
            {fr ? "Rafraîchir" : "Refresh"}
          </button>
          <button className="btn btn--primary" type="button" onClick={() => void runEngine()} disabled={busy}>
            {fr ? "Lancer le moteur" : "Run engine"}
          </button>
          <span className="crm-sub">
            {engine?.at
              ? `${fr ? "Tick" : "Tick"} ${engine.acted ?? 0}/${engine.scanned ?? 0}`
              : fr
                ? "Moteur: aucun tick encore (cron 15 min)"
                : "Engine: no tick yet (15m cron)"}
          </span>
          <Link className="btn btn--ghost" to={path("/leads")}>
            {fr ? "Page prospects publique" : "Public leads page"}
          </Link>
        </div>

        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Grade</th>
                <th>{fr ? "Entreprise" : "Company"}</th>
                <th>{fr ? "Marché" : "Market"}</th>
                <th>Score</th>
                <th>SLA</th>
                <th>{fr ? "Étape" : "Stage"}</th>
                <th>{fr ? "Moteur" : "Engine"}</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} onClick={() => setOpen(l.id)} className={open === l.id ? "is-open" : ""}>
                  <td>
                    <span className={`crm-grade crm-grade--${l.grade.toLowerCase()}`}>{l.grade}</span>
                  </td>
                  <td>
                    <strong>{l.entreprise}</strong>
                    <div className="crm-sub">
                      {l.prenom} {l.nom} · {l.email}
                    </div>
                  </td>
                  <td>{l.market}</td>
                  <td>{l.score}</td>
                  <td>{l.slaMinutes}m</td>
                  <td>{l.stage}</td>
                  <td>{l.machine?.next_action || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!leads.length ? (
            <p className="crm-empty">{fr ? "Aucun prospect encore. La page /prospects envoie ici." : "No leads yet. /leads sends here."}</p>
          ) : null}
        </div>

        {openLead ? (
          <aside className="crm-drawer">
            <h2>
              {openLead.entreprise} · {openLead.grade} {openLead.score}
            </h2>
            <p>
              {openLead.prenom} {openLead.nom}
              <br />
              {openLead.email} · {openLead.telephone}
              <br />
              {openLead.marketLabel} · {openLead.industrie} · {openLead.taille}
            </p>
            <pre className="crm-brief">{openLead.briefing}</pre>
            {openLead.machine?.script ? (
              <pre className="crm-brief">
                {openLead.machine.next_action}
                {"\n"}
                {openLead.machine.script.body}
                {"\n"}
                {openLead.machine.checkout}
              </pre>
            ) : null}
            <div className="field">
              <label htmlFor="note">{fr ? "Note interne" : "Internal note"}</label>
              <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="crm-stage-row">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`btn ${openLead.stage === s.id ? "btn--primary" : "btn--ghost"}`}
                  disabled={busy}
                  onClick={() => void move(openLead.id, s.id)}
                >
                  {fr ? s.fr : s.en}
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
