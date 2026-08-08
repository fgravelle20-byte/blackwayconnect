import { setRequestLocale } from "next-intl/server";
import { BillingPortalButton } from "@/components/dashboard/billing-portal-button";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { resolveOrganization } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const org = await resolveOrganization();
  let subscription: {
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean | null;
    plan_id: string | null;
    plans: { name: string; tier: string } | { name: string; tier: string }[] | null;
  } | null = null;
  let addOnItems: {
    id: string;
    quantity: number;
    name: string;
  }[] = [];
  let upsellPlans: {
    id: string;
    name: string;
    description: string | null;
    tier: string;
    priceId: string;
    amount_cents: number;
  }[] = [];
  let upsellAddOns: {
    id: string;
    name: string;
    description: string | null;
    priceId: string;
    amount_cents: number;
    type: string;
  }[] = [];

  if (org) {
    const sb = createAdminSupabaseClient();
    const { data } = await sb
      .from("subscriptions")
      .select("id, status, current_period_end, cancel_at_period_end, plan_id, plans(name, tier)")
      .eq("organization_id", org.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    subscription = data;

    const { data: purchased } = await sb
      .from("customer_add_ons")
      .select("id, quantity, status, add_ons(name)")
      .eq("organization_id", org.id)
      .eq("status", "active");

    addOnItems = (purchased ?? []).map((item) => {
      const addonRel = item.add_ons as
        | { name: string }
        | { name: string }[]
        | null;
      const addon = Array.isArray(addonRel) ? addonRel[0] : addonRel;
      return {
        id: item.id,
        quantity: item.quantity ?? 1,
        name: addon?.name ?? "Add-on",
      };
    });

    const [{ data: plans }, { data: planPrices }, { data: addOns }, { data: addOnPrices }] =
      await Promise.all([
        sb.from("plans").select("id, name, description, tier, is_public, is_active").eq("is_active", true).eq("is_public", true),
        sb.from("plan_prices").select("id, plan_id, amount_cents, interval, is_active").eq("is_active", true).eq("interval", "month"),
        sb.from("add_ons").select("id, name, description, type, is_active").eq("is_active", true),
        sb.from("add_on_prices").select("id, add_on_id, amount_cents, interval, is_active").eq("is_active", true),
      ]);

    upsellPlans = (plans ?? [])
      .filter((p) => p.tier !== org.plan_tier)
      .map((p) => {
        const price = (planPrices ?? []).find((pr) => pr.plan_id === p.id);
        if (!price) return null;
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          tier: p.tier,
          priceId: price.id,
          amount_cents: price.amount_cents,
        };
      })
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .slice(0, 4);

    upsellAddOns = (addOns ?? [])
      .map((a) => {
        const price = (addOnPrices ?? []).find((pr) => pr.add_on_id === a.id);
        if (!price) return null;
        return {
          id: a.id,
          name: a.name,
          description: a.description,
          priceId: price.id,
          amount_cents: price.amount_cents,
          type: a.type,
        };
      })
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .slice(0, 6);
  }

  const planRel = subscription?.plans;
  const plan = Array.isArray(planRel) ? planRel[0] : planRel;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Current plan and billing status for your NoirRoutes organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!org ? (
            <p className="text-muted-foreground">No organization resolved. Complete onboarding first.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Plan tier:</span>
                <Badge variant="secondary">{org.plan_tier}</Badge>
                {plan?.name ? <Badge>{plan.name}</Badge> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={
                    subscription?.status === "active" || subscription?.status === "trialing"
                      ? "default"
                      : "outline"
                  }
                >
                  {subscription?.status ?? "none"}
                </Badge>
                {subscription?.cancel_at_period_end ? (
                  <span className="text-muted-foreground">Cancels at period end</span>
                ) : null}
              </div>
              {subscription?.current_period_end ? (
                <p className="text-muted-foreground">
                  Current period ends{" "}
                  {new Date(subscription.current_period_end).toLocaleDateString(locale)}
                </p>
              ) : null}
              {!subscription ? (
                <p className="text-muted-foreground">
                  No subscription on file. Choose a plan from Pricing to get started.
                </p>
              ) : null}
              {addOnItems.length > 0 ? (
                <div className="pt-2">
                  <p className="mb-2 font-medium">Active add-ons</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {addOnItems.map((item) => (
                      <li key={item.id}>
                        {item.name}
                        {item.quantity > 1 ? ` × ${item.quantity}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {org && !subscription ? (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade</CardTitle>
            <CardDescription>Subscribe to a plan to unlock the full platform.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {upsellPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No public plans in the catalog yet.{" "}
                <Link href="/pricing" className="underline">
                  View pricing
                </Link>
              </p>
            ) : (
              upsellPlans.map((p) => (
                <div key={p.id} className="rounded border border-border p-3">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCents(p.amount_cents)}/mo
                  </p>
                  <CheckoutButton
                    planPriceId={p.priceId}
                    label="Subscribe"
                    className="mt-2 w-full"
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {org && upsellAddOns.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Add-ons</CardTitle>
            <CardDescription>Extend limits and capabilities for your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upsellAddOns.map((a) => (
              <div key={a.id} className="rounded border border-border p-3">
                <p className="font-medium">{a.name}</p>
                {a.description ? (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                ) : null}
                <p className="mt-2 text-sm">{formatCents(a.amount_cents)}</p>
                <CheckoutButton
                  addOnPriceId={a.priceId}
                  mode={a.type === "one_time" ? "payment" : "subscription"}
                  label="Add"
                  className="mt-2 w-full"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Manage payment methods, invoices, and cancellations in the Stripe Customer Portal.
        </p>
        <div className="flex flex-wrap gap-2">
          <BillingPortalButton locale={locale} />
          <Button asChild variant="outline">
            <Link href="/pricing">View all plans</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
