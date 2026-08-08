import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/section";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  return <MarketingSection title={t("privacyTitle")} subtitle={t("privacyBody")} />;
}
