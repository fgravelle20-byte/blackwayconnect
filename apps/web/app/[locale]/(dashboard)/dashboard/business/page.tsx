import { getTranslations, setRequestLocale } from "next-intl/server";
import { orgHasFeature } from "@/lib/permissions";
import { resolveOrganization } from "@/lib/auth/session";
import { PhaseGate } from "@/components/shared/phase-gate";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  let hasFeature = false;
  try {
    const org = await resolveOrganization();
    if (org) hasFeature = await orgHasFeature(org.id, "has_business_management");
  } catch {
    hasFeature = false;
  }

  return (
    <PhaseGate
      title={t("business")}
      laterPhase={t("laterPhase")}
      gated={t("gated")}
      hasFeature={hasFeature}
    />
  );
}
