"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCents } from "@/lib/utils";

type Invoice = {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
};

export function InvoicesClient() {
  const t = useTranslations("dashboard");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/invoices");
    const data = await res.json();
    setInvoices(data.invoices ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createDraft() {
    setError(null);
    const total_cents = Math.max(0, Math.round(Number(amount) * 100) || 0);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || "Draft invoice",
        total_cents,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setTitle("");
    setAmount("0");
    await load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Invoice description"
          className="max-w-xs"
        />
        <Input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount (CAD)"
          type="number"
          min="0"
          step="0.01"
          className="w-32"
        />
        <Button onClick={createDraft}>{t("createInvoice")}</Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {invoices.length === 0 ? (
        <EmptyState title={t("empty")} description="No business invoices yet. Create a draft above." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs">{inv.id.slice(0, 8)}…</TableCell>
                <TableCell>{inv.status}</TableCell>
                <TableCell>{formatCents(inv.total_cents ?? 0)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
