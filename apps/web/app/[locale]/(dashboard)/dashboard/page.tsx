import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { resolveOrganization } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { EngineStatus } from "@/components/shared/engine-status";
import { Button } from "@/components/ui/button";

function hasClerk() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(
    key &&
      process.env.CLERK_SECRET_KEY &&
      !key.includes("placeholder") &&
      key.length > 20,
  );
}

export default async function OverviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  if (!hasClerk()) {
    return (
      <div className="space-y-6">
        <EngineStatus />
        <EmptyState title={t("setupRequired")} />
        <Button asChild>
          <Link href={`/${locale}/setup`}>{t("openSetup")}</Link>
        </Button>
      </div>
    );
  }

  const org = await resolveOrganization().catch(() => null);

  if (!org) {
    return (
      <div className="space-y-6">
        <EngineStatus />
        <EmptyState title={t("noOrg")} />
        <Button asChild variant="outline">
          <Link href={`/${locale}/setup`}>{t("openSetup")}</Link>
        </Button>
      </div>
    );
  }

  let counts = { projects: 0, leads: 0, stores: 0, quotes: 0 };
  let available = false;

  try {
    const sb = createAdminSupabaseClient();
    available = true;
    const [projects, leads, stores, quotes] = await Promise.all([
      sb.from("projects").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
      sb.from("leads").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
      sb.from("stores").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
      sb.from("quotes").select("*", { count: "exact", head: true }).eq("organization_id", org.id),
    ]);
    counts = {
      projects: projects.count ?? 0,
      leads: leads.count ?? 0,
      stores: stores.count ?? 0,
      quotes: quotes.count ?? 0,
    };
  } catch {
    available = false;
  }

  const cards = [
    { label: t("projects"), value: counts.projects },
    { label: t("leads"), value: counts.leads },
    { label: t("ecommerce"), value: counts.stores },
    { label: t("quotes"), value: counts.quotes },
  ];

  return (
    <div className="space-y-8">
      <EngineStatus />
      {!available ? (
        <EmptyState title={t("empty")} description="Connect Supabase to see live counts." />
      ) : (
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
      )}
    </div>
  );
}
