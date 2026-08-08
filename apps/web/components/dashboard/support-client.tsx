"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { captureEvent } from "@/lib/posthog/client";

type Message = { id: string; body: string; created_at: string };
type Ticket = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  support_messages?: Message[];
};

export function SupportClient() {
  const t = useTranslations("dashboard");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/support");
    const data = await res.json();
    setTickets(data.tickets ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    captureEvent("support_ticket_created", { subject });
    setSubject("");
    setBody("");
    if (data.ticket?.id) setSelectedId(data.ticket.id);
    await load();
  }

  async function sendMessage() {
    if (!selectedId || !reply.trim()) return;
    setError(null);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id: selectedId, body: reply.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to send message");
      return;
    }
    setReply("");
    await load();
  }

  const selected = tickets.find((tkt) => tkt.id === selectedId);
  const messages = selected?.support_messages ?? [];

  return (
    <div className="space-y-6">
      <div className="max-w-lg space-y-3 rounded-lg border border-border p-4">
        <h2 className="font-medium">{t("newTicket")}</h2>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" />
        <Button onClick={create} disabled={!subject.trim() || !body.trim()}>
          {t("save")}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {tickets.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <ul className="space-y-2">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
                    selectedId === ticket.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <span className="font-medium">{ticket.subject}</span>
                  <span className="ml-2 text-muted-foreground">
                    {ticket.status} · {ticket.priority}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {selected ? (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <h3 className="font-medium">{selected.subject}</h3>
              <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
                {messages.length === 0 ? (
                  <li className="text-muted-foreground">No messages yet.</li>
                ) : (
                  [...messages]
                    .sort(
                      (a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                    )
                    .map((m) => (
                      <li key={m.id} className="rounded bg-muted/40 px-3 py-2">
                        {m.body}
                      </li>
                    ))
                )}
              </ul>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Add a message"
                rows={3}
              />
              <Button onClick={sendMessage} disabled={!reply.trim()}>
                {t("sendMessage")}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
