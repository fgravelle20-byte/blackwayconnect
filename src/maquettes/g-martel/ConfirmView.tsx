import { Link, useSearchParams } from "react-router-dom";
import { useGMartel } from "./context";
import { GM, labelProperty, labelUrgency, labelWork } from "./copy";

export function ConfirmView() {
  const [params] = useSearchParams();
  const { requests, lastRequest } = useGMartel();
  const id = params.get("id");
  const req = requests.find((r) => r.id === id) ?? lastRequest;

  if (!req) {
    return (
      <div className="gm-confirm">
        <p>Aucune demande à afficher.</p>
        <Link className="gm-back" to="/maquettes/g-martel">
          Retour à l’accueil
        </Link>
      </div>
    );
  }

  const urgent = req.urgency === "now" || req.intent === "urgence";

  return (
    <div className="gm-confirm">
      <Link className="gm-back" to="/maquettes/g-martel">
        ← Accueil
      </Link>
      <h1>{urgent ? "Urgence reçue" : "Demande enregistrée"}</h1>
      <p>
        {urgent
          ? "Confirmation immédiate. Guillaume voit déjà la zone, la photo et le type de travail — pas un appel manqué."
          : "Une fiche client structurée a été créée. Le rappel part selon le créneau indiqué."}
      </p>

      <article className="gm-confirm__card">
        <p className="gm-confirm__eta">{req.callbackEta}</p>
        <p>
          {req.name} · {req.phone}
        </p>
        <p>
          {labelProperty(req.propertyType)} · {labelWork(req.workType)} · {req.zone}
        </p>
        <p>{labelUrgency(req.urgency)}</p>
        <p>{req.description}</p>
        {req.photoUrl ? (
          <div className="gm-photo">
            <img src={req.photoUrl} alt="Photo jointe à la demande" width={320} height={140} />
          </div>
        ) : null}
      </article>

      <p>
        Message type envoyé : « {GM.brand} a bien reçu votre demande. {req.callbackEta}. »
      </p>

      <Link className="gm-btn gm-btn--quote" to={`/maquettes/g-martel/tableau?focus=${req.id}`}>
        Voir ce que Guillaume reçoit
      </Link>
    </div>
  );
}
