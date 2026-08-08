import type { Lang } from "./copy";
import type { PlanKey } from "./stripeConfig";

export type StageId = "lead" | "qualified" | "proposal" | "closing" | "won";

export type SampleDeal = {
  id: string;
  company: string;
  title: { fr: string; en: string };
  value: number;
  source: { fr: string; en: string };
  next: { fr: string; en: string };
  stage: StageId;
};

export type GrowHubCopy = {
  eyebrow: string;
  title: string;
  body: string;
  bodyFromScore: (score: number, planName: string) => string;
  thisIsYours: string;
  thisIsYoursBody: string;
  activate: string;
  captureTitle: string;
  captureBody: string;
  first: string;
  email: string;
  company: string;
  softCta: string;
  saving: string;
  saved: string;
  saveError: string;
  openDeal: string;
  value: string;
  source: string;
  nextAction: string;
  advance: string;
  advanced: string;
  close: string;
  recommended: string;
  pipelineLabel: string;
  dealCount: (n: number) => string;
  pipelineValue: string;
  demoHint: string;
  stages: Record<StageId, string>;
  planWhy: Record<PlanKey, string>;
};

export const SAMPLE_DEALS: SampleDeal[] = [
  {
    id: "atelier-nordique",
    company: "Atelier Nordique",
    title: { fr: "Refonte site + leads", en: "Site rebuild + leads" },
    value: 8500,
    source: { fr: "Google Ads", en: "Google Ads" },
    next: { fr: "Qualifier le budget SEO", en: "Qualify SEO budget" },
    stage: "lead",
  },
  {
    id: "cafe-laurentides",
    company: "Café des Laurentides",
    title: { fr: "Pack acquisition locale", en: "Local acquisition pack" },
    value: 3200,
    source: { fr: "Référence client", en: "Client referral" },
    next: { fr: "Envoyer la grille Launch", en: "Send Launch pricing" },
    stage: "qualified",
  },
  {
    id: "construction-belanger",
    company: "Construction Bélanger",
    title: { fr: "Pipeline chantier → devis", en: "Jobsite → quote pipeline" },
    value: 12000,
    source: { fr: "LinkedIn", en: "LinkedIn" },
    next: { fr: "Présenter Growth demain 10 h", en: "Present Growth tomorrow 10am" },
    stage: "proposal",
  },
  {
    id: "clinique-sante",
    company: "Clinique Santé Plus",
    title: { fr: "Automatisations + CRM", en: "Automation + CRM" },
    value: 18500,
    source: { fr: "Revenue Leak Score", en: "Revenue Leak Score" },
    next: { fr: "Confirmer signature Stripe", en: "Confirm Stripe signature" },
    stage: "closing",
  },
  {
    id: "electricite-riviera",
    company: "Électricité Riviera",
    title: { fr: "Grow Hub Growth", en: "Grow Hub Growth" },
    value: 299,
    source: { fr: "Site web", en: "Website" },
    next: { fr: "Onboarding semaine 1", en: "Week-1 onboarding" },
    stage: "won",
  },
  {
    id: "traiteur-mtl",
    company: "Traiteur Montréal Est",
    title: { fr: "Nurture événements B2B", en: "B2B event nurture" },
    value: 4800,
    source: { fr: "Facebook Ads", en: "Facebook Ads" },
    next: { fr: "Appeler décisionnaire", en: "Call decision-maker" },
    stage: "lead",
  },
];

export const STAGE_ORDER: StageId[] = ["lead", "qualified", "proposal", "closing", "won"];

