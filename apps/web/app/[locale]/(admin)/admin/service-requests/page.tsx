import { setRequestLocale } from "next-intl/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminServiceRequestsClient } from "@/components/admin/service-requests-client";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  try {
    const sb = createAdminSupabaseClient();
    const { data, error } = await sb
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return <AdminServiceRequestsClient initialRequests={data ?? []} />;
  } catch {
    return <EmptyState title="service-requests" description="Unable to load table." />;
  }
}
