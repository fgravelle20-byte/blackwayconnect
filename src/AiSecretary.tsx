import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLang } from "./i18n";
import { checkoutUrl, type PlanKey } from "./stripeConfig";
import { secretaryCopy } from "./secretaryCopy";

type ChatAction =
  | { type: "navigate"; path: string; label: string }
  | { type: "checkout"; plan: PlanKey; label: string }
  | { type: "capture_lead" }
  | { type: "contact" };

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ChatAction[];
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AiSecretary() {
  const { lang, path } = useLang();
  const sc = secretaryCopy[lang];
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [leadStatus, setLeadStatus] = useState<"idle" | "ok" | "err">("idle");
  const [leadPending, setLeadPending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const greeted = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (!greeted.current) {
      greeted.current = true;
      setMessages([
        {
          id: uid(),
          role: "assistant",
          content: sc.greeting,
          actions: [
            { type: "navigate", path: "/forfaits", label: sc.quick[0].label },
            { type: "navigate", path: "/diagnostic", label: sc.quick[1].label },
            { type: "capture_lead" },
          ],
        },
      ]);
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [open, sc]);

  useEffect(() => {
    const onOpen = (ev: Event) => {
      const detail = (ev as CustomEvent<{ prompt?: string }>).detail;
      setOpen(true);
      if (detail?.prompt) {
        window.setTimeout(() => {
          void sendText(detail.prompt!);
        }, 220);
      }
    };
    window.addEventListener("bw-open-secretary", onOpen as EventListener);
    return () => window.removeEventListener("bw-open-secretary", onOpen as EventListener);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Reset greeting content language if panel empty after lang switch while closed
    if (!open && messages.length === 1 && messages[0]?.role === "assistant") {
      setMessages([{ ...messages[0], content: sc.greeting }]);
    }
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, pending, showLead]);

  async function sendText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    const userMsg: Msg = { id: uid(), role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error("chat");
      const data = (await res.json()) as {
        reply?: string;
        actions?: ChatAction[];
      };
      const actions = Array.isArray(data.actions) ? data.actions : [];
      if (actions.some((a) => a.type === "capture_lead")) setShowLead(true);
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: data.reply || sc.error,
          actions,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: sc.error },
      ]);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void sendText(input);
  }

  async function onLead(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLeadPending(true);
    setLeadStatus("idle");
    const fd = new FormData(e.currentTarget);
    const prenom = String(fd.get("prenom") || "");
    const email = String(fd.get("email") || "");
    const need = String(fd.get("need") || "");
    const summary = [
      "bw_source=ai_secretary_24h",
      need ? `need=${need}` : null,
      `lang=${lang}`,
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom,
          nom: "",
          email,
          entreprise: "",
          telephone: "",
          message: summary.slice(0, 2000),
          forfait: "grow_hub_growth",
          source: "campagne",
          urgence: "normal",
          langue: lang,
          bw_ref: "site",
          icp: "oui_pme",
        }),
      });
      if (!res.ok) throw new Error("lead");
      setLeadStatus("ok");
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: sc.leadSuccess },
      ]);
      e.currentTarget.reset();
      window.setTimeout(() => setShowLead(false), 1200);
    } catch {
      setLeadStatus("err");
    } finally {
      setLeadPending(false);
    }
  }

  function renderActions(actions?: ChatAction[]) {
    if (!actions?.length) return null;
    return (
      <div className="bw-agent__actions">
        {actions.map((a, i) => {
          if (a.type === "navigate") {
            return (
              <Link
                key={`${a.path}-${i}`}
                className="bw-agent__chip"
                to={path(a.path)}
                onClick={() => setOpen(false)}
              >
                {a.label}
              </Link>
            );
          }
          if (a.type === "checkout") {
            return (
              <a
                key={`${a.plan}-${i}`}
                className="bw-agent__chip bw-agent__chip--brand"
                href={checkoutUrl(a.plan, {
                  source: "site_web",
                  lang,
                  content: "ai_secretary_24h",
                })}
                target="_blank"
                rel="noopener noreferrer"
              >
                {a.label}
              </a>
            );
          }
          if (a.type === "capture_lead") {
            return (
              <button
                key={`lead-${i}`}
                type="button"
                className="bw-agent__chip"
                onClick={() => setShowLead(true)}
              >
                {sc.leadCta}
              </button>
            );
          }
          return (
            <Link
              key={`contact-${i}`}
              className="bw-agent__chip"
              to={path("/contact")}
              onClick={() => setOpen(false)}
            >
              {sc.leadCta}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`bw-agent${open ? " bw-agent--open" : ""}`}>
      <button
        type="button"
        className="bw-agent__launcher"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={sc.launcherAria}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="bw-agent__pulse" aria-hidden />
        <span className="bw-agent__launcher-mark" aria-hidden>
          BW
        </span>
        <span className="bw-agent__launcher-text">
          <strong>{sc.launcherLabel}</strong>
          <em>{sc.badge}</em>
        </span>
      </button>

      <div
        id={panelId}
        className="bw-agent__panel"
        role="dialog"
        aria-modal="false"
        aria-label={sc.title}
        hidden={!open}
      >
        <header className="bw-agent__head">
          <div>
            <p className="bw-agent__title">{sc.title}</p>
            <p className="bw-agent__sub">{sc.subtitle}</p>
          </div>
          <button
            type="button"
            className="bw-agent__close"
            aria-label={sc.close}
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </header>

        <div className="bw-agent__quick" aria-label="Suggestions">
          {sc.quick.map((q) => (
            <button
              key={q.label}
              type="button"
              className="bw-agent__chip"
              disabled={pending}
              onClick={() => void sendText(q.message)}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="bw-agent__messages" ref={listRef}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`bw-agent__msg bw-agent__msg--${m.role}`}
            >
              <p>{m.content}</p>
              {m.role === "assistant" ? renderActions(m.actions) : null}
            </div>
          ))}
          {pending ? (
            <p className="bw-agent__typing" aria-live="polite">
              {sc.typing}
            </p>
          ) : null}
        </div>

        {showLead ? (
          <form className="bw-agent__lead" onSubmit={onLead}>
            <p className="bw-agent__lead-title">{sc.leadTitle}</p>
            <label>
              <span>{sc.leadName}</span>
              <input name="prenom" required autoComplete="given-name" />
            </label>
            <label>
              <span>{sc.leadEmail}</span>
              <input name="email" type="email" required autoComplete="email" />
            </label>
            <label>
              <span>{sc.leadNeed}</span>
              <input name="need" required />
            </label>
            <button className="btn btn--primary" type="submit" disabled={leadPending}>
              {leadPending ? "…" : sc.leadSubmit}
            </button>
            {leadStatus === "ok" && <p className="form-status form-status--ok">{sc.leadSuccess}</p>}
            {leadStatus === "err" && <p className="form-status form-status--err">{sc.leadError}</p>}
          </form>
        ) : null}

        <form className="bw-agent__composer" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={sc.placeholder}
            aria-label={sc.placeholder}
            disabled={pending}
            maxLength={1000}
          />
          <button className="btn btn--primary" type="submit" disabled={pending || !input.trim()}>
            {sc.send}
          </button>
        </form>
      </div>
    </div>
  );
}
