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
  bw_lead_score?: string;
  bw_forfait?: string;
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
  bw_lead_score?: string;
  bw_livraison_statut?: string;
  bw_segment?: string;
  createdate?: string;
  hs_lastmodifieddate?: string;
};
type Overview = {
  fetchedAt: string;
  engines?: {
    mode?: string;
    dealsWithScore?: number;
    avgLeadScore?: number | null;
    maxLeadScore?: number | null;
  };
  limits: { countsArePartial: boolean; contactsAvailable: boolean };
  contacts: Contact[];
  deals: Deal[];
  sources?: Record<string, string>;
};

function date(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

function scoreLabel(value?: string | number | null) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? String(Math.round(n)) : null;
}

const sections = [
  {
    title: "Appels et ligne téléphonique",
    state: "À relier",
    detail:
      "Aucun journal d’appels BlackWay vérifié. Les numéros affichés sur le site ne prouvent pas une connexion aux appels.",
  },
  {
    title: "Messages et courriels",
    state: "À relier",
    detail: "Les conversations ne remontent pas encore dans cette vue.",
  },
  {
    title: "Paiements",
    state: "Partiel",
    detail:
      "Étapes HubSpot + Paddle fulfillment. Le solde bancaire se vérifie dans Paddle / processeur.",
  },
  {
    title: "Automatisations",
    state: "Actif",
    detail:
      "Leads Tools/Portail → HubSpot · webhooks Paddle → forfait + portail. Suivi d’exécution encore partiel.",
  },
];

