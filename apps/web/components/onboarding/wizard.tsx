"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { captureEvent } from "@/lib/posthog/client";

const STEPS = ["welcome", "organization", "goals", "complete"] as const;

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [goals, setGoals] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const startedRef = useRef(false);

  const step = STEPS[stepIndex];

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    captureEvent("onboarding_started");
  }, []);

  function goToStep(nextIndex: number) {
    const leaving = STEPS[stepIndex];
    if (nextIndex > stepIndex) {
      captureEvent("onboarding_step_completed", { step: leaving, step_index: stepIndex });
    }
    setStepIndex(nextIndex);
  }

  async function finish() {
    setLoading(true);
    setError(null);
    captureEvent("onboarding_step_completed", { step: "goals", step_index: stepIndex });
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_name: orgName, industry, goals }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed");
      return;
    }
    captureEvent("onboarding_completed");
    router.push("/dashboard");
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-primary">NoirRoutes</p>
        <h1 className="mt-2 text-3xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Step {stepIndex + 1} / {STEPS.length}: {step}
        </p>
      </div>

      {step === "welcome" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set up your NoirRoutes workspace in a few steps.
          </p>
          <Button className="w-full" onClick={() => goToStep(1)}>
            Continue
          </Button>
        </div>
      ) : null}

      {step === "organization" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="onboarding-org-name">{t("orgName")}</Label>
            <Input
              id="onboarding-org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onboarding-industry">{t("industry")}</Label>
            <Input
              id="onboarding-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => goToStep(0)}>
              Back
            </Button>
            <Button
              className="flex-1"
              disabled={!orgName.trim() || !industry.trim()}
              onClick={() => goToStep(2)}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === "goals" || step === "complete" ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="onboarding-goals">{t("goals")}</Label>
            <Textarea
              id="onboarding-goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              rows={4}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => goToStep(1)}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={finish}
              disabled={loading || !goals.trim()}
            >
              {t("finish")}
            </Button>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">Locale: {locale}</p>
    </div>
  );
}
