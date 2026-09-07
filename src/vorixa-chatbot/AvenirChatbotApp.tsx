import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChatWidget, type ChatWidgetHandle } from "./ChatWidget";
import { ClinicPreview } from "./ClinicPreview";
import { EntityForm } from "./EntityForm";
import { InboxView } from "./InboxView";
import { buildEmbedCode } from "./config";
import { loadState, resetState, saveState } from "./storage";
import type { StudioState, VorixaChatbot } from "./types";
import "./avenir-chatbot.css";

function viewFromPath(pathname: string): "fiche" | "apercu" | "inbox" {
  if (pathname.includes("/apercu")) return "apercu";
  if (pathname.includes("/inbox") || pathname.includes("/leads")) return "inbox";
  return "fiche";
}

const SCENARIO = [
  "Bonjour, je voudrais un rendez-vous pour un examen et un blanchiment.",
  "Marie Tremblay, 450 555-0148, marie.tremblay@example.com",
];

export function AvenirChatbotApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const view = viewFromPath(location.pathname);
  const [state, setState] = useState<StudioState>(() => loadState());
  const [ready, setReady] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const widgetRef = useRef<ChatWidgetHandle | null>(null);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [ready, state]);

  const patchBot = useCallback((chatbot: VorixaChatbot) => {
    setState((s) => ({ ...s, chatbot }));
  }, []);

  function submit() {
    setState((s) => ({
      ...s,
      chatbot: { ...s.chatbot, embed_code: buildEmbedCode(s.chatbot.id) },
    }));
    setSavedAt(Date.now());
  }

  async function playLeadCapture() {
    navigate("/vorixa/chatbot/apercu");
    await new Promise((r) => window.setTimeout(r, 650));
    widgetRef.current?.open();
    for (const step of SCENARIO) {
      await new Promise((r) => window.setTimeout(r, 900));
      widgetRef.current?.send(step);
    }
  }

  async function copyEmbed() {
    try {
      await navigator.clipboard.writeText(state.chatbot.embed_code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="vx-bot">
      <header className="vx-bot__chrome">
        <div className="vx-bot__bar">
          <div className="vx-bot__brandline">
            <Link to="/vorixa/chatbot" className="vx-bot__brand">
              VORIXA
            </Link>
            <p>
              Chatbot configuré pour {state.chatbot.nom} · site {state.chatbot.website_id} · objectif{" "}
              {state.chatbot.objectif}
            </p>
          </div>
          <nav className="vx-bot__nav">
            <NavLink to="/vorixa/chatbot" end>
              Fiche
            </NavLink>
            <NavLink to="/vorixa/chatbot/apercu">Aperçu site</NavLink>
            <NavLink to="/vorixa/chatbot/inbox">
              Inbox ({state.chatbot.leads_captures})
            </NavLink>
          </nav>
          <div className="vx-bot__actions">
            <button type="button" onClick={() => void playLeadCapture()}>
              Jouer la capture de lead
            </button>
            <button type="button" onClick={() => void copyEmbed()}>
              {copied ? "Code copié" : "Copier embed_code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setState(resetState());
                setSavedAt(null);
                navigate("/vorixa/chatbot");
              }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </header>

      {view === "fiche" ? (
        <main className="vx-bot__split">
          <EntityForm state={state} onChange={patchBot} onSubmit={submit} savedAt={savedAt} />
          <aside className="vx-bot__test">
            <h2>Test du widget</h2>
            <p>
              Source entraînée : {state.source.titre} ({state.source.tokens} jetons). Activation
              autorisée.
            </p>
            <div className="vx-bot__teststage">
              <ChatWidget ref={widgetRef} state={state} onState={setState} source="preview" autoOpen />
            </div>
          </aside>
        </main>
      ) : null}

      {view === "apercu" ? (
        <ClinicPreview state={state} onState={setState} widgetRef={widgetRef} />
      ) : null}

      {view === "inbox" ? (
        <main className="vx-bot__page">
          <InboxView state={state} />
        </main>
      ) : null}
    </div>
  );
}
