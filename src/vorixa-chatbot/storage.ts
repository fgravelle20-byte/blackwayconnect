import { defaultChatbot, defaultSource } from "./config";
import type { StudioState, VorixaChatbot, VorixaConversation, VorixaLead } from "./types";

const KEY = "vorixa-chatbot-avenir-v1";

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptyState(): StudioState {
  const chatbot = defaultChatbot();
  return {
    chatbot,
    source: defaultSource(chatbot.id),
    conversations: [],
    leads: [],
  };
}

export function loadState(): StudioState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as StudioState;
    if (!parsed?.chatbot?.id) return emptyState();
    return {
      ...emptyState(),
      ...parsed,
      chatbot: { ...defaultChatbot(), ...parsed.chatbot },
      source: parsed.source || defaultSource(parsed.chatbot.id),
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: StudioState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState(): StudioState {
  localStorage.removeItem(KEY);
  return emptyState();
}

export function bumpChatbot(chatbot: VorixaChatbot, patch: Partial<VorixaChatbot>): VorixaChatbot {
  return { ...chatbot, ...patch };
}

export function attachLead(
  state: StudioState,
  conversation: VorixaConversation,
  lead: Omit<VorixaLead, "id" | "chatbot_id" | "conversation_id" | "createdAt" | "statut">,
): { state: StudioState; lead: VorixaLead } {
  const created: VorixaLead = {
    ...lead,
    id: newId("lead"),
    chatbot_id: state.chatbot.id,
    conversation_id: conversation.id,
    createdAt: Date.now(),
    statut: lead.urgence ? "nouveau" : "rappel",
  };
  const conversations = state.conversations.map((c) =>
    c.id === conversation.id ? { ...c, leadId: created.id, updatedAt: Date.now() } : c,
  );
  const next: StudioState = {
    ...state,
    conversations,
    leads: [created, ...state.leads],
    chatbot: {
      ...state.chatbot,
      leads_captures: state.chatbot.leads_captures + 1,
    },
  };
  return { state: next, lead: created };
}
