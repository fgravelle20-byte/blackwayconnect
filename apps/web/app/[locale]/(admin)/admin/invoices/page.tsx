import { setRequestLocale } from "next-intl/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { EmptyState } from "@/components/shared/empty-state";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  try {
    const sb = createAdminSupabaseClient();
    const { data, error } = await sb.from("invoices").select("*").limit(50);
    if (error) throw error;
    if (!data?.length) return <EmptyState title="invoices" description="No rows yet." />;
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold capitalize">invoices</h1>
        <pre className="overflow-auto rounded-lg border border-border bg-card p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  } catch {
    return <EmptyState title="invoices" description="Unable to load table." />;
  }
}
