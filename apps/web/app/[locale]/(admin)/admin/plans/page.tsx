import { setRequestLocale } from "next-intl/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { AdminPlansClient } from "@/components/admin/plans-client";
import { EmptyState } from "@/components/shared/empty-state";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  try {
    const sb = createAdminSupabaseClient();
    const [{ data: plans }, { data: limits }, { data: features }, { data: prices }] = await Promise.all([
      sb.from("plans").select("*").order("sort_order"),
      sb.from("plan_limits").select("*"),
      sb.from("plan_features").select("*"),
      sb.from("plan_prices").select("*"),
    ]);
    return (
      <AdminPlansClient
        plans={plans ?? []}
        limits={limits ?? []}
        features={features ?? []}
        prices={prices ?? []}
      />
    );
  } catch {
    return <EmptyState title="Plans unavailable" description="Configure Supabase service role to manage plans." />;
  }
}
