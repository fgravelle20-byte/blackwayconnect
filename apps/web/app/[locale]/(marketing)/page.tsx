import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingHero } from "@/components/marketing/hero";
import { MarketingSection } from "@/components/marketing/section";
import { EngineStatus } from "@/components/shared/engine-status";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      <MarketingHero />
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <EngineStatus />
      </section>
      <MarketingSection title={t("feature1Title")} subtitle={t("feature1Body")}>
        <ul className="grid gap-10 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n} className="space-y-2 border-t border-border pt-6">
              <h3 className="text-lg font-medium tracking-tight">
                {n === 1 ? t("feature1Title") : n === 2 ? t("feature2Title") : t("feature3Title")}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {n === 1 ? t("feature1Body") : n === 2 ? t("feature2Body") : t("feature3Body")}
              </p>
            </li>
          ))}
        </ul>
      </MarketingSection>
    </>
  );
}
