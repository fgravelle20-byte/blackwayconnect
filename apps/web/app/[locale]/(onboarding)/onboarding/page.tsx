import { setRequestLocale } from "next-intl/server";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { resolveOrganization } from "@/lib/auth/session";
import {
  getOnboardingTemplates,
  getOrgPlanTier,
  orgHasActiveSubscription,
} from "@/modules/onboarding/progress-service";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const org = await resolveOrganization().catch(() => null);
  const planTier = org ? await getOrgPlanTier(org.id).catch(() => "starter") : "starter";
  const templates = await getOnboardingTemplates(planTier).catch(() => undefined);
  const hasActiveSubscription = org
    ? await orgHasActiveSubscription(org.id).catch(() => false)
    : false;
  const checkoutSuccess = sp.checkout === "success";

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-16">
      <OnboardingWizard
        initialSteps={templates}
        planTier={planTier}
        checkoutSuccess={checkoutSuccess}
        hasActiveSubscription={hasActiveSubscription}
      />
    </div>
  );
}
