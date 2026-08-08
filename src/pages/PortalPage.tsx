import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useLang } from "../i18n";
import {
  CELLULAIRE_ORDER,
  CELLULAIRE_PLANS,
  cellulaireCheckoutUrl,
  cellulaireRank,
  isCellulaireForfait,
  type CellulairePlanKey,
} from "../cellulaireConfig";
import {
  CELL_PORTAL_TOOLS,
  PLAN_RANK,
  WEB_PORTAL_TOOLS,
  planRank,
  splitForfaits,
  toolUnlocked,
  type PortalTool,
  type PortalToolId,
} from "../portalTools";
import { PLANS, PLAN_ORDER, checkoutUrl, type PlanKey } from "../stripeConfig";

const STORAGE_KEY = "bw_portal_session";

type PortalSession = {
  token: string;
  email: string;
  forfait: string;
  forfaitWeb?: string | null;
  forfaitCellulaire?: string | null;
  label: string;
  labelCellulaire?: string | null;
  amountCad: number;
  amountCadCellulaire?: number;
  exp: number;
};

const TOOL_COPY: Partial<
  Record<PortalToolId, { fr: { title: string; body: string; cta: string }; en: { title: string; body: string; cta: string } }>
> = {
  diagnostic: {
    fr: { title: "Revenue Leak Score", body: "Diagnostic 60 s — fuites de revenu et forfait recommandé.", cta: "Lancer" },
    en: { title: "Revenue Leak Score", body: "60s diagnostic — revenue leaks and recommended plan.", cta: "Run" },
  },
  outils: {
    fr: { title: "Master Tools", body: "Arsenal : score, relance, soumission, ROI, secrétaire IA.", cta: "Ouvrir" },
    en: { title: "Master Tools", body: "Arsenal: score, recovery, quotes, ROI, AI secretary.", cta: "Open" },
  },
  relance_panier: {
    fr: { title: "Relance panier", body: "Devis abandonnés → $ récupérables → Growth.", cta: "Estimer" },
    en: { title: "Cart recovery", body: "Abandoned quotes → recoverable $ → Growth.", cta: "Estimate" },
  },
  soumission: {
    fr: { title: "Soumission → Stripe", body: "Générer une soumission + lien paiement Growth.", cta: "Créer" },
    en: { title: "Quote → Stripe", body: "Generate a quote + Growth payment link.", cta: "Create" },
  },
  checklist: {
    fr: { title: "Checklist 7 jours", body: "Lead magnet — actions pour fermer sans fuite.", cta: "Ouvrir" },
    en: { title: "7-day checklist", body: "Lead magnet — actions to close without leakage.", cta: "Open" },
  },
  roi: {
    fr: { title: "Calculateur ROI", body: "Fuite mensuelle en $ et palier Grow Hub.", cta: "Calculer" },
    en: { title: "ROI calculator", body: "Monthly leakage $ and Grow Hub tier.", cta: "Calculate" },
  },
  comparer: {
    fr: { title: "Comparateur", body: "BlackWay vs GHL / HubSpot / agence.", cta: "Comparer" },
    en: { title: "Comparator", body: "BlackWay vs GHL / HubSpot / agency.", cta: "Compare" },
  },
  grow_hub: {
    fr: { title: "Grow Hub Preview", body: "Pipeline interactif — prochaine action rentable.", cta: "Pipeline" },
    en: { title: "Grow Hub Preview", body: "Interactive pipeline — next profitable action.", cta: "Pipeline" },
  },
  secretaire: {
    fr: { title: "Secrétaire IA 24h", body: "Conseiller flottant — qualification et forfaits.", cta: "Ouvrir le chat" },
    en: { title: "AI Secretary 24/7", body: "Floating advisor — qualify and subscribe.", cta: "Open chat" },
  },
  forfaits: {
    fr: { title: "Forfaits web Grow Hub", body: "Revenu #1 — Spark → Partner.", cta: "Voir forfaits web" },
    en: { title: "Grow Hub web plans", body: "Revenue #1 — Spark → Partner.", cta: "See web plans" },
  },
  support: {
    fr: { title: "Support client", body: "serviceclient@ · accounting@ pour la facturation.", cta: "Contacter" },
    en: { title: "Client support", body: "serviceclient@ · accounting@ for billing.", cta: "Contact" },
  },
  cell_capture: {
    fr: { title: "Capture lead terrain", body: "Fiche rapide sur le terrain → HubSpot.", cta: "Ouvrir" },
    en: { title: "Field lead capture", body: "Quick field card → HubSpot.", cta: "Open" },
  },
  cell_pipeline: {
    fr: { title: "Pipeline mobile", body: "Avancer les deals en déplacement.", cta: "Ouvrir" },
    en: { title: "Mobile pipeline", body: "Advance deals on the road.", cta: "Open" },
  },
  cell_checkout: {
    fr: { title: "Checkout prospect", body: "Envoyer un Payment Link depuis le terrain.", cta: "Ouvrir" },
    en: { title: "Prospect checkout", body: "Send a Payment Link from the field.", cta: "Open" },
  },
  cell_streak: {
    fr: { title: "Streak terrain", body: "Rythme quotidien d’activité terrain.", cta: "Ouvrir" },
    en: { title: "Field streak", body: "Daily field activity rhythm.", cta: "Open" },
  },
  cell_fleet_ops: {
    fr: { title: "Fleet ops", body: "Multi-user terrain — équipe en route.", cta: "Ouvrir" },
    en: { title: "Fleet ops", body: "Multi-user field — team on the road.", cta: "Open" },
  },
  cell_merge: {
    fr: { title: "Merge web + cellulaire", body: "Ops complets — deux revenus, un compte.", cta: "Portail" },
    en: { title: "Merge web + cellular", body: "Full ops — two revenues, one account.", cta: "Portal" },
  },
  forfaits_cellulaire: {
    fr: { title: "Pack Cellulaire", body: "Revenu #2 optionnel — outils terrain Signal → Command.", cta: "Voir le pack" },
    en: { title: "Cellular Pack", body: "Optional revenue #2 — field tools Signal → Command.", cta: "See pack" },
  },
};

