"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

type Chatbot = {
  id: string;
  name: string;
  widget_config: Record<string, unknown> | null;
  created_at: string;
};

export function ChatbotsClient() {
  const t = useTranslations("dashboard");
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/chatbots");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      setChatbots([]);
      return;
    }
    setChatbots(data.chatbots ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    const res = await fetch("/api/chatbots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setName("");
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/chatbots/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("chatbotsHint")}</p>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("chatbotName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={create} disabled={!name.trim()}>
          {t("createChatbot")}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {chatbots.length === 0 ? (
        <EmptyState title={t("chatbotsEmpty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("chatbotName")}</TableHead>
              <TableHead>ID</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {chatbots.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{c.id}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                    {t("delete")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
