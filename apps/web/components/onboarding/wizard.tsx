"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { captureEvent } from "@/lib/posthog/client";

const FALLBACK_STEPS = ["welcome", "organization", "goals", "complete"] as const;

type TemplateStep = { step_key: string; sort_order: number; plan_tier: string };

function isFormStep(step: string) {
  return !["welcome", "complete"].includes(step);
}

export function OnboardingWizard({
  initialSteps,
  planTier,
  checkoutSuccess,
  hasActiveSubscription,
}: {
  initialSteps?: TemplateStep[];
  planTier?: string;
  checkoutSuccess?: boolean;
  hasActiveSubscription?: boolean;
}) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const steps = useMemo(() => {
    if (initialSteps && initialSteps.length > 0) {
      return initialSteps.map((s) => s.step_key);
    }
    return [...FALLBACK_STEPS];
  }, [initialSteps]);

  const [stepIndex, setStepIndex] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [goals, setGoals] = useState("");
  const [extra, setExtra] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const startedRef = useRef(false);

  const step = steps[stepIndex] ?? "welcome";
  const isLast = stepIndex >= steps.length - 1;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    captureEvent("onboarding_started", {
      plan_tier: planTier ?? "starter",
      checkout_success: Boolean(checkoutSuccess),
      has_active_subscription: Boolean(hasActiveSubscription),
    });
    if (checkoutSuccess) {
      captureEvent("checkout_success_onboarding", {
        plan_tier: planTier ?? "starter",
      });
    }
  }, [checkoutSuccess, hasActiveSubscription, planTier]);

  function goToStep(nextIndex: number) {
    const leaving = steps[stepIndex];
    if (nextIndex > stepIndex) {
      captureEvent("onboarding_step_completed", {
        step: leaving,
        step_index: stepIndex,
        plan_tier: planTier ?? "starter",
      });
    }
    setStepIndex(Math.max(0, Math.min(nextIndex, steps.length - 1)));
  }

  function canContinue(): boolean {
    if (step === "welcome") return true;
    if (step === "organization") return Boolean(orgName.trim() && industry.trim());
    if (step === "goals") return Boolean(goals.trim());
    if (step === "complete") return Boolean(orgName.trim() && goals.trim());
    return true;
  }

  async function finish() {
    if (!orgName.trim() || !goals.trim()) {
      setError("Organization name and goals are required.");
      // Jump to organization if empty
      const orgIdx = steps.indexOf("organization");
      const goalsIdx = steps.indexOf("goals");
      if (!orgName.trim() && orgIdx >= 0) setStepIndex(orgIdx);
      else if (!goals.trim() && goalsIdx >= 0) setStepIndex(goalsIdx);
      return;
    }

    setLoading(true);
    setError(null);
    captureEvent("onboarding_step_completed", {
      step,
      step_index: stepIndex,
      plan_tier: planTier ?? "starter",
    });
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org_name: orgName,
        industry: industry || "general",
        goals,
        notes: extra || undefined,
        plan_tier: planTier,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error || "Failed");
      return;
    }
    captureEvent("onboarding_completed", { plan_tier: planTier ?? "starter" });
    router.push("/dashboard");
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-primary">NoirRoutes</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        {checkoutSuccess ? (
          <p className="mt-3 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
            Payment received — finish setup to unlock your workspace.
          </p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          Step {stepIndex + 1} / {steps.length}: {step}
          {planTier ? ` · ${planTier}` : ""}
        </p>
      </div>

      {step === "welcome" ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set up your NoirRoutes workspace in a few steps.
          </p>
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
        </div>
      ) : null}

      {step === "goals" ? (
        <div className="space-y-2">
          <Label htmlFor="onboarding-goals">{t("goals")}</Label>
          <Textarea
            id="onboarding-goals"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={4}
          />
        </div>
      ) : null}

      {isFormStep(step) && !["organization", "goals"].includes(step) ? (
        <div className="space-y-2">
          <Label htmlFor="onboarding-extra">{step.replace(/_/g, " ")}</Label>
          <Textarea
            id="onboarding-extra"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            rows={3}
            placeholder={`Notes for ${step.replace(/_/g, " ")}`}
          />
        </div>
      ) : null}

      {step === "complete" ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>You&apos;re ready. Confirm to open your dashboard.</p>
          {!goals.trim() ? (
            <div className="space-y-2">
              <Label htmlFor="onboarding-goals-final">{t("goals")}</Label>
              <Textarea
                id="onboarding-goals-final"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={3}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-2">
        {stepIndex > 0 ? (
          <Button variant="outline" onClick={() => goToStep(stepIndex - 1)}>
            Back
          </Button>
        ) : null}
        {isLast || step === "complete" ? (
          <Button className="flex-1" onClick={finish} disabled={loading || !canContinue()}>
            {t("finish")}
          </Button>
        ) : (
          <Button
            className="flex-1"
            disabled={!canContinue()}
            onClick={() => goToStep(stepIndex + 1)}
          >
            Continue
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Locale: {locale}</p>
    </div>
  );
}
