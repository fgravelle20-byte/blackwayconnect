import { Link } from "react-router-dom";

export function OfferView() {
  return (
    <div className="gm-side gm-offer">
      <h2>Ce que cette maquette démontre</h2>
      <p>
        Proposition de démonstration : retirer l’irritant « demande non répondue / appel hors heures ».
        Ce n’est pas une analyse technique complète ni une promesse de résultats.
      </p>

      <div className="gm-offer__grid">
        <article className="gm-offer__col">
          <h3>Offre initiale — capter les demandes</h3>
          <ul>
            <li>Page d’accueil mobile d’abord, trois appels à l’action visibles dès l’ouverture</li>
            <li>Formulaire de soumission intelligent (propriété, travail, urgence, photos, zone)</li>
            <li>Automatisation de la réponse : confirmation + délai de rappel</li>
            <li>Tableau de suivi : urgences en haut, fiches clients structurées</li>
          </ul>
        </article>
        <article className="gm-offer__col gm-offer__col--next">
          <h3>Montée d’une coche — récupérer chaque soumission</h3>
          <ul>
            <li>Rappels SMS : moins de « je vous ai appelé, personne n’a répondu »</li>
            <li>Assignation selon la zone : moins de kilomètres à vide</li>
            <li>Séquence de relance des soumissions non signées (ex. restaurant Hudson dans le tableau)</li>
            <li>Demande d’avis Google après un travail complété : prochain chantier local</li>
          </ul>
        </article>
      </div>

      <p>
        La vente ne passe pas par « plus de fonctionnalités ». Elle passe de <strong>capter les demandes</strong> à{" "}
        <strong>récupérer chaque soumission et bâtir la réputation locale</strong>.
      </p>

      <p className="gm-disclaimer">
        Avant envoi au prospect : valider l’identité, le bon décideur (Guillaume Martel) et le besoin réel lors d’un
        court échange. Maquette conceptuelle — pas un livrable déjà construit.
      </p>

      <Link className="gm-btn gm-btn--quote" to="/maquettes/g-martel">
        Rejouer l’accueil client
      </Link>
    </div>
  );
}
