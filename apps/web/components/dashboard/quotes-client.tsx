"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCents } from "@/lib/utils";
import { captureEvent } from "@/lib/posthog/client";

type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";
type Quote = { id: string; title: string; status: QuoteStatus; total_cents: number };

const STATUSES: QuoteStatus[] = ["draft", "sent", "accepted", "rejected", "expired"];

export function QuotesClient() {
  const t = useTranslations("dashboard");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/quotes");
    const data = await res.json();
    setQuotes(data.quotes ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, total_cents: 0 }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    captureEvent("quote_submitted", { title });
    setTitle("");
    await load();
  }

  async function updateStatus(id: string, status: QuoteStatus) {
    setError(null);
    const res = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update status");
      return;
    }
    await load();
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to delete quote");
      return;
    }
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quote title"
          className="max-w-sm"
        />
        <Button onClick={create} disabled={!title.trim()}>
          {t("save")}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {quotes.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => (
              <TableRow key={q.id}>
                <TableCell>{q.title}</TableCell>
                <TableCell>
                  <Select
                    value={q.status}
                    onValueChange={(v) => updateStatus(q.id, v as QuoteStatus)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{formatCents(q.total_cents)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => remove(q.id)}>
                    Delete
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
