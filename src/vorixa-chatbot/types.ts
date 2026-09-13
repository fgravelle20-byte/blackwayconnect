export const OBJECTIFS = [
  "Capture de leads",
  "Support client",
  "Prise de rendez-vous",
  "Informations générales",
] as const;

export type ChatbotObjectif = (typeof OBJECTIFS)[number];

export type VorixaChatbot = {
  id: string;
  website_id: string;
  nom: string;
  avatar_url: string;
  couleur: string;
  message_accueil: string;
  objectif: ChatbotObjectif;
  actif: boolean;
  conversations_total: number;
  leads_captures: number;
  embed_code: string;
};

export type VorixaChatbotSource = {
  id: string;
  chatbot_id: string;
  type: "Texte";
  titre: string;
  contenu: string;
  statut: "Entraîné" | "Brouillon";
  tokens: number;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  at: number;
};

export type VorixaConversation = {
  id: string;
  chatbot_id: string;
  source: "preview" | "site" | "scenario";
  startedAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  leadId?: string;
};

export type VorixaLead = {
  id: string;
  chatbot_id: string;
  conversation_id: string;
  nom: string;
  telephone: string;
  courriel: string;
  besoin: string;
  urgence: boolean;
  createdAt: number;
  statut: "nouveau" | "rappel";
};

export type LeadDraft = {
  nom: string;
  telephone: string;
  courriel: string;
  besoin: string;
  urgence: boolean;
};

export type StudioState = {
  chatbot: VorixaChatbot;
  source: VorixaChatbotSource;
  conversations: VorixaConversation[];
  leads: VorixaLead[];
};
