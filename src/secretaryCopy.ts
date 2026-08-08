import type { Lang } from "./copy";

export type SecretaryCopy = {
  launcherLabel: string;
  launcherAria: string;
  title: string;
  subtitle: string;
  badge: string;
  greeting: string;
  placeholder: string;
  send: string;
  close: string;
  typing: string;
  leadTitle: string;
  leadName: string;
  leadEmail: string;
  leadNeed: string;
  leadSubmit: string;
  leadSuccess: string;
  leadError: string;
  leadCta: string;
  error: string;
  quick: { label: string; message: string }[];
};

export const secretaryCopy: Record<Lang, SecretaryCopy> = {
  fr: {
    launcherLabel: "Conseiller 24h",
    launcherAria: "Ouvrir la secrétaire IA BlackWay — disponible 24h/24",
    title: "Secrétaire IA BlackWay",
    subtitle: "Conseiller revenu · disponible 24h/24",
    badge: "24h/24",
    greeting:
      "Bonjour — je suis la secrétaire IA BlackWayConnect, disponible 24h/24. Forfaits Grow Hub, diagnostic Leak Score, ou prise de coordonnées : comment puis-je vous aider ?",
    placeholder: "Votre question…",
    send: "Envoyer",
    close: "Fermer le chat",
    typing: "Réponse en cours…",
    leadTitle: "Laisser vos coordonnées",
    leadName: "Prénom",
    leadEmail: "Courriel",
    leadNeed: "Besoin",
    leadSubmit: "Envoyer à l’équipe",
    leadSuccess: "Reçu. L’équipe vous rejoint sous peu.",
    leadError: "Envoi impossible. Réessayez ou écrivez à serviceclient@blackwayconnect.com.",
    leadCta: "Laisser mes coordonnées",
    error: "Connexion momentanée. Réessayez — je reste disponible 24h/24.",
    quick: [
      { label: "Forfaits", message: "Quels sont les forfaits Grow Hub et les prix ?" },
      { label: "Diagnostic", message: "Comment fonctionne le diagnostic Leak Score ?" },
      { label: "Grow Hub", message: "Expliquez-moi Grow Hub en une minute." },
      { label: "Coordonnées", message: "Je veux laisser mes coordonnées pour un rappel." },
    ],
  },
  en: {
    launcherLabel: "Advisor 24h",
    launcherAria: "Open BlackWay AI secretary — available 24/7",
    title: "BlackWay AI Secretary",
    subtitle: "Revenue advisor · available 24/7",
    badge: "24/7",
    greeting:
      "Hi — I'm BlackWayConnect's AI secretary, available 24/7. Grow Hub plans, Leak Score diagnostic, or leave your details: how can I help?",
    placeholder: "Your question…",
    send: "Send",
    close: "Close chat",
    typing: "Replying…",
    leadTitle: "Leave your details",
    leadName: "First name",
    leadEmail: "Email",
    leadNeed: "Need",
    leadSubmit: "Send to the team",
    leadSuccess: "Received. The team will follow up shortly.",
    leadError: "Could not send. Retry or email serviceclient@blackwayconnect.com.",
    leadCta: "Leave my details",
    error: "Brief connection issue. Try again — I'm still available 24/7.",
    quick: [
      { label: "Plans", message: "What are the Grow Hub plans and prices?" },
      { label: "Diagnostic", message: "How does the Leak Score diagnostic work?" },
      { label: "Grow Hub", message: "Explain Grow Hub in one minute." },
      { label: "Details", message: "I'd like to leave my details for a callback." },
    ],
  },
};
