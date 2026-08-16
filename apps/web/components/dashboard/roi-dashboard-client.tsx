"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCents } from "@/lib/utils";

type RoiClient = {
  client_id: string;
  client_name: string;
  client_email: string | null;
  marketing_spend_cents: number;
  invoice_revenue_cents: number;
  deal_revenue_cents: number;
  manual_revenue_cents: number;
  revenue_cents: number;
  profit_cents: number;
  roi_percent: number | null;
  currency: string;
};

type RoiTotals = {
  marketing_spend_cents: number;
  revenue_cents: number;
  profit_cents: number;
  roi_percent: number | null;
  clients_count: number;
  profitable_clients: number;
};

type ClientOption = { id: string; name: string };

export function RoiDashboardClient() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [totals, setTotals] = useState<RoiTotals | null>(null);
  const [rows, setRows] = useState<RoiClient[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [channel, setChannel] = useState("ads");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"expense" | "revenue">("expense");
  const [saving, setSaving] = useState(false);

  const currency = useMemo(() => rows[0]?.currency ?? "cad", [rows]);

  async function load() {
    setError(null);
    const [roiRes, clientsRes] = await Promise.all([
      fetch("/api/business/roi"),
      fetch("/api/clients"),
    ]);
    const roi = await roiRes.json();
    const clientPayload = await clientsRes.json();
    if (!roiRes.ok) {
      setError(roi.error || "Failed");
      setTotals(null);
      setRows([]);
      return;
    }
    setTotals(roi.totals);
    setRows(roi.clients ?? []);
    setClients(
      (clientPayload.clients ?? []).map((c: { id: string; name: string }) => ({
        id: c.id,
        name: c.name,
      })),
    );
    if (!clientId && (clientPayload.clients ?? [])[0]?.id) {
      setClientId(clientPayload.clients[0].id);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitEntry() {
    if (!clientId || !amount.trim()) return;
    const amount_cents = Math.round(Number(amount.replace(",", ".")) * 100);
    if (!Number.isFinite(amount_cents) || amount_cents <= 0) {
      setError(t("roiInvalidAmount"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body =
        mode === "expense"
          ? {
              type: "expense",
              client_id: clientId,
              amount_cents,
              channel,
              note: note.trim() || null,
              currency,
            }
          : {
              type: "revenue",
              client_id: clientId,
              amount_cents,
              note: note.trim() || null,
              currency,
            };
      const res = await fetch("/api/business/roi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setAmount("");
      setNote("");
      if (data.dashboard) {
        setTotals(data.dashboard.totals);
        setRows(data.dashboard.clients ?? []);
      } else {
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  function formatRoi(value: number | null) {
    if (value === null) return t("roiInfinite");
    return `${value.toFixed(1)}%`;
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">{t("roiHint")}</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {totals ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("roiMarketingSpend")}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCents(totals.marketing_spend_cents, currency, locale)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("roiRevenue")}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatCents(totals.revenue_cents, currency, locale)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("roiProfit")}
            </p>
            <p
              className={`mt-2 text-2xl font-semibold ${
                totals.profit_cents >= 0 ? "text-emerald-500" : "text-destructive"
              }`}
            >
              {formatCents(totals.profit_cents, currency, locale)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("roiPercent")}
            </p>
            <p className="mt-2 text-2xl font-semibold">{formatRoi(totals.roi_percent)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {totals.profitable_clients}/{totals.clients_count} {t("roiProfitableClients")}
            </p>
          </div>
        </div>
      ) : null}

      <section className="space-y-3 rounded-xl border border-border p-4">
        <h3 className="font-semibold">{t("roiAddEntry")}</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "expense" ? "default" : "outline"}
            onClick={() => setMode("expense")}
          >
            {t("roiExpense")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "revenue" ? "default" : "outline"}
            onClick={() => setMode("revenue")}
          >
            {t("roiManualRevenue")}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">{t("roiSelectClient")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder={t("roiAmount")}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="max-w-[140px]"
          />
          {mode === "expense" ? (
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              <option value="ads">{t("roiChannelAds")}</option>
              <option value="seo">{t("roiChannelSeo")}</option>
              <option value="social">{t("roiChannelSocial")}</option>
              <option value="email">{t("roiChannelEmail")}</option>
              <option value="referral">{t("roiChannelReferral")}</option>
              <option value="events">{t("roiChannelEvents")}</option>
              <option value="content">{t("roiChannelContent")}</option>
              <option value="other">{t("roiChannelOther")}</option>
            </select>
          ) : null}
          <Input
            placeholder={t("roiNote")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={submitEntry} disabled={saving || !clientId || !amount.trim()}>
            {saving ? t("roiSaving") : t("roiSave")}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">{t("roiByClient")}</h3>
        {rows.length === 0 ? (
          <EmptyState title={t("roiEmpty")} description={t("roiEmptyHint")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("clientName")}</TableHead>
                <TableHead>{t("roiMarketingSpend")}</TableHead>
                <TableHead>{t("roiRevenue")}</TableHead>
                <TableHead>{t("roiBreakdown")}</TableHead>
                <TableHead>{t("roiProfit")}</TableHead>
                <TableHead>{t("roiPercent")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.client_id}>
                  <TableCell className="font-medium">
                    <div>{row.client_name}</div>
                    <div className="text-xs text-muted-foreground">{row.client_email ?? "—"}</div>
                  </TableCell>
                  <TableCell>
                    {formatCents(row.marketing_spend_cents, row.currency, locale)}
                  </TableCell>
                  <TableCell>{formatCents(row.revenue_cents, row.currency, locale)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>
                      {t("roiInvoices")}:{" "}
                      {formatCents(row.invoice_revenue_cents, row.currency, locale)}
                    </div>
                    <div>
                      {t("roiDeals")}: {formatCents(row.deal_revenue_cents, row.currency, locale)}
                    </div>
                    <div>
                      {t("roiManual")}:{" "}
                      {formatCents(row.manual_revenue_cents, row.currency, locale)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.profit_cents >= 0 ? "default" : "destructive"}>
                      {formatCents(row.profit_cents, row.currency, locale)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatRoi(row.roi_percent)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
