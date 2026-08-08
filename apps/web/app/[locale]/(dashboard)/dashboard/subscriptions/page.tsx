import { auth } from "@clerk/nextjs/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { formatCents } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const { orgId } = await auth();
  if (!orgId) return <EmptyState title={t("noOrg")} />;

  try {
    const sb = createAdminSupabaseClient();
    const { data: org } = await sb
      .from("organizations")
      .select("id, plan_tier")
      .eq("clerk_org_id", orgId)
      .maybeSingle();
    if (!org) return <EmptyState title={t("empty")} description="Complete onboarding to link an organization." />;

    const { data: subs } = await sb
      .from("subscriptions")
      .select("*, plans(name, tier)")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false });

    const [{ data: addOns }, { data: addOnPrices }] = await Promise.all([
      sb.from("add_ons").select("id, name, description, type, is_active").eq("is_active", true),
      sb.from("add_on_prices").select("id, add_on_id, amount_cents, is_active").eq("is_active", true),
    ]);

    const catalogAddOns = (addOns ?? [])
      .map((a) => {
        const price = (addOnPrices ?? []).find((pr) => pr.add_on_id === a.id);
        if (!price) return null;
        return { ...a, priceId: price.id, amount_cents: price.amount_cents };
      })
      .filter((a): a is NonNullable<typeof a> => Boolean(a));

    return (
      <div className="space-y-8">
        {!subs?.length ? (
          <EmptyState
            title={t("empty")}
            description="No subscription on file yet. Upgrade from Billing or Pricing."
          />
        ) : (
          <ul className="space-y-3">
            {subs.map((s) => {
              const planRel = s.plans as { name?: string; tier?: string } | { name?: string; tier?: string }[] | null;
              const plan = Array.isArray(planRel) ? planRel[0] : planRel;
              return (
                <li key={s.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{plan?.name ?? "Plan"}</p>
                    <Badge variant="secondary">{s.status}</Badge>
                    {plan?.tier ? <Badge variant="outline">{plan.tier}</Badge> : null}
                  </div>
                  {s.current_period_end ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Period ends {new Date(s.current_period_end).toLocaleDateString(locale)}
                    </p>
                  ) : null}
                  {s.stripe_subscription_id ? (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {s.stripe_subscription_id}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        {catalogAddOns.length > 0 ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-medium">Add-ons</h2>
              <p className="text-sm text-muted-foreground">
                Purchase add-ons via Stripe Checkout.{" "}
                <Link href="/dashboard/billing" className="underline">
                  Manage billing
                </Link>
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {catalogAddOns.map((a) => (
                <div key={a.id} className="rounded-lg border border-border p-4">
                  <p className="font-medium">{a.name}</p>
                  {a.description ? (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                  ) : null}
                  <p className="mt-2 text-sm">{formatCents(a.amount_cents)}</p>
                  <CheckoutButton
                    addOnPriceId={a.priceId}
                    mode={a.type === "one_time" ? "payment" : "subscription"}
                    label="Add"
                    className="mt-3 w-full"
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  } catch {
    return <EmptyState title={t("empty")} description="Unable to load subscriptions." />;
  }
}
