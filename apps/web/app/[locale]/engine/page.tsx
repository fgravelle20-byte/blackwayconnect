"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type EngineStatusPayload = {
  ok: boolean;
  motor: string;
  service?: string;
  appEnv?: string;
  integrations?: Record<string, boolean>;
  counts?: Record<string, number>;
  plans?: { tier: string; name: string; slug: string; is_public: boolean }[];
  modules?: { slug: string; name: string; category: string | null; unlocks_feature: string | null }[];
  apis?: string[];
  journey?: string[];
  platform?: string;
  error?: string;
  reason?: string;
  time?: string;
};

export default function EnginePage() {
  const [data, setData] = useState<EngineStatusPayload | null>(null);

  useEffect(() => {
    fetch("/api/engine/status")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ ok: false, motor: "UNREACHABLE" }));
  }, []);

  if (!data) {
    return <p className="p-8 text-muted-foreground">Booting motor telemetry…</p>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-bold tracking-[0.2em] text-primary">BLACKWAYCONNECT · ENGINE</p>
        <h1 className="text-3xl font-semibold tracking-tight">MASTER ENGINE — plateforme autonome</h1>
        <p className="text-sm text-muted-foreground">
          Parcours bout-en-bout : acquisition → onboarding → entitlements → modules CRUD → billing.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant={data.ok ? "default" : "secondary"}>MOTOR: {data.motor}</Badge>
          <Badge variant="secondary">{data.platform ?? "ENGINE"}</Badge>
          <Badge variant="secondary">ENV: {data.appEnv ?? "—"}</Badge>
          {data.time ? <Badge variant="outline">{data.time}</Badge> : null}
        </div>
      </header>

      {(data.journey ?? []).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Parcours autonome</CardTitle>
            <CardDescription>Du premier message jusqu&apos;à l&apos;exécution des modules</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              {data.journey!.map((step) => (
                <li key={step}>{step.replace(/^\d+\.\s*/, "")}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {data.error || data.reason ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Blocage moteur</CardTitle>
            <CardDescription>{data.error || data.reason}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(data.integrations ?? {}).map(([k, v]) => (
          <Card key={k}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{k}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{v ? "ON" : "OFF"}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(data.counts ?? {}).map(([k, v]) => (
          <Card key={k}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{k}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{v}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Forfaits (DB)</CardTitle>
            <CardDescription>Source de vérité commerce</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data.plans ?? []).map((p) => (
              <div key={p.slug} className="flex items-center justify-between border-b border-border py-2 text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{p.tier}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Modules à l&apos;unité (DB)</CardTitle>
            <CardDescription>Achat module / packs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data.modules ?? []).map((m) => (
              <div key={m.slug} className="flex items-center justify-between border-b border-border py-2 text-sm">
                <span className="font-medium">{m.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{m.slug}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>APIs moteur</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1 font-mono text-xs text-muted-foreground sm:grid-cols-2">
            {(data.apis ?? []).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {!data.integrations?.clerk ? (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle>Prochaine étape tuyauterie</CardTitle>
            <CardDescription>
              Collez vos clés Clerk (et Stripe test) dans <code>apps/web/.env.local</code>, puis
              redémarrez <code>pnpm --filter @noirroutes/web dev</code>. Le dashboard org-scoped
              s&apos;allumera ensuite.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
