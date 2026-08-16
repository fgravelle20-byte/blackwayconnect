import { getTranslations, setRequestLocale } from "next-intl/server";
import { orgCanAccessModule } from "@/lib/permissions";
import { resolveOrganization } from "@/lib/auth/session";
import { EmptyState } from "@/components/shared/empty-state";
import { RoiDashboardClient } from "@/components/dashboard/roi-dashboard-client";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  let hasFeature = false;
  try {
    const org = await resolveOrganization();
    if (org) hasFeature = await orgCanAccessModule(org.id, "has_business_management");
  } catch {
    hasFeature = false;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{t("roi")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("roiSubtitle")}</p>
      </div>
      {hasFeature ? (
        <RoiDashboardClient />
      ) : (
        <EmptyState title={t("gated")} description={t("gatedModuleHint")} />
      )}
    </div>
  );
}
