"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

type Client = { id: string; name: string; email: string | null };
type Deal = { id: string; title: string; value_cents: number; client_id: string | null };

export function BusinessClient() {
  const t = useTranslations("dashboard");
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dealTitle, setDealTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/clients");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      setClients([]);
      setDeals([]);
      return;
    }
    setClients(data.clients ?? []);
    setDeals(data.deals ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createClient() {
    setError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim() || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setName("");
    setEmail("");
    await load();
  }

  async function createDeal() {
    setError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "deal", title: dealTitle.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setDealTitle("");
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">{t("businessHint")}</p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <section className="space-y-4">
        <h3 className="font-semibold">{t("clients")}</h3>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder={t("clientName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder={t("clientEmail")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={createClient} disabled={!name.trim()}>
            {t("createClient")}
          </Button>
        </div>
        {clients.length === 0 ? (
          <EmptyState title={t("clientsEmpty")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("clientName")}</TableHead>
                <TableHead>Email</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.email ?? "—"}</TableCell>
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
      </section>

      <section className="space-y-4">
        <h3 className="font-semibold">{t("deals")}</h3>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder={t("dealTitle")}
            value={dealTitle}
            onChange={(e) => setDealTitle(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={createDeal} disabled={!dealTitle.trim()}>
            {t("createDeal")}
          </Button>
        </div>
        {deals.length === 0 ? (
          <EmptyState title={t("dealsEmpty")} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dealTitle")}</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell>${(d.value_cents / 100).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
