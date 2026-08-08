"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";

type Assistant = {
  id: string;
  name: string;
  status: string;
  provider: string | null;
};

export function PhoneAssistanceClient() {
  const t = useTranslations("dashboard");
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/phone-assistants");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      setAssistants([]);
      return;
    }
    setAssistants(data.assistants ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    const res = await fetch("/api/phone-assistants", {
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
    await fetch(`/api/phone-assistants/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t("phoneAssistanceHint")}</p>
      <Badge variant="secondary">telephony: integration_required</Badge>
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("phoneAssistantName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={create} disabled={!name.trim()}>
          {t("createPhoneAssistant")}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {assistants.length === 0 ? (
        <EmptyState title={t("phoneAssistanceEmpty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("phoneAssistantName")}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {assistants.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell>{a.status}</TableCell>
                <TableCell className="text-muted-foreground">{a.provider ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>
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
