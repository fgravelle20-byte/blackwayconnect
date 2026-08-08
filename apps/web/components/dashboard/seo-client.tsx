"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

type Campaign = {
  id: string;
  name: string;
  created_at: string;
};

export function SeoClient() {
  const t = useTranslations("dashboard");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/seo/campaigns");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      setCampaigns([]);
      return;
    }
    setCampaigns(data.campaigns ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    const res = await fetch("/api/seo/campaigns", {
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
    await fetch(`/api/seo/campaigns/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("seoHint")}</p>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("seoCampaignName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={create} disabled={!name.trim()}>
          {t("createSeoCampaign")}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {campaigns.length === 0 ? (
        <EmptyState title={t("seoEmpty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("seoCampaignName")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
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
