/**
 * scoring.js
 * ------------------------------------------------------------------
 * Calcul du score de qualification d'un lead BlackWayConnect et
 * classement en priorité (P1/P2/P3) pour le suivi commercial.
 * ------------------------------------------------------------------
 */

/** Points attribués selon la source d'acquisition du lead. */
const POINTS_SOURCE = {
  Stripe: 40,
  Portail: 25,
  'Form Web': 20,
  Référence: 25,
  Campagne: 10,
  Sortant: 5,
};

/**
 * Calcule le score d'un lead (0 à 100).
 *
 * @param {Object} params
 * @param {boolean} [params.icp] - Le lead correspond-il au profil client idéal (ICP) ?
 * @param {number} [params.budget] - Budget estimé du client, en dollars.
 * @param {string} [params.source] - Source d'acquisition (voir POINTS_SOURCE).
 * @param {string} [params.urgence] - "Élevée" | "Normal" | autre.
 * @param {string} [params.forfait] - Forfait souhaité (non pondéré directement, informatif).
 * @returns {number} Score entier entre 0 et 100.
 */
export function calculerLeadScore({ icp, budget, source, urgence, forfait } = {}) {
  let score = 0;

  // --- Pondération selon la source d'acquisition ---
  if (source && POINTS_SOURCE[source] !== undefined) {
    score += POINTS_SOURCE[source];
  }

  // --- Bonus ICP (profil client idéal) ---
  if (icp === true || icp === 'oui' || icp === 'Oui') {
    score += 20;
  }

  // --- Pondération selon le budget estimé ---
  const budgetNum = Number(budget) || 0;
  if (budgetNum >= 15000) {
    score += 25;
  } else if (budgetNum >= 7500) {
    score += 15;
  } else if (budgetNum >= 3000) {
    score += 8;
  }

  // --- Pondération selon l'urgence exprimée par le client ---
  if (urgence === 'Élevée' || urgence === 'Elevee' || urgence === 'Élevee') {
    score += 15;
  } else if (urgence === 'Normal') {
    score += 5;
  }

  // Le paramètre "forfait" est accepté pour usage futur / traçabilité,
  // mais n'influence pas directement le score pour l'instant.
  void forfait;

  // Plafonnement à 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Classe un score numérique en priorité commerciale.
 *
 * @param {number} score - Score calculé par calculerLeadScore (0-100).
 * @returns {'P1'|'P2'|'P3'} Priorité de suivi.
 */
export function classerPriorite(score) {
  const s = Number(score) || 0;
  if (s >= 70) return 'P1';
  if (s >= 40) return 'P2';
  return 'P3';
}

export { POINTS_SOURCE };
