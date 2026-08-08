"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";

type ServiceRequestStatus =
  | "new"
  | "reviewing"
  | "quoted"
  | "in_progress"
  | "completed"
  | "cancelled";

type ServiceRequest = {
  id: string;
  contact_name: string;
  contact_email: string;
  company: string | null;
  service_type: string | null;
  description: string;
  status: ServiceRequestStatus;
  created_at: string;
};

const STATUSES: ServiceRequestStatus[] = [
  "new",
  "reviewing",
  "quoted",
  "in_progress",
  "completed",
  "cancelled",
];

export function AdminServiceRequestsClient({
  initialRequests,
}: {
  initialRequests: ServiceRequest[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(id: string, status: ServiceRequestStatus) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/studio/service-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setBusyId(null);
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: data.request.status } : r)),
    );
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/studio/service-requests/${id}`, {
      method: "DELETE",
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Delete failed");
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  if (requests.length === 0) {
    return <EmptyState title="service-requests" description="No rows yet." />;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold capitalize">service requests</h1>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <ul className="space-y-3">
        {requests.map((r) => (
          <li
            key={r.id}
            className="space-y-2 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {r.contact_name}{" "}
                  <span className="text-muted-foreground">&lt;{r.contact_email}&gt;</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {r.company || "—"} · {r.service_type || "custom"} ·{" "}
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
              <Badge variant="secondary">{r.status}</Badge>
            </div>
            <p className="text-sm whitespace-pre-wrap">{r.description}</p>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={r.status}
                onValueChange={(v) => updateStatus(r.id, v as ServiceRequestStatus)}
                disabled={busyId === r.id}
              >
                <SelectTrigger className="w-40">
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
              <Button
                variant="outline"
                size="sm"
                disabled={busyId === r.id}
                onClick={() => remove(r.id)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