export const growHubCopy: Record<Lang, GrowHubCopy> = {
  fr: {
    eyebrow: "Aperçu produit · Centre de commande revenu",
    title: "Votre Grow Hub, en action",
    body: "Pipeline bilingue, prochaines actions claires, occasions qui avancent. Ce n’est pas une maquette marketing — c’est le rythme du produit.",
    bodyFromScore: (score, planName) =>
      `Votre Leak Score est à ${score}/100. Le forfait ${planName} est mis en avant — avancez une occasion pour sentir le rythme du Grow Hub.`,
    thisIsYours: "Voici votre Grow Hub",
    thisIsYoursBody:
      "Un seul tableau pour leads, propositions et paiements. Ouvrez une occasion, avancez une étape, activez quand vous êtes prêt.",
    activate: "Activer mon Grow Hub",
    captureTitle: "Gardez cet aperçu",
    captureBody: "Laissez votre courriel — on rattache le forfait recommandé. Aucune carte requise.",
    first: "Prénom",
    email: "Courriel",
    company: "Entreprise (optionnel)",
    softCta: "Recevoir mon plan d’activation",
    saving: "Envoi…",
    saved: "Reçu. On vous contacte avec la prochaine étape Grow Hub.",
    saveError: "Envoi impossible. Réessayez ou écrivez à serviceclient@blackwayconnect.com.",
    openDeal: "Détail de l’occasion",
    value: "Valeur",
    source: "Source",
    nextAction: "Prochaine action",
    advance: "Avancer d’une étape",
    advanced: "Occasion avancée",
    close: "Fermer",
    recommended: "Recommandé pour vous",
    pipelineLabel: "Pipeline démo Québec",
    dealCount: (n) => `${n} opportunités`,
    pipelineValue: "Valeur pipeline",
    demoHint: "Cliquez une occasion · avancez une étape · activez votre hub",
    stages: {
      lead: "Lead",
      qualified: "Qualifié",
      proposal: "Proposition",
      closing: "Clôture",
      won: "Gagné",
    },
    planWhy: {
      grow_hub_spark: "Entrée légère — pipeline simple + secrétaire IA 24h.",
      grow_hub_launch: "Pour organiser les premières demandes sans chaos.",
      grow_hub_growth: "Le moteur recommandé pour vendre et mesurer chaque étape.",
      grow_hub_scale: "Plusieurs équipes, marchés et parcours — un seul système.",
      grow_hub_command: "Ops CRM + acquisition gérée pour PME en croissance.",
      grow_hub_partner: "Plateforme + mandat — puissance agence, discipline SaaS.",
    },
  },
  en: {
    eyebrow: "Product preview · Revenue command center",
    title: "Your Grow Hub, live",
    body: "Bilingual pipeline, clear next actions, opportunities that move. This is not a marketing mock — it is the product cadence.",
    bodyFromScore: (score, planName) =>
      `Your Leak Score is ${score}/100. ${planName} is highlighted — advance an opportunity to feel Grow Hub’s cadence.`,
    thisIsYours: "This is your Grow Hub",
    thisIsYoursBody:
      "One board for leads, proposals and payments. Open an opportunity, move a stage, activate when ready.",
    activate: "Activate my Grow Hub",
    captureTitle: "Keep this preview",
    captureBody: "Leave your email — we attach the recommended plan. No card required.",
    first: "First name",
    email: "Email",
    company: "Company (optional)",
    softCta: "Send my activation plan",
    saving: "Sending…",
    saved: "Got it. We will reach out with your Grow Hub next step.",
    saveError: "Could not send. Retry or email serviceclient@blackwayconnect.com.",
    openDeal: "Opportunity detail",
    value: "Value",
    source: "Source",
    nextAction: "Next action",
    advance: "Move one stage",
    advanced: "Opportunity advanced",
    close: "Close",
    recommended: "Recommended for you",
    pipelineLabel: "Québec demo pipeline",
    dealCount: (n) => `${n} opportunities`,
    pipelineValue: "Pipeline value",
    demoHint: "Click an opportunity · advance a stage · activate your hub",
    stages: {
      lead: "Lead",
      qualified: "Qualified",
      proposal: "Proposal",
      closing: "Closing",
      won: "Won",
    },
    planWhy: {
      grow_hub_spark: "Light entry — simple pipeline + 24/7 AI secretary.",
      grow_hub_launch: "Organize early demand without chaos.",
      grow_hub_growth: "The recommended engine to sell and measure every stage.",
      grow_hub_scale: "Multiple teams, markets and journeys — one system.",
      grow_hub_command: "CRM ops + managed acquisition for growing SMBs.",
      grow_hub_partner: "Platform + retainer — agency horsepower, SaaS discipline.",
    },
  },
};

export function formatCad(amount: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

const PLAN_KEYS: PlanKey[] = [
  "grow_hub_spark",
  "grow_hub_launch",
  "grow_hub_growth",
  "grow_hub_scale",
  "grow_hub_command",
  "grow_hub_partner",
];

export function parsePlanParam(raw: string | null): PlanKey | null {
  if (!raw) return null;
  const key = raw.trim() as PlanKey;
  if (PLAN_KEYS.includes(key)) return key;
  const short = raw.trim().toLowerCase();
  if (short === "spark") return "grow_hub_spark";
  if (short === "launch") return "grow_hub_launch";
  if (short === "growth") return "grow_hub_growth";
  if (short === "scale") return "grow_hub_scale";
  if (short === "command") return "grow_hub_command";
  if (short === "partner") return "grow_hub_partner";
  return null;
}

export function planFromScore(score: number): PlanKey {
  if (score >= 85) return "grow_hub_command";
  if (score >= 70) return "grow_hub_scale";
  if (score >= 40) return "grow_hub_growth";
  if (score >= 20) return "grow_hub_launch";
  return "grow_hub_spark";
}
