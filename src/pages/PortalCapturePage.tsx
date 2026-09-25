import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../i18n";
import { postLead } from "../lib/postLead";
import { trackLead } from "../tracking";
import { FEATURED_PLAN, PLANS, checkoutUrl, type PlanKey } from "../stripeConfig";

const STORAGE_KEY = "bw_portal_session";

type PortalSession = {
  token: string;
  email: string;
  forfait: string;
  exp: number;
};

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

const FORFAIT_OPTIONS: { value: PlanKey | "enterprise"; labelFr: string; labelEn: string }[] = [
  { value: "grow_hub_spark", labelFr: "Spark", labelEn: "Spark" },
  { value: "grow_hub_launch", labelFr: "Launch", labelEn: "Launch" },
  { value: "grow_hub_growth", labelFr: "Growth ★", labelEn: "Growth ★" },
  { value: "grow_hub_scale", labelFr: "Scale", labelEn: "Scale" },
  { value: "grow_hub_command", labelFr: "Command", labelEn: "Command" },
  { value: "grow_hub_partner", labelFr: "Partner", labelEn: "Partner" },
  { value: "enterprise", labelFr: "Entreprise", labelEn: "Enterprise" },
];

/** Real Portail tool — capture a lead into HubSpot (not a stub). */
export function PortalCapturePage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const navigate = useNavigate();
  const [session, setSession] = useState<PortalSession | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [pending, setPending] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = readSession();
    if (!s) {
      navigate(path("/portail"), { replace: true });
      return;
    }
    setSession(s);
  }, [navigate, path]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;
    setPending(true);
    setStatus("idle");
    setError("");
    const fd = new FormData(e.currentTarget);
    const forfait = String(fd.get("forfait") || FEATURED_PLAN);
    const result = await postLead({
      prenom: String(fd.get("prenom") || ""),
      nom: String(fd.get("nom") || ""),
      email: String(fd.get("email") || ""),
      entreprise: String(fd.get("entreprise") || ""),
      telephone: String(fd.get("telephone") || ""),
      message: [
        "bw_source=portail_capture",
        `captured_by=${session.email}`,
        `portal_forfait=${session.forfait}`,
        String(fd.get("message") || ""),
      ]
        .filter(Boolean)
        .join(" | ")
        .slice(0, 2000),
      forfait,
      source: "portail",
      urgence: String(fd.get("urgence") || "normal"),
      langue: lang,
      bw_ref: "portal_capture",
      bw_channel: "portail",
      engine_mode: "twin_turbo_full_performance",
      band: String(fd.get("urgence") || "") === "elevee" ? "high" : "mid",
    });
    setPending(false);
    if (result.ok) {
      trackLead();
      setScore(result.score ?? null);
      setStatus("ok");
      e.currentTarget.reset();
      return;
    }
    setError(result.error || (fr ? "Envoi impossible" : "Could not send"));
    setStatus("err");
  }

  if (!session) {
    return (
      <section className="section section--page">
        <div className="shell">
          <p role="status">{fr ? "Connexion portail…" : "Portal sign-in…"}</p>
        </div>
      </section>
    );
  }

  const growthHref = checkoutUrl(FEATURED_PLAN, {
    lang,
    source: "portal_capture",
    content: "after_capture",
  });

  return (
    <section className="section section--page section--tools">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">{fr ? "Portail · Capture lead" : "Portal · Lead capture"}</p>
          <h1 className="display page-hero__title">
            {fr ? "Capturer un lead → HubSpot" : "Capture a lead → HubSpot"}
          </h1>
          <p className="lede">
            {fr
              ? `Connecté : ${session.email}. La fiche crée contact + deal dans le pipeline BlackWay.`
              : `Signed in: ${session.email}. Creates contact + deal in the BlackWay pipeline.`}
          </p>
        </div>

        <form className="form tools-capture" onSubmit={onSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="pc-prenom">{fr ? "Prénom" : "First name"}</label>
              <input id="pc-prenom" name="prenom" required autoComplete="given-name" />
            </div>
            <div className="field">
              <label htmlFor="pc-nom">{fr ? "Nom" : "Last name"}</label>
              <input id="pc-nom" name="nom" autoComplete="family-name" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="pc-email">{fr ? "Courriel" : "Email"}</label>
            <input id="pc-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="pc-ent">{fr ? "Entreprise" : "Company"}</label>
              <input id="pc-ent" name="entreprise" autoComplete="organization" />
            </div>
            <div className="field">
              <label htmlFor="pc-tel">{fr ? "Téléphone" : "Phone"}</label>
              <input id="pc-tel" name="telephone" autoComplete="tel" inputMode="tel" />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="pc-forfait">{fr ? "Forfait recommandé" : "Recommended plan"}</label>
              <select id="pc-forfait" name="forfait" defaultValue={FEATURED_PLAN}>
                {FORFAIT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {fr ? o.labelFr : o.labelEn}
                    {o.value in PLANS ? ` · ${PLANS[o.value as PlanKey].amountCad}$` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pc-urgence">{fr ? "Urgence" : "Urgency"}</label>
              <select id="pc-urgence" name="urgence" defaultValue="normal">
                <option value="normal">{fr ? "Normale" : "Normal"}</option>
                <option value="elevee">{fr ? "Élevée" : "High"}</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="pc-msg">{fr ? "Note / besoin" : "Note / need"}</label>
            <textarea id="pc-msg" name="message" rows={3} />
          </div>
          <button className="btn btn--primary" type="submit" disabled={pending}>
            {pending ? "…" : fr ? "Créer dans HubSpot" : "Create in HubSpot"}
          </button>
          {status === "ok" && (
            <p className="form-status form-status--ok">
              {fr
                ? `Lead créé${score != null ? ` · score ${score}` : ""}. Visible dans ton pipeline.`
                : `Lead created${score != null ? ` · score ${score}` : ""}. Visible in your pipeline.`}
            </p>
          )}
          {status === "err" && (
            <p className="form-status form-status--err">
              {error || (fr ? "Échec." : "Failed.")}
            </p>
          )}
        </form>

        <div className="cta-row" style={{ marginTop: "1.5rem" }}>
          <Link className="btn btn--ghost" to={path("/portail")}>
            {fr ? "← Portail" : "← Portal"}
          </Link>
          <a className="btn btn--primary" href={growthHref} rel="noopener noreferrer">
            {fr ? `Checkout Growth — ${PLANS[FEATURED_PLAN].amountCad}$` : `Growth checkout — $${PLANS[FEATURED_PLAN].amountCad}`}
          </a>
        </div>
      </div>
    </section>
  );
}
