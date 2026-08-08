import { getTranslations, setRequestLocale } from "next-intl/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");

  const counts: Record<string, number | string> = {
    organizations: "—",
    subscriptions: "—",
    plans: "—",
    tickets: "—",
  };

  try {
    const sb = createAdminSupabaseClient();
    const [orgs, subs, plans, tickets] = await Promise.all([
      sb.from("organizations").select("*", { count: "exact", head: true }),
      sb.from("subscriptions").select("*", { count: "exact", head: true }),
      sb.from("plans").select("*", { count: "exact", head: true }),
      sb.from("support_tickets").select("*", { count: "exact", head: true }),
    ]);
    counts.organizations = orgs.count ?? 0;
    counts.subscriptions = subs.count ?? 0;
    counts.plans = plans.count ?? 0;
    counts.tickets = tickets.count ?? 0;
  } catch {
    // honest empty when DB unavailable
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{t("overview")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(counts).map(([k, v]) => (
          <Card key={k}>
            <CardHeader>
              <CardTitle className="text-sm capitalize text-muted-foreground">{k}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{v}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
