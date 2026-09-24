import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./owner-console.css";

type Contact = {
  id: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  company?: string;
  lifecyclestage?: string;
  bw_source?: string;
  createdate?: string;
  hs_lastmodifieddate?: string;
};
type Deal = {
  id: string;
  dealname?: string;
  dealstage?: string;
  amount?: string;
  bw_source?: string;
  bw_forfait?: string;
  bw_livraison_statut?: string;
  createdate?: string;
  hs_lastmodifieddate?: string;
};
type Overview = {
  fetchedAt: string;
  limits: { countsArePartial: boolean; contactsAvailable: boolean };
  contacts: Contact[];
  deals: Deal[];
};

function date(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

const sections = [
  { title: "Appels et ligne téléphonique", state: "À relier", detail: "Aucun journal d’appels BlackWay vérifié. Les numéros affichés sur le site ne prouvent pas une connexion aux appels." },
  { title: "Messages et courriels", state: "À relier", detail: "Les conversations ne remontent pas encore dans cette vue." },
  { title: "Paiements", state: "Partiel", detail: "Les étapes de vente apparaissent dans HubSpot. Le solde et les versements doivent être vérifiés dans le processeur de paiement." },
  { title: "Automatisations", state: "Partiel", detail: "La capture des leads et les webhooks de paiement existent. Le suivi de chaque exécution n’est pas encore centralisé." },
];

export function OwnerConsolePage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch("/api/owner/overview", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 403 ? "Accès propriétaire requis. Ouvre cette page avec le compte autorisé dans Cloudflare Access." : "Les données sont indisponibles. Réessaie plus tard.");
        return response.json() as Promise<Overview>;
      })
      .then((overview) => { setData(overview); setError(""); })
      .catch((err: Error) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);

  const paid = data?.deals.filter((deal) => deal.dealstage === "3584700395") || [];
  const projects = data?.deals.filter((deal) => deal.bw_livraison_statut && deal.bw_livraison_statut !== "non_demarre") || [];

  return (
    <main className="owner-console">
      <div className="owner-console__wrap">
        <header className="owner-console__head">
          <div>
            <Link to="/" className="owner-console__back">← BlackWayConnect</Link>
            <p className="owner-console__eyebrow">ESPACE PROPRIÉTAIRE · PRIVÉ</p>
            <h1>Tout ce qui entre. Tout ce qui avance.</h1>
            <p>Un seul endroit pour suivre l’activité réelle de BlackWayConnect.</p>
          </div>
          <button onClick={() => setRefresh((value) => value + 1)} disabled={loading}>Actualiser</button>
        </header>

        {error && <div className="owner-console__error" role="alert">{error}</div>}
        {loading && <p role="status">Chargement des données…</p>}
        {data && <>
          <p className="owner-console__time">Mis à jour le {date(data.fetchedAt)} · Aperçu des 50 derniers dossiers BlackWay, pas des totaux de tous les temps.</p>
          {!data.limits.contactsAvailable && <div className="owner-console__error" role="status">Les contacts associés aux dossiers ne sont pas accessibles pour le moment. Les opportunités restent visibles.</div>}
          <div className="owner-console__stats">
            <div><strong>{data.contacts.length}</strong><span>Contacts récents</span></div>
            <div><strong>{data.deals.length}</strong><span>Opportunités récentes</span></div>
            <div><strong>{paid.length}</strong><span>Dossiers au statut « paiement reçu »</span></div>
            <div><strong>{projects.length}</strong><span>Dossiers avec livraison en cours</span></div>
          </div>

          <section className="owner-console__panel">
            <h2>Nouvelles entrées et clients</h2>
            {data.contacts.length ? <div className="owner-console__list">{data.contacts.map((contact) => <article key={contact.id}>
              <div><strong>{[contact.firstname, contact.lastname].filter(Boolean).join(" ") || contact.company || contact.email || "Contact"}</strong><span>{contact.company || contact.email || "—"}</span></div>
              <div><span>{contact.bw_source || contact.lifecyclestage || "Source inconnue"}</span><small>{date(contact.createdate || contact.hs_lastmodifieddate)}</small></div>
            </article>)}</div> : <p>{data.limits.contactsAvailable ? "Aucun contact associé aux dossiers récents." : "Contacts temporairement indisponibles."}</p>}
          </section>

          <section className="owner-console__panel">
            <h2>Ventes, paiements signalés et projets</h2>
            {data.deals.length ? <div className="owner-console__list">{data.deals.map((deal) => <article key={deal.id}>
              <div><strong>{deal.dealname || "Opportunité"}</strong><span>{deal.bw_forfait || deal.bw_source || "—"}</span></div>
              <div><span>{deal.dealstage === "3584700395" ? "Paiement reçu (CRM)" : deal.bw_livraison_statut || "À traiter"}</span><small>{date(deal.createdate || deal.hs_lastmodifieddate)}</small></div>
            </article>)}</div> : <p>Aucun dossier récent retourné dans le pipeline BlackWay.</p>}
          </section>
        </>}

        <section className="owner-console__panel">
          <h2>Connexions à compléter</h2>
          <div className="owner-console__connections">{sections.map((section) => <article key={section.title}>
            <div><h3>{section.title}</h3><span>{section.state}</span></div><p>{section.detail}</p>
          </article>)}</div>
        </section>
      </div>
    </main>
  );
}
