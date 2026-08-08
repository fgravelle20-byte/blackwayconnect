"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Plan = { id: string; name: string; tier: string; slug: string };
type Limit = { id: string; plan_id: string; limit_key: string; value_int: number };
type Feature = { id: string; plan_id: string; feature_key: string; enabled: boolean };
type Price = {
  id: string;
  plan_id: string;
  interval: string;
  amount_cents: number;
  annual_discount_percent: number | null;
  stripe_price_id: string | null;
  is_active: boolean;
};

export function AdminPlansClient({
  plans,
  limits: initialLimits,
  features: initialFeatures,
  prices: initialPrices,
}: {
  plans: Plan[];
  limits: Limit[];
  features: Feature[];
  prices: Price[];
}) {
  const [limits, setLimits] = useState(initialLimits);
  const [features, setFeatures] = useState(initialFeatures);
  const [prices, setPrices] = useState(initialPrices);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/admin/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limits, features, prices }),
    });
    setMessage(res.ok ? "Saved" : "Save failed");
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Plans</h1>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {plans.map((plan) => (
        <section key={plan.id} className="rounded-lg border border-border p-4">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-lg font-medium">{plan.name}</h2>
            <Badge variant="secondary">{plan.tier}</Badge>
          </div>
          <div className="mb-4 space-y-3">
            <h3 className="text-sm font-semibold">Prices (provisional)</h3>
            {prices
              .filter((p) => p.plan_id === plan.id)
              .map((p) => (
                <div
                  key={p.id}
                  className="grid gap-2 rounded-md border border-border/60 p-3 md:grid-cols-2 lg:grid-cols-5"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Interval</span>
                    <span className="text-sm font-medium">{p.interval}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Amount (cents)</span>
                    <Input
                      type="number"
                      className="h-8"
                      value={p.amount_cents}
                      onChange={(e) =>
                        setPrices((prev) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, amount_cents: Number(e.target.value) } : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Annual discount %</span>
                    <Input
                      type="number"
                      className="h-8"
                      min={0}
                      max={100}
                      value={p.annual_discount_percent ?? 0}
                      onChange={(e) =>
                        setPrices((prev) =>
                          prev.map((x) =>
                            x.id === p.id
                              ? { ...x, annual_discount_percent: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Stripe price ID</span>
                    <Input
                      className="h-8 font-mono text-xs"
                      value={p.stripe_price_id ?? ""}
                      placeholder="price_…"
                      onChange={(e) =>
                        setPrices((prev) =>
                          prev.map((x) =>
                            x.id === p.id
                              ? { ...x, stripe_price_id: e.target.value || null }
                              : x,
                          ),
                        )
                      }
                    />
                  </div>
                  <label className="flex items-end gap-2 pb-1 text-sm">
                    <input
                      type="checkbox"
                      checked={p.is_active}
                      onChange={(e) =>
                        setPrices((prev) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, is_active: e.target.checked } : x,
                          ),
                        )
                      }
                    />
                    Active
                  </label>
                </div>
              ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">Limits</h3>
              <div className="space-y-2">
                {limits
                  .filter((l) => l.plan_id === plan.id)
                  .map((l) => (
                    <div key={l.id} className="flex items-center gap-2">
                      <span className="w-48 truncate text-xs text-muted-foreground">{l.limit_key}</span>
                      <Input
                        type="number"
                        className="h-8 w-28"
                        value={l.value_int}
                        onChange={(e) =>
                          setLimits((prev) =>
                            prev.map((x) =>
                              x.id === l.id ? { ...x, value_int: Number(e.target.value) } : x,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Features</h3>
              <div className="space-y-2">
                {features
                  .filter((f) => f.plan_id === plan.id)
                  .map((f) => (
                    <label key={f.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={f.enabled}
                        onChange={(e) =>
                          setFeatures((prev) =>
                            prev.map((x) =>
                              x.id === f.id ? { ...x, enabled: e.target.checked } : x,
                            ),
                          )
                        }
                      />
                      {f.feature_key}
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}