import type { Lang } from "./copy";
import type { PlanKey } from "./stripeConfig";

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
    title: "BlackWay Revenue Leak Score",
    body: "Six questions. Un score. La prochaine action pour arrêter de perdre du revenu entre le lead et le paiement.",
    start: "Lancer le diagnostic",
    next: "Suivant",
    back: "Retour",
    of: "sur",
    resultEyebrow: "Votre score de fuite",
    scoreLabel: "fuite / 100",
    leakLow: "Fuite contenue — vous pouvez industrialiser sans chaos.",
    leakMid: "Fuite réelle — des leads meurent entre la demande et la relance.",
    leakHigh: "Fuite critique — le revenu s’évapore avant d’atteindre le CRM.",
    why: "Pourquoi ce forfait",
    saveTitle: "Gardez votre diagnostic",
    saveBody: "On vous envoie la lecture et la prochaine étape Grow Hub. Aucune carte requise.",
    first: "Prénom",
    email: "Courriel",
    company: "Entreprise (optionnel)",
    saveCta: "Sauvegarder mon score",
    saving: "Envoi…",
    saved: "Score reçu. On vous contacte avec le plan d’action.",
    saveError: "Envoi impossible. Réessayez ou écrivez à serviceclient@blackwayconnect.com.",
    subscribe: "S’abonner à ce forfait",
    openApp: "Forfaits cellulaires",
    restart: "Refaire le diagnostic",
    seeGrowHub: "Voir Grow Hub en action",
    homeTeaser: "En 60 secondes, voyez où votre revenu fuit — avant d’acheter quoi que ce soit.",
    homeTeaserCta: "Calculer mon Leak Score",
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
        "Votre base est saine : le risque est de ralentir en grandissant.",
        "Priorité : standardiser pipeline, score et paiements avant d’ajouter du volume.",
      ],
      mid: [
        "Des leads chauds refroidissent entre formulaire, boîte courriel et relance manuelle.",
        "Devis et paiements sans remontée CRM = revenu invisible et non réclamé.",
      ],
      high: [
        "Le volume ou la complexité dépasse le système actuel — chaque jour coûte du cash.",
        "FR/EN, outils éclatés et paiements non suivis multiplient les fuites.",
      ],
    },
    planWhy: {
      grow_hub_spark: "Spark pour valider le stack sans surinvestir — pipeline + secrétaire IA.",
      grow_hub_launch:
        "Launch structure les premières demandes : un pipeline clair, sans surconstruire.",
      grow_hub_growth:
        "Growth est le moteur recommandé : score, relances, soumissions et paiements vers HubSpot.",
      grow_hub_scale:
        "Scale pour plusieurs équipes, marchés ou langues — une seule provenance revenu.",
      grow_hub_command: "Command quand la fuite exige ops CRM + acquisition gérée.",
      grow_hub_partner: "Partner pour remplacer un mandat agence par plateforme + exécution.",
    },
  },
  en: {
    nav: "Diagnostic",
    eyebrow: "60-second diagnostic",
    title: "BlackWay Revenue Leak Score",
    body: "Six questions. One score. The next action to stop losing revenue between lead and payment.",
    start: "Start diagnostic",
    next: "Next",
    back: "Back",
    of: "of",
    resultEyebrow: "Your leak score",
    scoreLabel: "leak / 100",
    leakLow: "Contained leak — you can industrialize without chaos.",
    leakMid: "Real leak — leads die between inquiry and follow-up.",
    leakHigh: "Critical leak — revenue evaporates before it reaches the CRM.",
    why: "Why this plan",
    saveTitle: "Save your diagnostic",
    saveBody: "We’ll send the read-out plus the next Grow Hub step. No card required.",
    first: "First name",
    email: "Email",
    company: "Company (optional)",
    saveCta: "Save my score",
    saving: "Sending…",
    saved: "Score received. We’ll follow up with the action plan.",
    saveError: "Could not send. Retry or email serviceclient@blackwayconnect.com.",
    subscribe: "Subscribe to this plan",
    openApp: "Cellular plans",
    restart: "Retake diagnostic",
    seeGrowHub: "See Grow Hub in action",
    homeTeaser: "In 60 seconds, see where revenue leaks — before you buy anything.",
    homeTeaserCta: "Calculate my Leak Score",
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
        "Your foundation is sound — the risk is slowing down as you grow.",
        "Priority: standardize pipeline, scoring and payments before adding volume.",
      ],
      mid: [
        "Warm leads cool between form, inbox and manual follow-up.",
        "Quotes and payments without CRM feedback = invisible, unclaimed revenue.",
      ],
      high: [
        "Volume or complexity outruns the current system — every day costs cash.",
        "FR/EN, fragmented tools and untracked payments multiply leaks.",
      ],
    },
    planWhy: {
      grow_hub_spark: "Spark to prove the stack without over-investing — pipeline + AI secretary.",
      grow_hub_launch: "Launch structures early demand: a clear pipeline without overbuilding.",
      grow_hub_growth:
        "Growth is the recommended engine: scoring, follow-ups, quotes and payments into HubSpot.",
      grow_hub_scale:
        "Scale for multiple teams, markets or languages — one revenue provenance.",
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
  const bilingualHeavy = ["b3", "b4"].includes(answers.bilingual || "");
  const volumeHeavy = ["v3", "v4"].includes(answers.volume || "");
  if (score >= 85 || (bilingualHeavy && volumeHeavy && score >= 55)) return "grow_hub_command";
  if (score >= 65 || (bilingualHeavy && volumeHeavy)) return "grow_hub_scale";
  if (score >= 35) return "grow_hub_growth";
  if (score >= 15) return "grow_hub_launch";
  return "grow_hub_spark";
}

export function leakBand(score: number): "low" | "mid" | "high" {
  if (score >= 65) return "high";
  if (score >= 35) return "mid";
  return "low";
}
