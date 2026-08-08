"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { captureEvent } from "@/lib/posthog/client";

export function QuoteForm() {
  const t = useTranslations("quote");
  const locale = useLocale();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact_name: fd.get("name"),
        contact_email: fd.get("email"),
        company: fd.get("company"),
        service_type: fd.get("service"),
        description: fd.get("description"),
        locale,
      }),
    });
    if (res.ok) captureEvent("quote_request_submitted");
    setStatus(res.ok ? "ok" : "err");
  }

  if (status === "ok") return <p className="text-sm text-foreground">{t("success")}</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company">{t("company")}</Label>
        <Input id="company" name="company" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="service">{t("service")}</Label>
        <Input id="service" name="service" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea id="description" name="description" required rows={5} />
      </div>
      {status === "err" ? <p className="text-sm text-destructive">{t("error")}</p> : null}
      <Button type="submit" disabled={status === "loading"}>{t("submit")}</Button>
    </form>
  );
}
