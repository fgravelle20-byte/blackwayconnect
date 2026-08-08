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

type Website = {
  id: string;
  name: string;
  status: string;
  preview_url: string | null;
  deployment_status: string | null;
  created_at: string;
};

const STATUSES = ["draft", "preview", "published", "deployment_required"] as const;

export function WebsiteBuilderClient() {
  const t = useTranslations("dashboard");
  const [websites, setWebsites] = useState<Website[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<(typeof STATUSES)[number]>("draft");

  async function load() {
    const res = await fetch("/api/websites");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      setWebsites([]);
      return;
    }
    setWebsites(data.websites ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    const res = await fetch("/api/websites", {
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

  async function saveStatus(id: string) {
    setError(null);
    const res = await fetch(`/api/websites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    setEditingId(null);
    await load();
  }

  async function remove(id: string) {
    await fetch(`/api/websites/${id}`, { method: "DELETE" });
    if (editingId === id) setEditingId(null);
    await load();
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("websiteHint")}</p>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("websiteName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={create} disabled={!name.trim()}>
          {t("createWebsite")}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {websites.length === 0 ? (
        <EmptyState title={t("websiteEmpty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("websiteName")}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Deploy</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {websites.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-medium">{w.name}</TableCell>
                <TableCell>
                  {editingId === w.id ? (
                    <Select
                      value={editStatus}
                      onValueChange={(v) => setEditStatus(v as (typeof STATUSES)[number])}
                    >
                      <SelectTrigger className="w-[180px]">
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
                  ) : (
                    w.status
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{w.deployment_status}</TableCell>
                <TableCell className="space-x-2 text-right">
                  {editingId === w.id ? (
                    <Button size="sm" onClick={() => saveStatus(w.id)}>
                      {t("save")}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(w.id);
                        setEditStatus((w.status as (typeof STATUSES)[number]) || "draft");
                      }}
                    >
                      {t("edit")}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(w.id)}>
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
