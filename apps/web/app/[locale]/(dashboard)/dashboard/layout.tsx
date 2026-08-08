import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { resolveOrganization } from "@/lib/auth/session";
import { isOnboardingComplete } from "@/modules/onboarding/progress-service";

export const dynamic = "force-dynamic";

function hasClerk() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(
    key &&
      process.env.CLERK_SECRET_KEY &&
      !key.includes("placeholder") &&
      key.length > 20,
  );
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  if (!hasClerk()) {
    redirect(`/${locale}/setup`);
  }

  const org = await resolveOrganization().catch(() => null);
  if (!org) {
    redirect(`/${locale}/onboarding`);
  } else {
    const complete = await isOnboardingComplete(org.id);
    if (!complete) {
      redirect(`/${locale}/onboarding`);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader title={t("overview")} />
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}
