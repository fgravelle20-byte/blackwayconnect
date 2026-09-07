import { Link } from "react-router-dom";
import { MAQUETTE_TOTAL, MAQUETTES } from "./catalog";
import "./maquettes.css";

export function MaquettesIndexPage() {
  return (
    <div className="vx-demo">
      <div className="vx-chrome">
        <div className="vx-chrome__bar">
          <div className="vx-chrome__top">
            <span className="vx-chrome__brand">VORIXA</span>
            <p className="vx-chrome__tag">
              Maquettes personnalisées de prospection — dossier d’audit. Démonstrations commerciales, pas des
              livrables déjà construits.
            </p>
          </div>
        </div>
      </div>
      <main className="vx-hub">
        <p className="vx-chrome__brand">Dossier d’audit</p>
        <h1>19 maquettes de prospection</h1>
        <p>
          Chaque maquette montre un parcours client, l’irritant traité, les éléments à livrer et la montée
          d’une coche — présentée comme la prochaine source de revenu ou de temps gagné, jamais comme « plus
          de fonctionnalités ».
        </p>
        <p className="vx-note">
          Avant envoi : valider l’identité du prospect, le bon décideur et le besoin réel lors d’un court
          échange. Ne pas présenter ces pages comme une analyse technique complète ni comme une promesse de
          résultats garantis.
        </p>
        <ul className="vx-hub__list">
          {MAQUETTES.map((m) => (
            <li key={m.slug} className={`vx-hub__card${m.status === "ready" ? " vx-hub__card--ready" : ""}`}>
              <span className="vx-hub__n">
                Maquette {m.n} / {MAQUETTE_TOTAL}
              </span>
              <h2>{m.prospect}</h2>
              <p>{m.title}</p>
              <p>Irritant ciblé : {m.irritant}</p>
              {m.status === "ready" ? (
                <Link to={`/maquettes/${m.slug}`}>Ouvrir la démonstration</Link>
              ) : (
                <p>À venir</p>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export function UpcomingMaquette() {
  return (
    <div className="vx-demo">
      <main className="vx-hub">
        <p className="vx-chrome__brand">VORIXA</p>
        <h1>Maquette à venir</h1>
        <p>Les maquettes 2 à 19 du dossier d’audit seront ajoutées ici, une par une, avec le même cadre de démonstration.</p>
        <p>
          <Link to="/maquettes">Retour au dossier</Link>
        </p>
      </main>
    </div>
  );
}