function readStored(): PortalSession | null {
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

function nextWebUpgrade(forfaitWeb: string | null): PlanKey | null {
  const rank = planRank(forfaitWeb);
  for (const key of PLAN_ORDER) {
    if ((PLAN_RANK[key] || 0) > rank) return key;
  }
  return null;
}

function nextCellUpgrade(forfaitCell: string | null): CellulairePlanKey | null {
  const rank = cellulaireRank(forfaitCell);
  for (const key of CELLULAIRE_ORDER) {
    if ((cellulaireRank(key) || 0) > rank) return key;
  }
  return null;
}

export function PortalPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<PortalSession | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  const persist = useCallback((s: PortalSession) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    setSession(s);
  }, []);

  const claim = useCallback(
    async (body: Record<string, string>) => {
      setBusy(true);
      setError(null);
      const attempts = body.session_id || body.sessionId ? 4 : 1;
      let lastErr = fr ? "Accès refusé" : "Access denied";
      try {
        for (let i = 0; i < attempts; i++) {
          try {
            const res = await fetch("/api/portal/claim", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const data = (await res.json()) as PortalSession & { erreur?: string; error?: string };
            if (!res.ok) {
              lastErr = data.erreur || data.error || lastErr;
              if (i < attempts - 1) {
                await new Promise((r) => setTimeout(r, 900 * (i + 1)));
                continue;
              }
              setError(lastErr);
              return;
            }
            persist({
              token: data.token,
              email: data.email,
              forfait: data.forfait,
              forfaitWeb: data.forfaitWeb,
              forfaitCellulaire: data.forfaitCellulaire,
              label: data.label,
              labelCellulaire: data.labelCellulaire,
              amountCad: data.amountCad,
              amountCadCellulaire: data.amountCadCellulaire,
              exp: data.exp,
            });
            if (params.get("session_id") || params.get("sessionId")) {
              navigate(path("/portail"), { replace: true });
            }
            return;
          } catch {
            lastErr = fr ? "Portail indisponible" : "Portal unavailable";
            if (i < attempts - 1) {
              await new Promise((r) => setTimeout(r, 900 * (i + 1)));
              continue;
            }
            setError(lastErr);
          }
        }
      } finally {
        setBusy(false);
      }
    },
    [fr, navigate, path, persist, params],
  );

  useEffect(() => {
    const stored = readStored();
    const sessionId = params.get("session_id") || params.get("sessionId");
    const plan = params.get("plan") || "";
    const emailParam = (params.get("email") || "").trim();
    if (emailParam && emailParam.includes("@")) {
      setEmail(emailParam);
    }
    if (sessionId) {
      void claim({ session_id: sessionId, plan });
      setBooting(false);
      return;
    }
    if (stored) {
      setSession(stored);
      void fetch("/api/portal/me", {
        headers: { Authorization: `Bearer ${stored.token}` },
      })
        .then(async (r) => {
          if (!r.ok) return;
          const data = (await r.json()) as PortalSession;
          if (data.token) persist(data);
        })
        .catch(() => undefined);
      setBooting(false);
      return;
    }
    // Deep link from Base44 / mobile: /portail?email=… → claim auto
    if (emailParam && emailParam.includes("@") && params.get("claim") !== "0") {
      void claim({ email: emailParam });
    }
    setBooting(false);
  }, [params, claim, persist]);

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  function openSecretary() {
    window.dispatchEvent(new CustomEvent("bw-open-secretary"));
    document.querySelector<HTMLButtonElement>("[data-bw-secretary], .ai-fab, .secretary-toggle")?.click();
  }

  if (booting || (busy && !session)) {
    return (
      <section className="section section--page section--portal">
        <div className="shell">
          <p className="lede">{fr ? "Activation du Portail Master…" : "Activating Master Portal…"}</p>
          {error ? <p className="form-status form-status--err">{error}</p> : null}
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="section section--page section--portal">
        <div className="shell portal-login">
          <p className="eyebrow">{fr ? "Portail Client Master" : "Client Master Portal"}</p>
          <h1 className="display page-hero__title">
            {fr ? "Contrôle ton dashboard — web et mobile." : "Control your dashboard — web and mobile."}
          </h1>
          <p className="lede">
            {fr
              ? "Forfait Grow Hub → Portail Master inclus partout (mobile = surplus inclus). Pack Cellulaire = outils terrain optionnels (revenu #2)."
              : "Grow Hub plan → Master Portal included everywhere (mobile = included surplus). Cellular Pack = optional field tools (revenue #2)."}
          </p>
          <form
            className="portal-login__form"
            onSubmit={(e) => {
              e.preventDefault();
              void claim({ email: email.trim() });
            }}
          >
            <label>
              {fr ? "Courriel du compte payeur" : "Payer account email"}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {fr ? "Ouvrir mon dashboard" : "Open my dashboard"}
            </button>
          </form>
          {error ? <p className="form-status form-status--err">{error}</p> : null}
          <p className="portal-login__hint">
            {fr ? (
              <>
                Pas encore client ? <Link to={path("/forfaits")}>Grow Hub web</Link>
                {" · "}
                <Link to={path("/forfaits-cellulaire")}>Pack Cellulaire (optionnel)</Link>
              </>
            ) : (
              <>
                Not a client yet? <Link to={path("/forfaits")}>Grow Hub web</Link>
                {" · "}
                <Link to={path("/forfaits-cellulaire")}>Cellular Pack (optional)</Link>
              </>
            )}
          </p>
        </div>
      </section>
    );
  }

  const split = splitForfaits(session.forfaitWeb || session.forfait, session.forfaitCellulaire);
  const forfaitWeb = split.forfaitWeb;
  const forfaitCell =
    split.forfaitCellulaire ||
    (isCellulaireForfait(session.forfait) ? session.forfait : null);
  const hasWeb = !!forfaitWeb;
  const hasCell = !!forfaitCell;
  const webUpgrade = nextWebUpgrade(forfaitWeb);
  const cellUpgrade = nextCellUpgrade(forfaitCell);
  const webLabel = forfaitWeb
    ? PLANS[forfaitWeb as PlanKey]?.key
      ? `Grow Hub ${forfaitWeb.replace("grow_hub_", "").replace(/^\w/, (c) => c.toUpperCase())}`
      : session.label
    : null;
  const cellLabel = forfaitCell
    ? CELLULAIRE_PLANS[forfaitCell as CellulairePlanKey]?.nameFr || session.labelCellulaire
    : null;

  return (
    <section className="section section--page section--portal">
      <div className="shell">
        <header className="portal-head">
          <div>
            <p className="eyebrow">{fr ? "Portail Client Master" : "Client Master Portal"}</p>
            <h1 className="display page-hero__title">
              {fr ? "Centre de contrôle Grow Hub" : "Grow Hub control center"}
            </h1>
            <p className="lede portal-head__meta">{session.email}</p>
            <p className="lede" style={{ marginTop: "0.5rem" }}>
              {fr
                ? "Pitch : contrôle ton dashboard peu importe où tu es — accès mobile inclus avec ton forfait."
                : "Pitch: control your dashboard wherever you are — mobile access included with your plan."}
            </p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={logout}>
            {fr ? "Déconnexion" : "Sign out"}
          </button>
        </header>

        <div className="portal-status" role="status">
          <span className="portal-status__dot" aria-hidden />
          {fr
            ? `Actif — Web: ${hasWeb ? "oui" : "non"} · Mobile dashboard: inclus · Pack Cellulaire: ${hasCell ? "oui" : "non"}`
            : `Active — Web: ${hasWeb ? "yes" : "no"} · Mobile dashboard: included · Cellular Pack: ${hasCell ? "yes" : "no"}`}
        </div>

        <div className="portal-plan" style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
          <div className="portal-plan__card">
            <p className="portal-plan__label">{fr ? "Revenu #1 · Grow Hub Web" : "Revenue #1 · Grow Hub Web"}</p>
            <h2>{hasWeb ? webLabel || session.label : fr ? "Aucun forfait web" : "No web plan"}</h2>
            <p className="portal-plan__price">
              {hasWeb && session.amountCad && !isCellulaireForfait(session.forfait)
                ? `${session.amountCad} $ CAD / ${fr ? "mois" : "mo"}`
                : hasWeb
                  ? "—"
                  : "—"}
            </p>
            {!hasWeb ? (
              <Link className="btn btn--primary" to={path("/forfaits")}>
                {fr ? "Ajouter Grow Hub web" : "Add Grow Hub web"}
              </Link>
            ) : webUpgrade ? (
              <a
                className="btn btn--ghost"
                href={checkoutUrl(webUpgrade, { source: "portal_upgrade", lang, content: "portal_web" })}
                rel="noopener noreferrer"
              >
                {fr ? `Upgrade web → ${PLANS[webUpgrade].amountCad}$` : `Web upgrade → $${PLANS[webUpgrade].amountCad}`}
              </a>
            ) : null}
          </div>

          <div className="portal-plan__card">
            <p className="portal-plan__label">
              {fr ? "Surplus inclus · Dashboard mobile" : "Included surplus · Mobile dashboard"}
            </p>
            <h2>{fr ? "Portail sur mobile" : "Portal on mobile"}</h2>
            <p className="portal-plan__price">{fr ? "Inclus avec Grow Hub" : "Included with Grow Hub"}</p>
            <p className="lede" style={{ fontSize: "0.95rem" }}>
              {fr
                ? "Ajoute cette page à l’écran d’accueil — même Portail, partout."
                : "Add this page to your home screen — same Portal, anywhere."}
            </p>
            <Link className="btn btn--primary" to={path("/portail")}>
              {fr ? "Ouvrir le dashboard mobile" : "Open mobile dashboard"}
            </Link>
          </div>

          <div className="portal-plan__card">
            <p className="portal-plan__label">
              {fr ? "Revenu #2 · Pack Cellulaire (optionnel)" : "Revenue #2 · Cellular Pack (optional)"}
            </p>
            <h2>
              {hasCell
                ? lang === "en"
                  ? CELLULAIRE_PLANS[forfaitCell as CellulairePlanKey]?.nameEn || cellLabel
                  : cellLabel
                : fr
                  ? "Pas encore — outils terrain"
                  : "Not yet — field tools"}
            </h2>
            <p className="portal-plan__price">
              {hasCell && CELLULAIRE_PLANS[forfaitCell as CellulairePlanKey]
                ? `${CELLULAIRE_PLANS[forfaitCell as CellulairePlanKey].amountCad} $ CAD / ${fr ? "mois" : "mo"}`
                : session.amountCadCellulaire
                  ? `${session.amountCadCellulaire} $ CAD / ${fr ? "mois" : "mo"}`
                  : "—"}
            </p>
            {!hasCell ? (
              <Link className="btn btn--primary" to={path("/forfaits-cellulaire")}>
                {fr ? "Ajouter Pack Cellulaire" : "Add Cellular Pack"}
              </Link>
            ) : cellUpgrade ? (
              <a
                className="btn btn--ghost"
                href={cellulaireCheckoutUrl(cellUpgrade, {
                  source: "portal_upgrade",
                  lang,
                  content: "portal_cell",
                })}
                rel="noopener noreferrer"
              >
                {fr
                  ? `Upgrade pack → ${CELLULAIRE_PLANS[cellUpgrade].amountCad}$`
                  : `Pack upgrade → $${CELLULAIRE_PLANS[cellUpgrade].amountCad}`}
              </a>
            ) : null}
          </div>
        </div>

        <div className="portal-actions" style={{ marginTop: "1.5rem" }}>
          <p className="portal-actions__label">{fr ? "Actions rapides" : "Quick actions"}</p>
          <div className="cta-row">
            <Link className="btn btn--primary" to={path("/diagnostic")}>
              {fr ? "Lancer le score" : "Run score"}
            </Link>
            <button type="button" className="btn btn--ghost" onClick={openSecretary}>
              {fr ? "Secrétaire IA" : "AI secretary"}
            </button>
            <Link className="btn btn--ghost" to={path("/forfaits-cellulaire")}>
              {fr ? "Pack Cellulaire (optionnel)" : "Cellular Pack (optional)"}
            </Link>
          </div>
        </div>

        {!hasCell ? (
          <aside
            className="portal-upsell"
            style={{
              marginTop: "1.75rem",
              padding: "1.25rem 1.5rem",
              border: "1px solid rgba(225,6,0,0.35)",
              borderRadius: "4px",
            }}
          >
            <p className="eyebrow">{fr ? "Upsell · Revenu #2" : "Upsell · Revenue #2"}</p>
            <h2 className="display" style={{ fontSize: "1.5rem", margin: "0.35rem 0" }}>
              {fr ? "Ajoute le Pack Cellulaire Fleet — 399 $/mois" : "Add Cellular Pack Fleet — $399/mo"}
            </h2>
            <p className="lede">
              {fr
                ? "Outils terrain (capture, pipeline, checkout prospect) — merge dans ce Portail. Dashboard mobile déjà inclus."
                : "Field tools (capture, pipeline, prospect checkout) — merge into this Portal. Mobile dashboard already included."}
            </p>
            <div className="cta-row" style={{ marginTop: "1rem" }}>
              <Link className="btn btn--primary" to={path("/forfaits-cellulaire")}>
                {fr ? "Voir Pack Cellulaire" : "See Cellular Pack"}
              </Link>
              <a
                className="btn btn--ghost"
                href={cellulaireCheckoutUrl("cell_fleet", {
                  source: "portal_upsell",
                  lang,
                  content: "portal_fleet",
                })}
                rel="noopener noreferrer"
              >
                {fr ? "Demander Cell Fleet" : "Request Cell Fleet"}
              </a>
            </div>
          </aside>
        ) : null}

        <ToolGrid
          title={fr ? "Outils Grow Hub Web (revenu #1)" : "Grow Hub Web tools (revenue #1)"}
          tools={WEB_PORTAL_TOOLS}
          forfaitWeb={forfaitWeb}
          forfaitCell={forfaitCell}
          fr={fr}
          path={path}
          openSecretary={openSecretary}
          lockedCta={path("/forfaits")}
          lockedLabel={fr ? "Débloquer (Grow Hub web)" : "Unlock (Grow Hub web)"}
        />

        <ToolGrid
          title={fr ? "Outils Pack Cellulaire / Terrain (revenu #2 optionnel)" : "Cellular / Field Pack tools (optional revenue #2)"}
          tools={CELL_PORTAL_TOOLS}
          forfaitWeb={forfaitWeb}
          forfaitCell={forfaitCell}
          fr={fr}
          path={path}
          openSecretary={openSecretary}
          lockedCta={path("/forfaits-cellulaire")}
          lockedLabel={fr ? "Débloquer (Pack Cellulaire)" : "Unlock (Cellular Pack)"}
        />

        <div className="portal-support">
          <h2>{fr ? "Support & facturation" : "Support & billing"}</h2>
          <p>
            {fr
              ? "Dashboard mobile inclus avec Grow Hub. Pack Cellulaire = surplus optionnel. Facturation : accounting@blackwayconnect.com."
              : "Mobile dashboard included with Grow Hub. Cellular Pack = optional surplus. Billing: accounting@blackwayconnect.com."}
          </p>
          <div className="cta-row">
            <a className="btn btn--primary" href="mailto:serviceclient@blackwayconnect.com">
              serviceclient@blackwayconnect.com
            </a>
            <a className="btn btn--ghost" href="mailto:accounting@blackwayconnect.com">
              accounting@blackwayconnect.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolGrid(props: {
  title: string;
  tools: PortalTool[];
  forfaitWeb: string | null;
  forfaitCell: string | null;
  fr: boolean;
  path: (p: string) => string;
  openSecretary: () => void;
  lockedCta: string;
  lockedLabel: string;
}) {
  const { title, tools, forfaitWeb, forfaitCell, fr, path, openSecretary, lockedCta, lockedLabel } = props;
  return (
    <>
      <h2 className="portal-grid__title" style={{ marginTop: "2rem" }}>
        {title}
      </h2>
      <div className="portal-grid">
        {tools.map((tool) => {
          const copy = TOOL_COPY[tool.id]?.[fr ? "fr" : "en"];
          if (!copy) return null;
          const unlocked = toolUnlocked(forfaitWeb, forfaitCell, tool);
          const basePath = tool.path
            ? tool.path.includes("#")
              ? tool.path.split("#")[0]
              : tool.path
            : "/";
          const hash = tool.path?.includes("#") ? `#${tool.path.split("#")[1]}` : "";
          const internalPath = `${path(basePath)}${hash}`;

          return (
            <article key={`${tool.line}-${tool.id}`} className={`portal-tool${unlocked ? "" : " portal-tool--locked"}`}>
              <div className="portal-tool__top">
                <h3>{copy.title}</h3>
                <span className={`portal-tool__badge${unlocked ? "" : " portal-tool__badge--lock"}`}>
                  {unlocked ? (fr ? "Ouvert" : "Open") : fr ? "Verrouillé" : "Locked"}
                </span>
              </div>
              <p>{copy.body}</p>
              {!unlocked ? (
                <Link className="btn btn--ghost" to={lockedCta}>
                  {lockedLabel}
                </Link>
              ) : tool.id === "secretaire" ? (
                <button type="button" className="btn btn--primary" onClick={openSecretary}>
                  {copy.cta}
                </button>
              ) : tool.id === "support" ? (
                <a className="btn btn--primary" href="mailto:serviceclient@blackwayconnect.com">
                  {copy.cta}
                </a>
              ) : (
                <Link className="btn btn--primary" to={internalPath}>
                  {copy.cta}
                </Link>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
