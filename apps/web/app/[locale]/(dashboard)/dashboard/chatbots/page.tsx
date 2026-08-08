import { getTranslations, setRequestLocale } from "next-intl/server";
import { orgCanAccessModule } from "@/lib/permissions";
import { resolveOrganization } from "@/lib/auth/session";
import { EmptyState } from "@/components/shared/empty-state";
import { ChatbotsClient } from "@/components/dashboard/chatbots-client";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  let hasFeature = false;
  try {
    const org = await resolveOrganization();
    if (org) {
      hasFeature = await orgCanAccessModule(org.id, "has_chatbots", "max_chatbots");
    }
  } catch {
    hasFeature = false;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t("chatbots")}</h2>
      {hasFeature ? (
        <ChatbotsClient />
      ) : (
        <EmptyState title={t("gated")} description={t("gatedModuleHint")} />
      )}
    </div>
  );
}
