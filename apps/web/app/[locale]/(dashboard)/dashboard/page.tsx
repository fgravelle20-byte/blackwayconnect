import { auth } from "@clerk/nextjs/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

export default async function OverviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const { orgId } = await auth();

  if (!orgId) {
    return <EmptyState title={t("noOrg")} />;
  }

  let counts = { projects: 0, quotes: 0, tickets: 0, invoices: 0 };
  let available = false;

  try {
    const sb = createAdminSupabaseClient();
    const { data: org } = await sb
      .from("organizations")
      .select("id")
      .eq("clerk_org_id", orgId)
      .maybeSingle();

    if (org) {
      available = true;
      const [projects, quotes, tickets, invoices] = await Promise.all([
        sb.from("projects").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
        sb.from("quotes").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
        sb.from("support_tickets").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
        sb.from("business_invoices").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
      ]);
      counts = {
        projects: projects.count ?? 0,
        quotes: quotes.count ?? 0,
        tickets: tickets.count ?? 0,
        invoices: invoices.count ?? 0,
      };
    }
  } catch {
    available = false;
  }

  if (!available) {
    return <EmptyState title={t("empty")} description="Connect Supabase to see live counts." />;
  }

  const cards = [
    { label: t("projects"), value: counts.projects },
    { label: t("quotes"), value: counts.quotes },
    { label: t("tickets"), value: counts.tickets },
    { label: t("invoices"), value: counts.invoices },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
