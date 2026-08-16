"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Msg = { role: "assistant" | "user"; content: string };
type Cta = { label: string; href: string };

function visitorId() {
  if (typeof window === "undefined") return "server";
  const key = "bwc_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export function ConversionChatbot() {
  const locale = useLocale() as "en" | "fr";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [cta, setCta] = useState<Cta | undefined>();
  const greeting = useMemo(
    () =>
      locale === "fr"
        ? "Bonjour — je suis le Master Chatbot VORIXA. Je convertis vos questions en plan d'action (site, chatbot, boutique, leads…)."
        : "Hi — I'm the VORIXA Master Chatbot. I turn questions into a buy plan (website, chatbot, store, leads…).",
    [locale],
  );
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: greeting }]);

  useEffect(() => {
    setMessages([{ role: "assistant", content: greeting }]);
  }, [greeting]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat/conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitor_id: visitorId(),
          session_id: sessionId,
          message: text,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              locale === "fr"
                ? "Moteur chat momentanément indisponible. Voyez /pricing ou /setup."
                : "Chat engine temporarily unavailable. See /pricing or /setup.",
          },
        ]);
        return;
      }
      setSessionId(data.session_id);
      setCta(data.cta);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:w-[24rem]">
          <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <div>
              <p className="text-xs font-bold tracking-[0.14em]">MASTER CHATBOT</p>
              <p className="text-[11px] text-muted-foreground">Conversion · VORIXA</p>
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {locale === "fr" ? "Fermer" : "Close"}
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.content.slice(0, 12)}`}
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                  m.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "ml-auto bg-primary text-primary-foreground",
                )}
              >
                {m.content}
              </div>
            ))}
            {cta ? (
              <a
                href={cta.href}
                className="inline-flex rounded-md border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
              >
                {cta.label} →
              </a>
            ) : null}
          </div>
          <div className="flex gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={locale === "fr" ? "Ex: chatbot, boutique, prix…" : "e.g. chatbot, store, pricing…"}
              disabled={loading}
            />
            <Button onClick={send} disabled={loading || !input.trim()}>
              {locale === "fr" ? "Envoyer" : "Send"}
            </Button>
          </div>
        </div>
      ) : null}
      <Button
        size="lg"
        className="rounded-full px-5 shadow-lg"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (locale === "fr" ? "Masquer" : "Hide") : locale === "fr" ? "Chat Conversion" : "Sales Chat"}
      </Button>
    </div>
  );
}
