import { useSearchParams } from "react-router-dom";
import { sortRequests } from "../storage";
import { useGMartel } from "./context";
import { GM, labelProperty, labelWork } from "./copy";

function badgeClass(urgency: "now" | "24h" | "standard"): string {
  if (urgency === "now") return "gm-badge gm-badge--now";
  if (urgency === "24h") return "gm-badge gm-badge--24h";
  return "gm-badge gm-badge--standard";
}

export function BoardView() {
  const { requests, highlightedId, markCallbackSent } = useGMartel();
  const [params] = useSearchParams();
  const focus = params.get("focus") ?? highlightedId;
  const sorted = sortRequests(requests);
  const emergencies = sorted.filter((r) => r.urgency === "now").length;
  const waiting = sorted.filter((r) => r.status === "new" || r.status === "callback_sent").length;
  const quoted = sorted.filter((r) => r.status === "quoted").length;
  const focusReq = sorted.find((r) => r.id === focus);

  return (
    <div className="gm-side">
      <h2>Tableau de suivi — {GM.owner}</h2>
      <p>
        Les urgences restent en haut. Chaque ligne est une fiche déjà triée : propriété, travail, zone,
        photo, délai promis. Les actions grisées sont la montée d’une coche — récupérer la soumission, gagner
        du temps sur la route, bâtir l’avis local.
      </p>

      {focusReq ? (
        <div className="gm-toast" role="status">
          Notification : {focusReq.name} · {focusReq.zone} · {labelWork(focusReq.workType)} · photo{" "}
          {focusReq.photoUrl ? "jointe" : "absente"} · {focusReq.callbackEta}
        </div>
      ) : null}

      <div className="gm-stats">
        <div className="gm-stat">
          <strong>{emergencies}</strong>
          <span>Urgences</span>
        </div>
        <div className="gm-stat">
          <strong>{waiting}</strong>
          <span>À rappeler</span>
        </div>
        <div className="gm-stat">
          <strong>{quoted}</strong>
          <span>Soumissions</span>
        </div>
      </div>

      <div className="gm-list">
        {sorted.map((req) => (
          <article
            key={req.id}
            className={`gm-ticket${req.urgency === "now" ? " gm-ticket--now" : ""}${
              req.id === focus ? " gm-ticket--hit" : ""
            }`}
          >
            {req.photoUrl ? (
              <img src={req.photoUrl} alt="" width={72} height={72} />
            ) : (
              <div className="gm-ticket__ph" aria-hidden="true" />
            )}
            <div>
              <span className={badgeClass(req.urgency)}>
                {req.urgency === "now" ? "Urgence" : req.urgency === "24h" ? "24 h" : "Standard"}
              </span>
              <h3>
                {req.name} · {req.zone}
              </h3>
              <p>
                {labelProperty(req.propertyType)} · {labelWork(req.workType)}
              </p>
              <p>{req.description}</p>
              <p>
                {req.phone} · {req.callbackEta}
              </p>
            </div>
            <div className="gm-ticket__actions">
              <button type="button" onClick={() => markCallbackSent(req.id)}>
                Marquer rappel envoyé
              </button>
              <button type="button" disabled title="Montée d’une coche — temps gagné sur la route">
                Assigner par zone
              </button>
              <button type="button" disabled title="Montée d’une coche — récupérer la soumission">
                Relancer soumission
              </button>
              <button type="button" disabled title="Montée d’une coche — réputation locale">
                Demander un avis
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
