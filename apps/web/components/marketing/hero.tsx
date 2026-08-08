import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export async function MarketingHero() {
  const t = await getTranslations("home");
  const brand = await getTranslations("brand");

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.18),_transparent_55%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-24 md:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {brand("name")}
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
          {t("title")}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{t("subtitle")}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/pricing">{t("ctaPrimary")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/platform">{t("ctaSecondary")}</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{t("socialProof")}</p>
      </div>
    </section>
  );
}
