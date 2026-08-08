"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCents } from "@/lib/utils";
import type { CommerceCatalog } from "@noirroutes/database";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { MarketingSection } from "./section";

type CatalogAddOnRow = CommerceCatalog["add_ons"][number] & {
  category?: string | null;
  headline?: string | null;
  badge?: string | null;
  is_public?: boolean;
  sort_order?: number;
  slug?: string;
};

export function PricingSections() {
  const t = useTranslations("pricing");
  const [catalog, setCatalog] = useState<CommerceCatalog | null>(null);
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/commerce/catalog")
      .then(async (r) => {
        if (!r.ok) throw new Error("catalog_failed");
        return r.json();
      })
      .then((data: CommerceCatalog) => setCatalog(data))
      .catch(() => setError(t("empty")));
  }, [t]);

  if (!catalog && !error) {
    return <p className="px-4 py-20 text-center text-muted-foreground">{t("loading")}</p>;
  }

  if (error && !catalog) {
    return <p className="px-4 py-20 text-center text-muted-foreground">{error}</p>;
  }

  const plans = (catalog?.plans ?? []).filter((p) => p.is_active);
  const offers = catalog?.service_offers ?? [];
  const addOns = (catalog?.add_ons ?? []) as CatalogAddOnRow[];
  const moduleAddOns = addOns
    .filter((a) => a.is_public !== false && (a.category === "module" || a.category === "growth" || a.slug?.startsWith("module_") || a.slug?.startsWith("pack_")))
    .sort((a, b) => (a.sort_order ?? 100) - (b.sort_order ?? 100));
  const packageOffer = offers.find((o) => o.slug === "branding_launch_package");
  const customOffer = offers.find((o) => o.slug === "custom_digital_system");
  const agency = plans.find((p) => p.tier === "agency");
  const enterprise = plans.find((p) => p.tier === "enterprise");
  const automationPlans = plans.filter((p) =>
    ["growth", "business", "scale"].includes(p.tier),
  );

  return (
    <div>
      <MarketingSection title={t("section1")} subtitle={t("subtitle")}>
        <Tabs
          value={interval}
          onValueChange={(v) => setInterval(v as "month" | "year")}
          className="mb-8"
        >
          <TabsList>
            <TabsTrigger value="month">{t("monthly")}</TabsTrigger>
            <TabsTrigger value="year">{t("yearly")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans
            .filter((p) => p.tier !== "enterprise")
            .map((plan) => {
              const price = plan.prices.find(
                (pr) => pr.interval === interval && pr.is_active,
              );
              return (
                <Card key={plan.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.tier === "business" ? (
                        <Badge>{t("popular")}</Badge>
                      ) : null}
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-3xl font-semibold">
                      {price
                        ? formatCents(price.amount_cents, price.currency)
                        : "—"}
                      <span className="text-sm font-normal text-muted-foreground">
                        {interval === "month" ? t("perMonth") : t("perYear")}
                      </span>
                    </p>
                    <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                      {plan.limits.slice(0, 5).map((l) => (
                        <li key={l.id}>
                          {l.limit_key}: {l.value_int === -1 ? "∞" : l.value_int}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {price?.id ? (
                      <CheckoutButton
                        planPriceId={price.id}
                        label={t("checkout")}
                        className="w-full"
                      />
                    ) : (
                      <Button className="w-full" disabled>
                        {t("checkout")}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
        </div>
      </MarketingSection>

      <div id="modules">
        <MarketingSection
          title={t("modulesTitle")}
          subtitle={t("modulesSubtitle")}
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {moduleAddOns.map((addon) => {
              const price = addon.prices?.find((p) => p.is_active);
              return (
                <Card key={addon.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg">{addon.name}</CardTitle>
                      {addon.badge ? <Badge variant="secondary">{addon.badge}</Badge> : null}
                    </div>
                    <CardDescription>{addon.headline || addon.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-2xl font-semibold">
                      {price ? formatCents(price.amount_cents) : "—"}
                      <span className="text-sm font-normal text-muted-foreground">
                        {t("perMonth")}
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{addon.description}</p>
                  </CardContent>
                  <CardFooter>
                    {price?.id ? (
                      <CheckoutButton
                        addOnPriceId={price.id}
                        label={t("buyModule")}
                        className="w-full"
                        mode="subscription"
                      />
                    ) : (
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/sign-up">{t("checkout")}</Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </MarketingSection>
      </div>

      <MarketingSection title={t("section2")}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader>
                <CardTitle className="text-lg">{offer.name}</CardTitle>
                <CardDescription>{offer.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {offer.base_price_cents != null ? (
                  <p className="text-xl font-semibold">
                    {formatCents(offer.base_price_cents)}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("enterprise")}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/request-quote">{t("quote")}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title={t("section3")}>
        {packageOffer ? (
          <Card className="max-w-2xl border-primary/40">
            <CardHeader>
              <CardTitle>{packageOffer.name}</CardTitle>
              <CardDescription>{packageOffer.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {packageOffer.base_price_cents != null ? (
                <p className="text-2xl font-semibold">
                  {formatCents(packageOffer.base_price_cents)}
                </p>
              ) : null}
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/request-quote">{t("quote")}</Link>
              </Button>
            </CardFooter>
          </Card>
        ) : null}
      </MarketingSection>

      <MarketingSection title={t("section4")}>
        <div className="grid gap-4 md:grid-cols-3">
          {automationPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {plan.features
                    .filter((f) => f.enabled)
                    .slice(0, 6)
                    .map((f) => (
                      <li key={f.id}>{f.feature_key}</li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection title={t("section5")}>
        {agency ? (
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>{agency.name}</CardTitle>
              <CardDescription>{agency.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              {(() => {
                const price = agency.prices.find(
                  (p) => p.interval === interval && p.is_active,
                );
                return price?.id ? (
                  <CheckoutButton planPriceId={price.id} label={t("checkout")} />
                ) : null;
              })()}
            </CardFooter>
          </Card>
        ) : null}
      </MarketingSection>

      <MarketingSection title={t("section6")}>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>{enterprise?.name ?? "Enterprise"}</CardTitle>
            <CardDescription>
              {enterprise?.description ?? customOffer?.description}
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-2">
            <Button asChild>
              <Link href="/request-quote">{t("contact")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/studio">{t("quote")}</Link>
            </Button>
          </CardFooter>
        </Card>
      </MarketingSection>
    </div>
  );
}
