import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/section";
import { EmptyState } from "@/components/shared/empty-state";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("caseStudies");
  return (
    <MarketingSection title={t("title")} subtitle={t("subtitle")}>
      <EmptyState title={t("empty")} />
    </MarketingSection>
  );
}
