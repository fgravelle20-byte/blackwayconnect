import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { emptyDraft, replyTo } from "./knowledge";
import { attachLead, newId } from "./storage";
import type { ChatMessage, LeadDraft, StudioState, VorixaConversation } from "./types";

export type ChatWidgetHandle = {
  open: () => void;
  send: (text: string) => void;
};

type Props = {
  state: StudioState;
  onState: (next: StudioState) => void;
  source: VorixaConversation["source"];
  autoOpen?: boolean;
};

function welcomeMessage(text: string): ChatMessage {
  return { id: newId("msg"), role: "assistant", content: text, at: Date.now() };
}

export const ChatWidget = forwardRef<ChatWidgetHandle, Props>(function ChatWidget(
  { state, onState, source, autoOpen = false },
  ref,
) {
  const bot = state.chatbot;
  const stateRef = useRef(state);
  stateRef.current = state;
  const [open, setOpen] = useState(autoOpen);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState<LeadDraft>(emptyDraft());
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const [conversation, setConversation] = useState<VorixaConversation | null>(null);
  const convRef = useRef(conversation);
  convRef.current = conversation;
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation?.messages, sending, open]);

  function commit(next: StudioState) {
    stateRef.current = next;
    onState(next);
  }

  function sendText(text: string) {
    const msg = text.trim();
    const current = stateRef.current;
    if (!msg || sending || !current.chatbot.actif) return;
    setSending(true);

    let studio = current;
    let conv = convRef.current;
    if (!conv) {
      conv = {
        id: newId("conv"),
        chatbot_id: current.chatbot.id,
        source,
        startedAt: Date.now(),
        updatedAt: Date.now(),
        messages: [welcomeMessage(current.chatbot.message_accueil)],
      };
      studio = {
        ...current,
        conversations: [conv, ...current.conversations],
        chatbot: { ...current.chatbot, conversations_total: current.chatbot.conversations_total + 1 },
      };
    }

    const userMsg: ChatMessage = { id: newId("msg"), role: "user", content: msg, at: Date.now() };
    conv = { ...conv, updatedAt: Date.now(), messages: [...conv.messages, userMsg] };

    const result = replyTo(msg, draftRef.current);
    draftRef.current = result.draft;
    setDraft(result.draft);

    const assistantMsg: ChatMessage = {
      id: newId("msg"),
      role: "assistant",
      content: result.reply,
      at: Date.now(),
    };
    conv = { ...conv, updatedAt: Date.now(), messages: [...conv.messages, assistantMsg] };

    studio = {
      ...studio,
      conversations: [conv, ...studio.conversations.filter((c) => c.id !== conv!.id)],
    };

    if (result.lead) {
      const attached = attachLead(studio, conv, result.lead);
      studio = attached.state;
      conv = { ...conv, leadId: attached.lead.id };
      studio = {
        ...studio,
        conversations: [conv, ...studio.conversations.filter((c) => c.id !== conv!.id)],
      };
    }

    convRef.current = conv;
    setConversation(conv);
    commit(studio);
    setInput("");
    setSending(false);
  }

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    send: sendText,
  }));

  const messages = conversation?.messages ?? [welcomeMessage(bot.message_accueil)];
  const color = bot.couleur || "#7c3aed";

  return (
    <div className="vx-widget" style={{ ["--bot-color" as string]: color }}>
      {open ? (
        <div className="vx-widget__panel" role="dialog" aria-label={bot.nom}>
          <div className="vx-widget__head">
            <span className="vx-widget__avatar" aria-hidden="true">
              {bot.avatar_url ? <img src={bot.avatar_url} alt="" /> : "💬"}
            </span>
            <div>
              <strong>{bot.nom}</strong>
              <p>{bot.actif ? "En ligne" : "Inactif"}</p>
            </div>
            <button type="button" className="vx-widget__x" onClick={() => setOpen(false)} aria-label="Fermer">
              ×
            </button>
          </div>
          <div className="vx-widget__list" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`vx-widget__bubble vx-widget__bubble--${m.role}`}>
                {m.content}
              </div>
            ))}
          </div>
          <form
            className="vx-widget__foot"
            onSubmit={(e) => {
              e.preventDefault();
              sendText(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={bot.actif ? "Écrivez votre message…" : "Chatbot inactif"}
              disabled={!bot.actif}
            />
            <button type="submit" disabled={!bot.actif || !input.trim()}>
              Envoyer
            </button>
          </form>
        </div>
      ) : null}
      <button
        type="button"
        className="vx-widget__launcher"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer le chat" : `Ouvrir ${bot.nom}`}
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
});

ChatWidget.displayName = "ChatWidget";
