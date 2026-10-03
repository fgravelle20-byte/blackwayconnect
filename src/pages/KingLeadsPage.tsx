import { ContactForm } from "../ContactForm";
import { useLang } from "../i18n";

export function KingLeadsPage() {
  const { lang } = useLang();
  const fr = lang === "fr";
  return (
    <section className="section section--page">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">{fr ? "Prospects d’entreprise" : "Company leads"}</p>
          <h1 className="display page-hero__title">
            {fr ? "Des demandes pour votre entreprise." : "Company leads. Anywhere."}
          </h1>
          <p className="lede">
            {fr
              ? "Centralisez vos demandes commerciales au Canada, aux États-Unis et en Europe. Priorisez vos prospects et préparez votre premier suivi dans le CRM BlackWayConnect."
              : "Canada, USA, Europe, and the rest of the world. Companies only — not consumers. Surgical score. First touch on SLA. The CRM is BlackWayConnect."}
          </p>
        </div>
        <ul className="point-list">
          <li>{fr ? "B2B seulement — nom d’entreprise obligatoire" : "B2B only — company name required"}</li>
          <li>{fr ? "Marché détecté (CA / US / EU / monde)" : "Market detected (CA / US / EU / world)"}</li>
          <li>{fr ? "Priorités selon le score du dossier" : "Priorités selon le score du dossier"}</li>
          <li>{fr ? "Un dossier commun au site, aux conversations et au mobile" : "One file: site, chat, mobile → Master CRM"}</li>
        </ul>
        <ContactForm source="king_leads_page" />
      </div>
    </section>
  );
}