export function OwnerConsolePage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch("/api/owner/overview", {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        setStatusCode(response.status);
        if (!response.ok) {
          throw new Error(
            response.status === 403
              ? "Accès propriétaire requis (Cloudflare Access)."
              : "Les données sont indisponibles. Réessaie plus tard.",
          );
        }
        return response.json() as Promise<Overview>;
      })
      .then((overview) => {
        setData(overview);
        setError("");
      })
      .catch((err: Error) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refresh]);

  const paid = data?.deals.filter((deal) => deal.dealstage === "3584700395") || [];
  const projects =
    data?.deals.filter((deal) => deal.bw_livraison_statut && deal.bw_livraison_statut !== "non_demarre") ||
    [];
  const twin = data?.engines;

  return (
    <main className="owner-console">
      <div className="owner-console__wrap">
        <header className="owner-console__head">
          <div>
            <Link to="/" className="owner-console__back">
              ← BlackWayConnect
            </Link>
            <p className="owner-console__eyebrow">ESPACE PROPRIÉTAIRE · PRIVÉ · TWIN TURBO</p>
            <h1>Tout ce qui entre. Tout ce qui avance.</h1>
            <p>Cockpit leads / deals / scores — pipeline BlackWay HubSpot en direct.</p>
          </div>
          <button onClick={() => setRefresh((value) => value + 1)} disabled={loading}>
            Actualiser
          </button>
        </header>

        {error && (
          <div className="owner-console__error" role="alert">
            <p>{error}</p>
            {statusCode === 403 && (
              <ol className="owner-console__setup">
                <li>
                  Cloudflare Zero Trust → Application Access self-hosted sur{" "}
                  <code>/controle*</code> + <code>/api/owner/*</code> (même audience).
                </li>
                <li>
                  Secrets Worker <code>blackway-site</code> : <code>CF_ACCESS_TEAM_DOMAIN</code>,{" "}
                  <code>CF_ACCESS_AUD</code>, <code>BW_OWNER_EMAIL</code>.
                </li>
                <li>
                  Confirmer <code>BW_LEAD_KEY</code> (site + pipe) et <code>HUBSPOT_TOKEN</code> (pipe).
                </li>
                <li>
                  Doc : <code>ops/OWNER_CONSOLE.md</code>
                </li>
              </ol>
            )}
          </div>
        )}
        {loading && <p role="status">Chargement des données…</p>}
        {data && (
          <>
            <p className="owner-console__time">
              Mis à jour le {date(data.fetchedAt)} · Aperçu des 50 derniers dossiers BlackWay (pas des
              totaux historiques).
            </p>
            {!data.limits.contactsAvailable && (
              <div className="owner-console__error" role="status">
                Les contacts associés aux dossiers ne sont pas accessibles pour le moment. Les
                opportunités restent visibles.
              </div>
            )}
            <div className="owner-console__stats">
              <div>
                <strong>{data.contacts.length}</strong>
                <span>Contacts récents</span>
              </div>
              <div>
                <strong>{data.deals.length}</strong>
                <span>Opportunités récentes</span>
              </div>
              <div>
                <strong>{paid.length}</strong>
                <span>Paiement reçu (CRM)</span>
              </div>
              <div>
                <strong>{twin?.avgLeadScore ?? "—"}</strong>
                <span>
                  Score Twin Turbo moyen
                  {twin?.dealsWithScore != null ? ` · ${twin.dealsWithScore} scorés` : ""}
                </span>
              </div>
            </div>
            {twin?.mode && (
              <p className="owner-console__time">
                Moteur : <code>{twin.mode}</code>
                {twin.maxLeadScore != null ? ` · max ${twin.maxLeadScore}` : ""} · projets livraison :{" "}
                {projects.length}
              </p>
            )}

            <section className="owner-console__panel">
              <h2>Nouvelles entrées et clients</h2>
              {data.contacts.length ? (
                <div className="owner-console__list">
                  {data.contacts.map((contact) => {
                    const sc = scoreLabel(contact.bw_lead_score);
                    return (
                      <article key={contact.id}>
                        <div>
                          <strong>
                            {[contact.firstname, contact.lastname].filter(Boolean).join(" ") ||
                              contact.company ||
                              contact.email ||
                              "Contact"}
                          </strong>
                          <span>
                            {contact.company || contact.email || "—"}
                            {contact.bw_forfait ? ` · ${contact.bw_forfait}` : ""}
                          </span>
                        </div>
                        <div>
                          <span>
                            {sc ? `Score ${sc} · ` : ""}
                            {contact.bw_source || contact.lifecyclestage || "Source inconnue"}
                          </span>
                          <small>{date(contact.createdate || contact.hs_lastmodifieddate)}</small>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p>
                  {data.limits.contactsAvailable
                    ? "Aucun contact associé aux dossiers récents."
                    : "Contacts temporairement indisponibles."}
                </p>
              )}
            </section>

            <section className="owner-console__panel">
              <h2>Ventes, paiements signalés et projets</h2>
              {data.deals.length ? (
                <div className="owner-console__list">
                  {data.deals.map((deal) => {
                    const sc = scoreLabel(deal.bw_lead_score);
                    return (
                      <article key={deal.id}>
                        <div>
                          <strong>{deal.dealname || "Opportunité"}</strong>
                          <span>
                            {deal.bw_forfait || deal.bw_source || "—"}
                            {deal.amount ? ` · ${deal.amount} $` : ""}
                          </span>
                        </div>
                        <div>
                          <span>
                            {sc ? `Score ${sc} · ` : ""}
                            {deal.dealstage === "3584700395"
                              ? "Paiement reçu (CRM)"
                              : deal.bw_livraison_statut || deal.bw_segment || "À traiter"}
                          </span>
                          <small>{date(deal.createdate || deal.hs_lastmodifieddate)}</small>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p>Aucun dossier récent retourné dans le pipeline BlackWay.</p>
              )}
            </section>
          </>
        )}

        <section className="owner-console__panel">
          <h2>Connexions</h2>
          <div className="owner-console__connections">
            {sections.map((section) => (
              <article key={section.title}>
                <div>
                  <h3>{section.title}</h3>
                  <span>{section.state}</span>
                </div>
                <p>{section.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
