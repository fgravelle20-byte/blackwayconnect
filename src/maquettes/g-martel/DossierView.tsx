import { Link } from "react-router-dom";
import { GM } from "./copy";
import { GM_CLIENT, GM_CRM, GM_DOSSIER, GM_LEAD, dossierField } from "./crm";

const DOSSIER_FIELDS = [
  dossierField("cle_dossier", GM_DOSSIER.cle_dossier),
  dossierField("id", GM_DOSSIER.id),
  dossierField("nom_entreprise", GM_DOSSIER.nom_entreprise),
  dossierField("contact_nom", GM_DOSSIER.contact_nom),
  dossierField("contact_telephone", GM_DOSSIER.contact_telephone),
  dossierField("statut_relation", GM_DOSSIER.statut_relation),
  dossierField("priorite", GM_DOSSIER.priorite),
  dossierField("score", GM_DOSSIER.score),
  dossierField("besoin_principal", GM_DOSSIER.besoin_principal),
  dossierField("solution_recommandee", GM_DOSSIER.solution_recommandee),
  dossierField("prochaine_action", GM_DOSSIER.prochaine_action),
  dossierField("prochaine_action_date", GM_DOSSIER.prochaine_action_date),
  dossierField("etat_projet", GM_DOSSIER.etat_projet),
  dossierField("offre_statut", GM_DOSSIER.offre_statut),
  dossierField("lead_id", GM_DOSSIER.lead_id),
  dossierField("client_id", GM_DOSSIER.client_id),
];

const LEAD_FIELDS = [
  dossierField("id", GM_LEAD.id),
  dossierField("nom", GM_LEAD.nom),
  dossierField("entreprise", GM_LEAD.entreprise),
  dossierField("telephone", GM_LEAD.telephone),
  dossierField("contact_key", GM_LEAD.contact_key),
  dossierField("etape", GM_LEAD.etape),
  dossierField("source", GM_LEAD.source),
  dossierField("client_id", GM_LEAD.client_id),
  dossierField("notes", GM_LEAD.notes),
];

const CLIENT_FIELDS = [
  dossierField("id", GM_CLIENT.id),
  dossierField("nom_entreprise", GM_CLIENT.nom_entreprise),
  dossierField("contact_nom", GM_CLIENT.contact_nom),
  dossierField("statut", GM_CLIENT.statut),
  dossierField("plan", GM_CLIENT.plan),
  dossierField("ville", GM_CLIENT.ville),
  dossierField("site_web_actuel", GM_CLIENT.site_web_actuel),
  dossierField("lead_id", GM_CLIENT.lead_id),
];

function EntityCard({
  entity,
  title,
  fields,
}: {
  entity: string;
  title: string;
  fields: { label: string; value: string }[];
}) {
  return (
    <section className="gm-entity">
      <header className="gm-entity__title">
        <div>
          <p className="gm-entity__kicker">Entité Base44 · {entity}</p>
          <h2>{title}</h2>
        </div>
      </header>
      <dl className="gm-entity__grid">
        {fields.map((f) => (
          <div key={f.label} className={f.value.length > 80 ? "gm-entity__wide" : undefined}>
            <dt>{f.label}</dt>
            <dd>
              <textarea readOnly rows={f.value.length > 80 ? 4 : 1} value={f.value} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DossierView() {
  return (
    <div className="gm-side gm-offer gm-dossier">
      <h2>Dossier CRM Vorixa — {GM.legal}</h2>
      <p>
        Fiches réelles dans l’app Vorixa. <strong>À valider</strong> avant tout envoi : identité, décideur (
        {GM.owner}) et besoin réel. Ce n’est pas un livrable déjà construit, ni un forfait self-serve assigné.
      </p>
      <p className="gm-entity__hint">
        Clé de déduplication <code>{GM_CRM.cleDossier}</code>. Les tickets du tableau (urgences, scénario du
        soir) restent locaux à la maquette — ce ne sont pas des leads Vorixa.
      </p>

      <EntityCard entity="vorixa-dossier-client" title="Dossier client" fields={DOSSIER_FIELDS} />
      <EntityCard entity="VorixaLead" title="Lead de prospection" fields={LEAD_FIELDS} />
      <EntityCard entity="VorixaClient" title="Fiche client (prospect)" fields={CLIENT_FIELDS} />

      <p className="gm-disclaimer">
        Plan CRM = Personnalisé (maquette hors catalogue 149 / 299 / 599). Aucun lien Stripe, aucun montant
        d’offre. Ré-écriture idempotente : script <code>upsert:g-martel-vorixa</code> avec secret d’environnement,
        jamais une clé dans le navigateur.
      </p>

      <Link className="gm-btn gm-btn--quote" to="/maquettes/g-martel/offre">
        Voir l’offre démontrée
      </Link>
    </div>
  );
}
