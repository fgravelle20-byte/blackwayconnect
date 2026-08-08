"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Health = {
  ok: boolean;
  service: string;
  appEnv: string;
  integrations: Record<string, boolean>;
};

export function EngineStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [catalogOk, setCatalogOk] = useState<boolean | null>(null);
  const [planCount, setPlanCount] = useState(0);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
    fetch("/api/commerce/catalog")
      .then(async (r) => {
        setCatalogOk(r.ok);
        if (r.ok) {
          const data = await r.json();
          setPlanCount(data.plans?.length ?? 0);
        }
      })
      .catch(() => setCatalogOk(false));
  }, []);

  const items = health?.integrations ?? {};

  return (
    <Card className="border-primary/30 bg-card/80">
      <CardHeader>
        <CardTitle className="text-lg tracking-wide">ENGINE STATUS</CardTitle>
        <CardDescription>
          {health?.service ?? "NoirRoutes"} · {health?.appEnv ?? "DEV"} — live integration checks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {Object.entries(items).map(([key, ok]) => (
            <Badge key={key} variant={ok ? "default" : "secondary"}>
              {key}: {ok ? "ON" : "OFF"}
            </Badge>
          ))}
          <Badge variant={catalogOk ? "default" : "secondary"}>
            catalog: {catalogOk == null ? "…" : catalogOk ? `ON (${planCount} plans)` : "OFF"}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Salle de contrôle moteur :{" "}
          <Link className="underline text-foreground" href="/en/engine">
            /en/engine
          </Link>
          {" · "}
          <Link className="underline text-foreground" href="/api/engine/status">
            /api/engine/status
          </Link>
        </p>
        {!items.clerk || !items.supabase || !items.stripe ? (
          <p className="text-sm text-muted-foreground">
            Auth/billing OFF tant que Clerk + Stripe ne sont pas dans{" "}
            <code className="text-foreground">apps/web/.env.local</code>. La DB et le catalog
            tournent déjà — ce n&apos;est pas du marketing, c&apos;est la tuyauterie.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Moteur branché — auth, DB et billing prêts.</p>
        )}
      </CardContent>
    </Card>
  );
}
