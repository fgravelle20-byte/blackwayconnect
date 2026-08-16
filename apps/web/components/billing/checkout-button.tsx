"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { captureEvent } from "@/lib/posthog/client";

export function CheckoutButton({
  planPriceId,
  addOnPriceId,
  label,
  className,
  mode = "subscription",
  uiMode = "embedded",
}: {
  planPriceId?: string;
  addOnPriceId?: string;
  label: string;
  className?: string;
  mode?: "subscription" | "payment";
  uiMode?: "embedded" | "hosted";
}) {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const disabled = loading || (!planPriceId && !addOnPriceId);

  async function handleCheckout() {
    if (!planPriceId && !addOnPriceId) return;
    setLoading(true);
    captureEvent("checkout_started", {
      plan_price_id: planPriceId,
      add_on_price_id: addOnPriceId,
      mode,
      ui_mode: uiMode,
    });

    try {
      if (uiMode === "embedded") {
        const qs = new URLSearchParams({ mode });
        if (planPriceId) qs.set("plan_price_id", planPriceId);
        if (addOnPriceId) qs.set("add_on_price_id", addOnPriceId);
        router.push(`/checkout?${qs.toString()}`);
        return;
      }

      const body: Record<string, string> = { locale, mode, ui_mode: "hosted" };
      if (planPriceId) body.plan_price_id = planPriceId;
      if (addOnPriceId) body.add_on_price_id = addOnPriceId;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      console.error("Checkout failed", data.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button className={cn(className)} onClick={handleCheckout} disabled={disabled}>
      {loading ? "Loading…" : label}
    </Button>
  );
}
