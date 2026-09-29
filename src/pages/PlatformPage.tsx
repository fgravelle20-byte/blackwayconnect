import { Link } from "react-router-dom";
import { useLang } from "../i18n";

export function PlatformPage() {
  const { lang, path } = useLang();
  const fr = lang === "fr";

  const modules = [
    {
      title: fr ? "Portail Client Master" : "Client Master Portal",
      body: fr
        ? "Le cœur de la plateforme : forfait actif, accès client, outils et historique dans un seul espace."
        : "The platform core: active plan, client access, tools and history in one place.",
      to: path("/portail"),
    },
    {
      title: fr ? "Master Tools" : "Master Tools",
      body: fr
        ? "Diagnostic, relances, soumissions, checklist et ROI reliés au même parcours."
        : "Diagnostic, follow-ups, quotes, checklist and ROI connected to the same journey.",
      to: path("/outils"),
    },
    {
      title: fr ? "Twin Turbo Diagnostic" : "Twin Turbo Diagnostic",
      body: fr
        ? "Volume + qualité : score, fuite de revenu et prochaine action avant le passage au forfait."
        : "Volume + quality: score, revenue leakage and next action before plan selection.",
      to: path("/diagnostic"),
    },
    {
      title: "Grow Hub",
      body: fr
        ? "Pipeline lead-to-revenue, automatisations et suivi commercial dans la même architecture."
        : "Lead-to-revenue pipeline, automations and sales follow-up in the same architecture.",
      to: path("/grow-hub"),
    },
    {
      title: fr ? "Pack Cellulaire" : "Cellular Pack",
      body: fr
        ? "Outils terrain et opérations mobiles rattachés au Portail Master, sans plateforme parallèle."
        : "Field and mobile operations attached to the Master Portal, without a parallel platform.",
      to: path("/forfaits-cellulaire"),
    },
    {
      title: fr ? "Modules IA" : "AI Modules",
      body: fr
        ? "Chatbot et accueil vocal IA comme modules additionnels du même compte client."
        : "AI chatbot and voice reception as add-on modules on the same customer account.",
      to: path("/modules-ia"),
    },
  ];

  return (
    <section className="section section--page">
      <div className="shell platform-shell">
        <div className="page-hero platform-intro">
          <p className="eyebrow">{fr ? "BlackWayConnect · Plateforme unifiée" : "BlackWayConnect · Unified platform"}</p>
          <h1 className="display page-hero__title">
            {fr ? "Une seule plateforme. Du lead au revenu." : "One platform. From lead to revenue."}
          </h1>
          <p className="lede">
            {fr
              ? "Le site, le Portail, les outils, les forfaits, les modules IA et le paiement Paddle utilisent la même architecture. Plus de produit parallèle à maintenir."
              : "The site, Portal, tools, plans, AI modules and Paddle payment use the same architecture. No parallel product to maintain."}
          </p>
        </div>

        <div className="platform-grid">
          {modules.map((item, index) => (
            <Link className="platform-card" to={item.to} key={item.title}>
              <span className="platform-card__index">{String(index + 1).padStart(2, "0")}</span>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <span className="platform-card__cta">{fr ? "Ouvrir →" : "Open →"}</span>
            </Link>
          ))}
        </div>

        <div className="platform-flow">
          <strong>{fr ? "Tuyauterie canonique :" : "Canonical plumbing:"}</strong>{" "}
          {fr
            ? "entrée lead → Twin Turbo → Master DB/D1 → Paddle → activation du forfait → Portail → outils et suivi."
            : "lead intake → Twin Turbo → Master DB/D1 → Paddle → plan activation → Portal → tools and follow-up."}
        </div>
      </div>
    </section>
  );
}
