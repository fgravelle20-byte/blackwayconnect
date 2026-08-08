"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function BillingPortalButton({ locale }: { locale: string }) {
  const t = useTranslations("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setError(data.error || "Portal unavailable");
  }

  return (
    <div className="space-y-2">
      <Button onClick={openPortal} disabled={loading}>
        {t("openPortal")}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
