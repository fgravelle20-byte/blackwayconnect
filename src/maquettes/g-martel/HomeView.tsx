import { Link } from "react-router-dom";
import { GM } from "./copy";

type HomeViewProps = {
  evening?: boolean;
};

export function HomeView({ evening = false }: HomeViewProps) {
  const hero = evening ? "/maquettes/g-martel/evening.jpg" : "/maquettes/g-martel/hero.jpg";

  return (
    <div className="gm-home">
      <div className="gm-home__hero" style={{ backgroundImage: `url(${hero})` }}>
        <header className="gm-home__head">
          <img
            className="gm-logo"
            src="/maquettes/g-martel/logo.png"
            srcSet="/maquettes/g-martel/logo.png 256w, /maquettes/g-martel/logo-512.png 512w"
            sizes="44px"
            width={44}
            height={44}
            alt=""
          />
          <div className="gm-home__name">
            <strong>{GM.legal}</strong>
            <span>
              {GM.ownerRole} · {GM.territory}
            </span>
          </div>
        </header>
        <div className="gm-home__copy">
          <span className="gm-kicker">{GM.title} VORIXA</span>
          <h1>Panne, soumission ou rappel — sans laisser un message dans le vide.</h1>
          <p>
            Trois choix dès l’ouverture. Guillaume reçoit une fiche déjà triée plutôt qu’un courriel vague
            ou un appel manqué.
          </p>
        </div>
      </div>

      <div className="gm-ctas">
        <Link className="gm-btn gm-btn--quote" to="/maquettes/g-martel/demande?intent=soumission">
          Demander une soumission
        </Link>
        <Link className="gm-btn gm-btn--emergency" to="/maquettes/g-martel/demande?intent=urgence">
          Urgence électrique
        </Link>
        <Link className="gm-btn gm-btn--call" to="/maquettes/g-martel/demande?intent=rappel">
          Planifier un rappel
        </Link>
      </div>

      <div className="gm-home__trust">
        <p>
          {evening
            ? "Il est tard : l’urgence part en tête de liste et le propriétaire reçoit tout de suite le délai de rappel."
            : "Résidentiel, commercial et industriel — Vaudreuil-Dorion, Vaudreuil-Soulanges et Grand Montréal."}
        </p>
        <ul>
          <li>Photo du panneau ou de la panne jointe à la demande</li>
          <li>Zone desservie captée avant le rappel</li>
          <li>Confirmation immédiate, même hors des heures de bureau</li>
        </ul>
      </div>
    </div>
  );
}
