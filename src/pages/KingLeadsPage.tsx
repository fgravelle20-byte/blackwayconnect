import { ContactForm } from "../ContactForm";
import { useLang } from "../i18n";

export function KingLeadsPage() {
  const { lang } = useLang();
  const fr = lang === "fr";
  return (
    <section className="section section--page">
      <div className="shell">
        <div className="page-hero">
          <p className="eyebrow">MASTER LEADS · WORLD</p>
          <h1 className="display page-hero__title">
            {fr ? "Des demandes pour votre entreprise." : "Company leads. Anywhere."}
          </h1>
          <p className="lede">
            {fr
              ? "Canada, USA, Europe, et le reste du monde. On vise des entreprises — pas des particuliers. Score chirurgical. Premier contact sur SLA. Le CRM, c’est BlackWayConnect."
              : "Canada, USA, Europe, and the rest of the world. Companies only — not consumers. Surgical score. First touch on SLA. The CRM is BlackWayConnect."}
          </p>
        </div>
        <ul className="point-list">
          <li>{fr ? "B2B seulement — nom d’entreprise obligatoire" : "B2B only — company name required"}</li>
          <li>{fr ? "Marché détecté (CA / US / EU / monde)" : "Market detected (CA / US / EU / world)"}</li>
          <li>{fr ? "Grade KING / SURGICAL / WARM" : "Grade KING / SURGICAL / WARM"}</li>
          <li>{fr ? "File unique : site, chat, mobile → Master CRM" : "One file: site, chat, mobile → Master CRM"}</li>
        </ul>
        <ContactForm source="king_leads_page" />
      </div>
    </section>
  );
}
