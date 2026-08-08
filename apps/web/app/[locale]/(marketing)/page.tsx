import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingHero } from "@/components/marketing/hero";
import { MarketingSection } from "@/components/marketing/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      <MarketingHero />
      <MarketingSection title={t("feature1Title")} subtitle={t("feature1Body")}>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {n === 1 ? t("feature1Title") : n === 2 ? t("feature2Title") : t("feature3Title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {n === 1 ? t("feature1Body") : n === 2 ? t("feature2Body") : t("feature3Body")}
              </CardContent>
            </Card>
          ))}
        </div>
      </MarketingSection>
    </>
  );
}
