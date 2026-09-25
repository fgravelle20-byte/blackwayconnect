import type { Lang } from "./copy";
import type { PlanKey } from "./stripeConfig";
import { computeTwinTurbo } from "./leadEngines";

export type ScoreOption = { id: string; label: string; leak: number };
export type ScoreQuestion = { id: string; prompt: string; options: ScoreOption[] };

export type ScoreCopy = {
  nav: string;
  eyebrow: string;
  title: string;
  body: string;
  start: string;
  next: string;
  back: string;
  of: string;
  resultEyebrow: string;
  scoreLabel: string;
  leakLow: string;
  leakMid: string;
  leakHigh: string;
  why: string;
  saveTitle: string;
  saveBody: string;
  first: string;
  email: string;
  company: string;
  saveCta: string;
  saving: string;
  saved: string;
  saveError: string;
  subscribe: string;
  openApp: string;
  restart: string;
  seeGrowHub: string;
  homeTeaser: string;
  homeTeaserCta: string;
  questions: ScoreQuestion[];
  diagnoses: Record<"low" | "mid" | "high", string[]>;
  planWhy: Record<PlanKey, string>;
};

export const scoreCopy: Record<Lang, ScoreCopy> = {
  fr: {
    nav: "Diagnostic",
    eyebrow: "Diagnostic 60 secondes",
    title: "BlackWay Twin Turbo — Leak Score",
    body: "Six questions. Twin Turbo Full Performance : volume + qualité. Une action pour fermer la fuite lead → paiement.",
    start: "Lancer le diagnostic",
    next: "Suivant",
    back: "Retour",
    of: "sur",
    resultEyebrow: "Votre score Twin Turbo",
    scoreLabel: "pression / 100",
    leakLow: "Pression légère — Twin Turbo Lock : industrialiser sans chaos.",
    leakMid: "Pression réelle — Turbo Qualité : leads qui meurent entre demande et relance.",
    leakHigh: "Pression critique — Twin Turbo Full : le revenu s’évapore avant le CRM.",
    why: "Pourquoi ce moteur",
    saveTitle: "Gardez votre diagnostic Twin Turbo",
    saveBody: "On archive volume + qualité dans HubSpot et on vous renvoie la prochaine étape. Aucune carte.",
    first: "Prénom",
    email: "Courriel",
    company: "Entreprise (optionnel)",
    saveCta: "Sauvegarder mon score",
    saving: "Envoi…",
    saved: "Score Twin Turbo reçu. On vous contacte avec le plan d’action.",
    saveError: "Envoi impossible. Réessayez ou écrivez à serviceclient@blackwayconnect.com.",
    subscribe: "S’abonner à ce forfait",
    openApp: "Forfaits cellulaires",
    restart: "Refaire le diagnostic",
    seeGrowHub: "Voir Grow Hub en action",
    homeTeaser: "60 s — Twin Turbo : où volume et qualité fuient, avant d’acheter.",
    homeTeaserCta: "Calculer mon Twin Turbo",
    questions: [
      {
        id: "volume",
        prompt: "Combien de leads entrent par mois ?",
        options: [
          { id: "v1", label: "Moins de 20", leak: 8 },
          { id: "v2", label: "20 à 80", leak: 14 },
          { id: "v3", label: "80 à 250", leak: 18 },
          { id: "v4", label: "250+", leak: 22 },
        ],
      },
      {
        id: "speed",
        prompt: "Temps moyen avant la première relance ?",
        options: [
          { id: "s1", label: "Moins d’une heure", leak: 4 },
          { id: "s2", label: "Dans la journée", leak: 10 },
          { id: "s3", label: "2–3 jours", leak: 18 },
          { id: "s4", label: "Souvent jamais", leak: 24 },
        ],
      },
      {
        id: "crm",
        prompt: "Où vivent vraiment vos opportunités ?",
        options: [
          { id: "c1", label: "CRM unique, à jour", leak: 4 },
          { id: "c2", label: "CRM + tableurs / boîtes courriel", leak: 14 },
          { id: "c3", label: "Surtout courriels et notes", leak: 20 },
          { id: "c4", label: "Nulle part de façon fiable", leak: 24 },
        ],
      },
      {
        id: "bilingual",
        prompt: "Servez-vous le Québec / Canada et les États-Unis (FR + EN) ?",
        options: [
          { id: "b1", label: "Un seul marché / une langue", leak: 6 },
          { id: "b2", label: "Deux langues, parcours partiels", leak: 14 },
          { id: "b3", label: "Deux marchés, outils séparés", leak: 18 },
          { id: "b4", label: "On improvise à chaque lead", leak: 22 },
        ],
      },
      {
        id: "close",
        prompt: "Taux de conclusion approximatif (lead → vente) ?",
        options: [
          { id: "cl1", label: "20 %+", leak: 5 },
          { id: "cl2", label: "10–20 %", leak: 12 },
          { id: "cl3", label: "5–10 %", leak: 18 },
          { id: "cl4", label: "Moins de 5 % ou inconnu", leak: 24 },
        ],
      },
      {
        id: "payments",
        prompt: "Paniers / devis abandonnés et paiements manqués ?",
        options: [
          { id: "p1", label: "Suivis et récupérés", leak: 4 },
          { id: "p2", label: "On voit parfois les abandons", leak: 12 },
          { id: "p3", label: "Souvent perdus sans alerte", leak: 20 },
          { id: "p4", label: "Aucun suivi des paiements", leak: 24 },
        ],
      },
    ],
    diagnoses: {
      low: [
        "Base saine — Twin Turbo Lock : standardiser avant d’ajouter du volume.",
        "Priorité : pipeline unique, score CRM et récupération paiements.",
      ],
      mid: [
        "Turbo Qualité en retrait : leads chauds qui refroidissent entre formulaire et relance.",
        "Devis / paiements sans remontée HubSpot = revenu invisible.",
      ],
      high: [
        "Twin Turbo Full : volume et close dépassent le stack — chaque jour coûte du cash.",
        "FR/EN, CRM éclaté et paiements non suivis multiplient les fuites.",
      ],
    },
    planWhy: {
      grow_hub_spark: "Spark pour valider le stack sans surinvestir — pipeline + secrétaire IA.",
      grow_hub_launch:
        "Launch = Twin Turbo Lock : structure les premières demandes sans surconstruire.",
      grow_hub_growth:
        "Growth = Twin Turbo Full Performance : score, relances, soumissions, paiements → HubSpot.",
      grow_hub_scale:
        "Scale = Twin Turbo Max : multi-équipes / marchés / langues, une provenance revenu.",
      grow_hub_command: "Command quand la fuite exige ops CRM + acquisition gérée.",
      grow_hub_partner: "Partner pour remplacer un mandat agence par plateforme + exécution.",
    },
  },
  en: {
    nav: "Diagnostic",
    eyebrow: "60-second diagnostic",
    title: "BlackWay Twin Turbo — Leak Score",
    body: "Six questions. Twin Turbo Full Performance: volume + quality. One action to stop losing revenue between lead and payment.",
    start: "Start diagnostic",
    next: "Next",
    back: "Back",
    of: "of",
    resultEyebrow: "Your Twin Turbo score",
    scoreLabel: "pressure / 100",
    leakLow: "Light pressure — Twin Turbo Lock: industrialize without chaos.",
    leakMid: "Real pressure — Quality Turbo: leads die between inquiry and follow-up.",
    leakHigh: "Critical pressure — Twin Turbo Full: revenue evaporates before the CRM.",
    why: "Why this engine",
    saveTitle: "Save your Twin Turbo diagnostic",
    saveBody: "We archive volume + quality in HubSpot and send the next Grow Hub step. No card required.",
    first: "First name",
    email: "Email",
    company: "Company (optional)",
    saveCta: "Save my score",
    saving: "Sending…",
    saved: "Twin Turbo score received. We’ll follow up with the action plan.",
    saveError: "Could not send. Retry or email serviceclient@blackwayconnect.com.",
    subscribe: "Subscribe to this plan",
    openApp: "Cellular plans",
    restart: "Retake diagnostic",
    seeGrowHub: "See Grow Hub in action",
    homeTeaser: "60s — Twin Turbo: where volume and quality leak, before you buy.",
    homeTeaserCta: "Calculate my Twin Turbo",
    questions: [
      {
        id: "volume",
        prompt: "How many leads come in per month?",
        options: [
          { id: "v1", label: "Under 20", leak: 8 },
          { id: "v2", label: "20–80", leak: 14 },
          { id: "v3", label: "80–250", leak: 18 },
          { id: "v4", label: "250+", leak: 22 },
        ],
      },
      {
        id: "speed",
        prompt: "Average time to first follow-up?",
        options: [
          { id: "s1", label: "Under an hour", leak: 4 },
          { id: "s2", label: "Same day", leak: 10 },
          { id: "s3", label: "2–3 days", leak: 18 },
          { id: "s4", label: "Often never", leak: 24 },
        ],
      },
      {
        id: "crm",
        prompt: "Where do opportunities actually live?",
        options: [
          { id: "c1", label: "One CRM, kept current", leak: 4 },
          { id: "c2", label: "CRM + spreadsheets / inboxes", leak: 14 },
          { id: "c3", label: "Mostly email and notes", leak: 20 },
          { id: "c4", label: "Nowhere reliably", leak: 24 },
        ],
      },
      {
        id: "bilingual",
        prompt: "Do you serve Québec / Canada and the U.S. (FR + EN)?",
        options: [
          { id: "b1", label: "One market / one language", leak: 6 },
          { id: "b2", label: "Two languages, partial journeys", leak: 14 },
          { id: "b3", label: "Two markets, separate tools", leak: 18 },
          { id: "b4", label: "We improvise every lead", leak: 22 },
        ],
      },
      {
        id: "close",
        prompt: "Approx. close rate (lead → sale)?",
        options: [
          { id: "cl1", label: "20%+", leak: 5 },
          { id: "cl2", label: "10–20%", leak: 12 },
          { id: "cl3", label: "5–10%", leak: 18 },
          { id: "cl4", label: "Under 5% or unknown", leak: 24 },
        ],
      },
      {
        id: "payments",
        prompt: "Abandoned carts / quotes and missed payments?",
        options: [
          { id: "p1", label: "Tracked and recovered", leak: 4 },
          { id: "p2", label: "We sometimes see abandonments", leak: 12 },
          { id: "p3", label: "Often lost with no alert", leak: 20 },
          { id: "p4", label: "No payment follow-up", leak: 24 },
        ],
      },
    ],
    diagnoses: {
      low: [
        "Sound base — Twin Turbo Lock: standardize before adding volume.",
        "Priority: one pipeline, CRM score, payment recovery.",
      ],
      mid: [
        "Quality Turbo lagging: warm leads cool between form and follow-up.",
        "Quotes / payments without HubSpot feedback = invisible revenue.",
      ],
      high: [
        "Twin Turbo Full: volume and close outrun the stack — every day costs cash.",
        "FR/EN, fragmented CRM and untracked payments multiply leaks.",
      ],
    },
    planWhy: {
      grow_hub_spark: "Spark to prove the stack without over-investing — pipeline + AI secretary.",
      grow_hub_launch: "Launch = Twin Turbo Lock: early demand without overbuilding.",
      grow_hub_growth:
        "Growth = Twin Turbo Full Performance: scoring, follow-ups, quotes, payments → HubSpot.",
      grow_hub_scale:
        "Scale = Twin Turbo Max: multi-team / market / language, one revenue provenance.",
      grow_hub_command: "Command when leakage needs CRM ops + managed acquisition.",
      grow_hub_partner: "Partner to replace an agency retainer with platform + execution.",
    },
  },
};

/** Max theoretical leak from all questions (sum of max option per Q). */
export function maxLeak(questions: ScoreQuestion[]) {
  return questions.reduce((sum, q) => sum + Math.max(...q.options.map((o) => o.leak)), 0);
}

export function computeLeakScore(answers: Record<string, string>, questions: ScoreQuestion[]) {
  let raw = 0;
  for (const q of questions) {
    const opt = q.options.find((o) => o.id === answers[q.id]);
    if (opt) raw += opt.leak;
  }
  const max = maxLeak(questions);
  return Math.round((raw / max) * 100);
}

export function recommendPlan(
  score: number,
  answers: Record<string, string>,
): PlanKey {
  return computeTwinTurbo({ leakScore: score, answers }).recommendedPlan;
}

export function leakBand(score: number): "low" | "mid" | "high" {
  if (score >= 65) return "high";
  if (score >= 35) return "mid";
  return "low";
}
