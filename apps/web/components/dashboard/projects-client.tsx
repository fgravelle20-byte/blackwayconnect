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
import { captureEvent } from "@/lib/posthog/client";

type Project = { id: string; name: string; type: string; status: string };

export function ProjectsClient() {
  const t = useTranslations("dashboard");
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState<"draft" | "active" | "archived">("active");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data.projects ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed");
      return;
    }
    captureEvent("project_created", { project_id: data.project?.id ?? data.id });
    setName("");
    await load();
  }

  function startEdit(p: Project) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditStatus(
      p.status === "draft" || p.status === "archived" ? p.status : "active",
    );
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/projects/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), status: editStatus }),
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
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (editingId === id) cancelEdit();
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("projectName")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={create} disabled={!name.trim()}>
          {t("createProject")}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {projects.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) =>
              editingId === p.id ? (
                <TableRow key={p.id}>
                  <TableCell>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="max-w-xs"
                    />
                  </TableCell>
                  <TableCell>{p.type}</TableCell>
                  <TableCell>
                    <Select
                      value={editStatus}
                      onValueChange={(v) =>
                        setEditStatus(v as "draft" | "active" | "archived")
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">draft</SelectItem>
                        <SelectItem value="active">active</SelectItem>
                        <SelectItem value="archived">archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="space-x-1">
                    <Button size="sm" onClick={saveEdit} disabled={saving || !editName.trim()}>
                      {t("save")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.type}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell className="space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(p)}>
                      {t("edit")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(p.id)}>
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
