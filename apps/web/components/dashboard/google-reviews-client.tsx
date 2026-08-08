"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

type Campaign = {
  id: string;
  name: string;
  status: string;
};

export function GoogleReviewsClient() {
  const t = useTranslations("dashboard");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/review-campaigns");
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
    const res = await fetch("/api/review-campaigns", {
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

  async function addRequest() {
    if (!activeId || !contact.trim()) return;
    setError(null);
    const res = await fetch(`/api/review-campaigns/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_contact: contact.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setContact("");
  }

  async function remove(id: string) {
    await fetch(`/api/review-campaigns/${id}`, { method: "DELETE" });
    if (activeId === id) setActiveId(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("googleReviewsHint")}</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">suggestions: suggestion_only</Badge>
        <Badge variant="secondary">never auto-post to Google</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("reviewCampaignName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={create} disabled={!name.trim()}>
          {t("createReviewCampaign")}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {campaigns.length === 0 ? (
        <EmptyState title={t("googleReviewsEmpty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("reviewCampaignName")}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.status}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => setActiveId(c.id)}>
                    {t("addReviewRequest")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                    {t("delete")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {activeId ? (
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Input
            placeholder={t("reviewCustomerContact")}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={addRequest} disabled={!contact.trim()}>
            {t("createReviewRequest")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
