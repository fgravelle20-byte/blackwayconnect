import { getTranslations, setRequestLocale } from "next-intl/server";
import { orgCanAccessModule } from "@/lib/permissions";
import { resolveOrganization } from "@/lib/auth/session";
import { EmptyState } from "@/components/shared/empty-state";
import { GoogleReviewsClient } from "@/components/dashboard/google-reviews-client";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  let hasFeature = false;
  try {
    const org = await resolveOrganization();
    if (org) {
      hasFeature = await orgCanAccessModule(
        org.id,
        "has_google_reviews",
        "max_review_campaigns",
      );
    }
  } catch {
    hasFeature = false;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t("googleReviews")}</h2>
      {hasFeature ? (
        <GoogleReviewsClient />
      ) : (
        <EmptyState title={t("gated")} description={t("gatedModuleHint")} />
      )}
    </div>
  );
}
