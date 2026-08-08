import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export async function MarketingHero() {
  const t = await getTranslations("home");
  const brand = await getTranslations("brand");

  return (
    <section className="relative min-h-[88vh] overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,_rgba(220,38,38,0.28),_transparent_50%),radial-gradient(ellipse_at_90%_20%,_rgba(250,250,250,0.06),_transparent_40%),linear-gradient(180deg,_#0a0a0a_0%,_#121212_55%,_#0a0a0a_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-full max-w-3xl opacity-40 md:opacity-70"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0 18px, rgba(220,38,38,0.07) 18px 19px)",
          maskImage: "linear-gradient(90deg, transparent, black 35%)",
        }}
      />
      <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center gap-6 px-4 py-24 md:py-28">
        <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-foreground md:text-7xl md:leading-[1.05]">
          {brand("name")}
        </h1>
        <p className="text-xl font-medium text-primary md:text-2xl">{brand("slogan")}</p>
        <p className="max-w-xl text-base text-muted-foreground md:text-lg">{t("subtitle")}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild size="lg">
            <Link href="/pricing">{t("ctaPrimary")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/request-quote">{t("ctaSecondary")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
