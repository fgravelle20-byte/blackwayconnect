import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { MarketingSection } from "@/components/marketing/section";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("why");
  return (
    <MarketingSection title={t("title")} subtitle={t("subtitle")}>
      <ul className="space-y-3 text-muted-foreground">
        <li>{t("point1")}</li>
        <li>{t("point2")}</li>
        <li>{t("point3")}</li>
      </ul>
    </MarketingSection>
  );
}
