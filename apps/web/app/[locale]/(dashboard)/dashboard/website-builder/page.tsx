import { getTranslations, setRequestLocale } from "next-intl/server";
import { getOrgLimit } from "@/lib/permissions";
import { resolveOrganization } from "@/lib/auth/session";
import { PhaseGate } from "@/components/shared/phase-gate";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  let hasFeature = false;
  try {
    const org = await resolveOrganization();
    if (org) {
      const limit = await getOrgLimit(org.id, "max_websites");
      hasFeature = limit === -1 || limit > 0;
    }
  } catch {
    hasFeature = false;
  }

  return (
    <PhaseGate
      title={t("websiteBuilder")}
      laterPhase={t("laterPhase")}
      gated={t("gated")}
      hasFeature={hasFeature}
    />
  );
}
