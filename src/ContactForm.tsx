import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLang } from "./i18n";
import { trackLead } from "./tracking";

const PLANS = [
  { value: "grow_hub_spark", label: "Web · Spark" },
  { value: "grow_hub_launch", label: "Web · Launch" },
  { value: "grow_hub_growth", label: "Web · Growth" },
  { value: "grow_hub_scale", label: "Web · Scale" },
  { value: "grow_hub_command", label: "Web · Command" },
  { value: "grow_hub_partner", label: "Web · Partner" },
  { value: "cell_signal", label: "Cellulaire · Signal 79$" },
  { value: "cell_route", label: "Cellulaire · Route 199$" },
  { value: "cell_fleet", label: "Cellulaire · Fleet 399$" },
  { value: "cell_command", label: "Cellulaire · Command 799$" },
  { value: "enterprise", label: "Entreprise / custom" },
  { value: "website_lead_launch", label: "Site Fondation" },
  { value: "revenue_system", label: "Systeme Revenu" },
  { value: "ai_scale", label: "Application mobile & IA" },
];

type ContactFormProps = {
  source?: string;
};

export function ContactForm({ source = "form_web" }: ContactFormProps) {
  const { t, lang, path } = useLang();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    const payload = {
      prenom: String(fd.get("prenom") || ""),
      nom: String(fd.get("nom") || ""),
      email: String(fd.get("email") || ""),
      entreprise: String(fd.get("entreprise") || ""),
      telephone: String(fd.get("telephone") || ""),
      message: String(fd.get("message") || ""),
      forfait: String(fd.get("forfait") || "grow_hub_growth"),
      source,
      urgence: "normal",
      langue: lang,
      bw_ref: "site",
      bw_channel: source,
    };
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        trackLead();
        e.currentTarget.reset();
        navigate(path("/merci") + "?src=form");
        return;
      }
      setStatus("err");
    } catch {
      setStatus("err");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="prenom">{t.form.first}</label>
          <input id="prenom" name="prenom" required autoComplete="given-name" />
        </div>
        <div className="field">
          <label htmlFor="nom">{t.form.last}</label>
          <input id="nom" name="nom" autoComplete="family-name" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="email">{t.form.email}</label>
        <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" />
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="entreprise">{t.form.company}</label>
          <input id="entreprise" name="entreprise" autoComplete="organization" />
        </div>
        <div className="field">
          <label htmlFor="telephone">{t.form.phone}</label>
          <input id="telephone" name="telephone" autoComplete="tel" inputMode="tel" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="forfait">{t.form.plan}</label>
        <select id="forfait" name="forfait" defaultValue="grow_hub_growth">
          {PLANS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="message">{t.form.message}</label>
        <textarea id="message" name="message" rows={3} placeholder="…" />
      </div>
      <button className="btn btn--primary" type="submit" disabled={pending}>
        {pending ? "…" : t.form.submit}
      </button>
      {status === "ok" && <p className="form-status form-status--ok">{t.form.success}</p>}
      {status === "err" && <p className="form-status form-status--err">{t.form.error}</p>}
    </form>
  );
}
