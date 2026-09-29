import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n";
import { PLANS, PLAN_ORDER, checkoutUrl } from "../stripeConfig";

type OpsPayload = {
  ok?: boolean;
  generatedAt?: string;
  site?: { ok?: boolean; lead_key?: boolean; ai?: boolean; chat?: boolean };
  pipe?: {
    ok?: boolean;
    hubspot?: boolean;
    stripe_secret?: boolean;
    stripe_webhook?: boolean;
    stripe_webhook_secret?: boolean;
    lead_key?: boolean;
    portal_claim_ready?: boolean;
  };
  stripe?: { webhook?: string; checkout?: Record<string, string> };
  app?: {
    portal?: string;
    preview?: string;
    appId?: string;
    appStore?: string;
    playStore?: string;
    appleInternalId?: string;
    status?: string;
  };
  stages?: { id: string; ok: boolean }[];
};

function Light({ on }: { on: boolean }) {
  return <span className={`ops-light${on ? " is-on" : " is-off"}`} aria-hidden="true" />;
}

export function OwnerDashboardPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";
  const [data, setData] = useState<OpsPayload | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ops")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setData(j as OpsPayload);
      })
      .catch(() => {
        if (!cancelled) setErr(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pipe = data?.pipe || {};
  const site = data?.site || {};
  const app = data?.app || {};
  const storeReady = !!(app.appStore && app.appStore.length);

  const stages = [
    {
      id: "site",
      title: fr ? "Site production" : "Production site",
      body: "blackwayconnect.com · Worker blackway-site",
      ok: site.ok !== false,
      href: "/",
    },
    {
      id: "paddle",
      title: "Paddle Checkout",
      body: fr ? "Paiement Grow Hub (CAD/mois)" : "Grow Hub checkout (CAD/mo)",
      ok: true,
      href: path("/payer") + "?plan=grow_hub_growth",
    },
    {
      id: "pipe",
      title: fr ? "Master CRM" : "Master CRM",
      body: fr ? "Leads entreprise → blackwayconnect.com/crm" : "Company leads → blackwayconnect.com/crm",
      ok: pipe.ok === true,
      href: path("/crm"),
    },
    {
      id: "portal",
      title: fr ? "Portail client" : "Client portal",
      body: fr ? "Dashboard acheteur (après Paddle)" : "Buyer dashboard (after Paddle)",
      ok: true,
      href: path("/portail"),
    },
    {
      id: "base44",
      title: fr ? "App Base44" : "Base44 app",
      body: app.appId ? `ID ${app.appId}` : "black-way-link.base44.app",
      ok: true,
      href: app.preview || "https://black-way-link.base44.app/",
      external: true,
    },
    {
      id: "store",
      title: fr ? "App Store / TestFlight" : "App Store / TestFlight",
      body: storeReady
        ? app.appStore
        : fr
          ? `Pas encore d’URL publique · Apple ID interne ${app.appleInternalId || "6797345749"}`
          : `No public URL yet · internal Apple ID ${app.appleInternalId || "6797345749"}`,
      ok: storeReady,
      href: app.appStore || undefined,
      external: true,
    },
  ];

  return (
    <section className="section section--page section--ops">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">{fr ? "Propriétaire · Cockpit" : "Owner · Cockpit"}</p>
          <h1 className="display page-hero__title">
            {fr ? "Dashboard BlackWay — développement de l’app" : "BlackWay dashboard — app development"}
          </h1>
          <p className="lede">
            {fr
              ? "Ici tu vois l’état réel du produit : site, Paddle, Master CRM, portail client, preview Base44, App Store. Le /portail est pour tes clients payants — celui-ci est pour toi."
              : "Live product state: site, Paddle, Master CRM, client portal, Base44 preview, App Store. /portail is for paying customers — this one is yours."}
          </p>
          {data?.generatedAt ? (
            <p className="ops-stamp">
              {fr ? "Dernière lecture" : "Last read"} {new Date(data.generatedAt).toLocaleString(fr ? "fr-CA" : "en-CA")}
            </p>
          ) : null}
          {err ? (
            <p className="form-status form-status--err">
              {fr ? "Lecture /api/ops indisponible." : "/api/ops read failed."}
            </p>
          ) : null}
        </div>

        <div className="ops-kpis">
          <article className="ops-kpi">
            <Light on={site.ok !== false} />
            <strong>Site</strong>
            <span>{site.lead_key ? (fr ? "clé lead OK" : "lead key OK") : (fr ? "clé lead absente" : "lead key missing")}</span>
          </article>
          <article className="ops-kpi">
            <Light on={pipe.ok === true} />
            <strong>Pipe</strong>
            <span>{pipe.ok ? (fr ? "api.blackwayconnect.com" : "api.blackwayconnect.com") : "down"}</span>
          </article>
          <article className="ops-kpi">
            <Light on={pipe.ok === true || pipe.portal_claim_ready !== false} />
            <strong>Master CRM</strong>
            <span>{fr ? "blackwayconnect.com/crm" : "blackwayconnect.com/crm"}</span>
          </article>
          <article className="ops-kpi">
            <Light on={true} />
            <strong>Paddle</strong>
            <span>{fr ? "processeur live" : "live processor"}</span>
          </article>
          <article className="ops-kpi">
            <Light on={site.ai === true} />
            <strong>IA</strong>
            <span>{site.chat ? (fr ? "secrétaire 24h" : "secretary 24/7") : "off"}</span>
          </article>
          <article className="ops-kpi">
            <Light on={pipe.portal_claim_ready !== false} />
            <strong>{fr ? "Portail" : "Portal"}</strong>
            <span>{pipe.portal_claim_ready ? (fr ? "claim prêt" : "claim ready") : (fr ? "claim à check" : "claim check")}</span>
          </article>
        </div>

        <h2 className="ops-h2">{fr ? "Développement app" : "App development"}</h2>
        <ol className="ops-stages">
          {stages.map((s, i) => (
            <li key={s.id} className={`ops-stage${s.ok ? " is-ok" : " is-wait"}`}>
              <span className="ops-stage__n">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <p className="ops-stage__title">
                  <Light on={s.ok} /> {s.title}
                </p>
                <p className="ops-stage__body">{s.body}</p>
                {s.href ? (
                  s.external ? (
                    <a href={s.href} rel="noopener noreferrer">
                      {fr ? "Ouvrir →" : "Open →"}
                    </a>
                  ) : (
                    <Link to={s.href}>{fr ? "Ouvrir →" : "Open →"}</Link>
                  )
                ) : (
                  <span className="ops-stage__wait">{fr ? "En attente" : "Waiting"}</span>
                )}
              </div>
            </li>
          ))}
        </ol>

        <h2 className="ops-h2">{fr ? "Liens utiles" : "Useful links"}</h2>
        <div className="ops-links">
          <Link className="btn btn--primary" to={path("/portail")}>
            {fr ? "Portail clients" : "Customer portal"}
          </Link>
          <Link className="btn btn--ghost" to={path("/forfaits")}>
            {fr ? "Forfaits / Paddle" : "Plans / Paddle"}
          </Link>
          <Link className="btn btn--ghost" to={path("/outils")}>
            Master Tools
          </Link>
          <a className="btn btn--ghost" href={app.preview || "https://black-way-link.base44.app/"} rel="noopener noreferrer">
            {fr ? "Preview app Base44" : "Base44 app preview"}
          </a>
          <a className="btn btn--ghost" href="https://vendors.paddle.com" rel="noopener noreferrer">
            Paddle Dashboard
          </a>
          <Link className="btn btn--ghost" to={path("/crm")}>
            Master CRM
          </Link>
        </div>

        <h2 className="ops-h2">{fr ? "Checkout Paddle live" : "Live Paddle checkout"}</h2>
        <ul className="ops-prices">
          {PLAN_ORDER.map((key) => {
            const p = PLANS[key];
            const href = checkoutUrl(key, { source: "ops_cockpit" });
            return (
              <li key={key}>
                <span>
                  {p.key.replace("grow_hub_", "")} · {p.amountCad} $
                </span>
                <a href={href} rel="noopener noreferrer">
                  {fr ? "Payer" : "Pay"}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
