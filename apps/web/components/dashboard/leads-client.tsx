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

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  status: string;
  score: number;
};

const SOURCES = [
  "manual",
  "website_form",
  "chatbot",
  "phone_assistance",
  "google_review_campaign",
  "import",
  "quote_request",
  "other",
] as const;

const STATUSES = ["new", "contacted", "qualified", "won", "lost", "archived"] as const;

export function LeadsClient() {
  const t = useTranslations("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [source, setSource] = useState<(typeof SOURCES)[number]>("manual");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<(typeof STATUSES)[number]>("new");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/leads");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load leads");
      setLeads([]);
      return;
    }
    setLeads(data.leads ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || null,
        email: email.trim() || null,
        company: company.trim() || null,
        source,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setName("");
    setEmail("");
    setCompany("");
    await load();
  }

  async function saveStatus(id: string) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editStatus }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Failed to update");
      return;
    }
    setEditingId(null);
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (editingId === id) setEditingId(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("leadsHint")}</p>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("leadName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-[10rem]"
        />
        <Input
          placeholder={t("leadEmail")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="max-w-[12rem]"
        />
        <Input
          placeholder={t("leadCompany")}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="max-w-[10rem]"
        />
        <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={create} disabled={!name.trim() && !email.trim()}>
          {t("createLead")}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {leads.length === 0 ? (
        <EmptyState title={t("empty")} description={t("leadsEmpty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) =>
              editingId === lead.id ? (
                <TableRow key={lead.id}>
                  <TableCell>{lead.name ?? "—"}</TableCell>
                  <TableCell>{lead.email ?? "—"}</TableCell>
                  <TableCell>{lead.company ?? "—"}</TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>
                    <Select
                      value={editStatus}
                      onValueChange={(v) => setEditStatus(v as typeof editStatus)}
                    >
                      <SelectTrigger className="w-32">
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
                  <TableCell className="space-x-1">
                    <Button size="sm" onClick={() => saveStatus(lead.id)} disabled={saving}>
                      {t("save")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={lead.id}>
                  <TableCell>{lead.name ?? "—"}</TableCell>
                  <TableCell>{lead.email ?? "—"}</TableCell>
                  <TableCell>{lead.company ?? "—"}</TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>{lead.status}</TableCell>
                  <TableCell className="space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(lead.id);
                        setEditStatus(
                          STATUSES.includes(lead.status as (typeof STATUSES)[number])
                            ? (lead.status as (typeof STATUSES)[number])
                            : "new",
                        );
                      }}
                    >
                      {t("edit")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(lead.id)}>
                      {t("delete")}
                    </Button>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
