import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type RoiClientRow = {
  client_id: string;
  client_name: string;
  client_email: string | null;
  marketing_spend_cents: number;
  invoice_revenue_cents: number;
  deal_revenue_cents: number;
  manual_revenue_cents: number;
  revenue_cents: number;
  profit_cents: number;
  roi_percent: number | null;
  currency: string;
};

export type RoiDashboard = {
  totals: {
    marketing_spend_cents: number;
    revenue_cents: number;
    profit_cents: number;
    roi_percent: number | null;
    clients_count: number;
    profitable_clients: number;
  };
  clients: RoiClientRow[];
};

function roiPercent(revenueCents: number, spendCents: number): number | null {
  if (spendCents <= 0) return revenueCents > 0 ? null : 0;
  return Math.round(((revenueCents - spendCents) / spendCents) * 10000) / 100;
}

/** Automatic ROI: paid invoices + won deals + manual revenue − marketing spend. */
export async function computeClientRoiDashboard(
  organizationId: string,
): Promise<RoiDashboard> {
  const sb = createAdminSupabaseClient();

  const [
    { data: clients, error: clientsErr },
    { data: expenses, error: expensesErr },
    { data: invoices, error: invoicesErr },
    { data: deals, error: dealsErr },
    { data: stages, error: stagesErr },
    { data: manualRevenue, error: manualErr },
  ] = await Promise.all([
    sb
      .from("clients")
      .select("id, name, email")
      .eq("organization_id", organizationId)
      .order("name"),
    sb
      .from("client_marketing_expenses")
      .select("client_id, amount_cents, currency")
      .eq("organization_id", organizationId),
    sb
      .from("business_invoices")
      .select("client_id, total_cents, status")
      .eq("organization_id", organizationId)
      .eq("status", "paid"),
    sb
      .from("business_deals")
      .select("client_id, value_cents, stage_id")
      .eq("organization_id", organizationId),
    sb
      .from("business_pipeline_stages")
      .select("id, name")
      .eq("organization_id", organizationId),
    sb
      .from("client_revenue_entries")
      .select("client_id, amount_cents, currency, source")
      .eq("organization_id", organizationId),
  ]);

  if (clientsErr) throw clientsErr;
  if (expensesErr) throw expensesErr;
  if (invoicesErr) throw invoicesErr;
  if (dealsErr) throw dealsErr;
  if (stagesErr) throw stagesErr;
  if (manualErr) throw manualErr;

  const wonStageIds = new Set(
    (stages ?? [])
      .filter((s) => /^(won|gagné|gagne|closed.?won)$/i.test(s.name.trim()))
      .map((s) => s.id),
  );

  const spendByClient = new Map<string, number>();
  for (const row of expenses ?? []) {
    if (!row.client_id) continue;
    spendByClient.set(
      row.client_id,
      (spendByClient.get(row.client_id) ?? 0) + (row.amount_cents ?? 0),
    );
  }

  const invoiceByClient = new Map<string, number>();
  for (const row of invoices ?? []) {
    if (!row.client_id) continue;
    invoiceByClient.set(
      row.client_id,
      (invoiceByClient.get(row.client_id) ?? 0) + (row.total_cents ?? 0),
    );
  }

  const dealByClient = new Map<string, number>();
  for (const row of deals ?? []) {
    if (!row.client_id || !row.stage_id || !wonStageIds.has(row.stage_id)) continue;
    dealByClient.set(
      row.client_id,
      (dealByClient.get(row.client_id) ?? 0) + (row.value_cents ?? 0),
    );
  }

  const manualByClient = new Map<string, number>();
  for (const row of manualRevenue ?? []) {
    if (!row.client_id) continue;
    // Auto-synced invoice/deal rows would duplicate live totals — only count manual
    if (row.source && row.source !== "manual") continue;
    manualByClient.set(
      row.client_id,
      (manualByClient.get(row.client_id) ?? 0) + (row.amount_cents ?? 0),
    );
  }

  const currency =
    (expenses ?? [])[0]?.currency ||
    (manualRevenue ?? [])[0]?.currency ||
    "cad";

  const rows: RoiClientRow[] = (clients ?? []).map((client) => {
    const marketing_spend_cents = spendByClient.get(client.id) ?? 0;
    const invoice_revenue_cents = invoiceByClient.get(client.id) ?? 0;
    const deal_revenue_cents = dealByClient.get(client.id) ?? 0;
    const manual_revenue_cents = manualByClient.get(client.id) ?? 0;
    const revenue_cents =
      invoice_revenue_cents + deal_revenue_cents + manual_revenue_cents;
    const profit_cents = revenue_cents - marketing_spend_cents;
    return {
      client_id: client.id,
      client_name: client.name,
      client_email: client.email,
      marketing_spend_cents,
      invoice_revenue_cents,
      deal_revenue_cents,
      manual_revenue_cents,
      revenue_cents,
      profit_cents,
      roi_percent: roiPercent(revenue_cents, marketing_spend_cents),
      currency,
    };
  });

  rows.sort((a, b) => b.profit_cents - a.profit_cents);

  const marketing_spend_cents = rows.reduce((s, r) => s + r.marketing_spend_cents, 0);
  const revenue_cents = rows.reduce((s, r) => s + r.revenue_cents, 0);
  const profit_cents = revenue_cents - marketing_spend_cents;

  return {
    totals: {
      marketing_spend_cents,
      revenue_cents,
      profit_cents,
      roi_percent: roiPercent(revenue_cents, marketing_spend_cents),
      clients_count: rows.length,
      profitable_clients: rows.filter((r) => r.profit_cents > 0).length,
    },
    clients: rows,
  };
}

export async function listMarketingExpenses(organizationId: string, clientId?: string) {
  const sb = createAdminSupabaseClient();
  let q = sb
    .from("client_marketing_expenses")
    .select("id, client_id, amount_cents, currency, channel, spent_on, note, created_at")
    .eq("organization_id", organizationId)
    .order("spent_on", { ascending: false });
  if (clientId) q = q.eq("client_id", clientId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createMarketingExpense(input: {
  organization_id: string;
  client_id: string;
  amount_cents: number;
  channel?: string;
  spent_on?: string;
  note?: string | null;
  currency?: string;
}) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("client_marketing_expenses")
    .insert({
      organization_id: input.organization_id,
      client_id: input.client_id,
      amount_cents: input.amount_cents,
      channel: input.channel ?? "other",
      spent_on: input.spent_on ?? new Date().toISOString().slice(0, 10),
      note: input.note ?? null,
      currency: input.currency ?? "cad",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function createManualRevenue(input: {
  organization_id: string;
  client_id: string;
  amount_cents: number;
  earned_on?: string;
  note?: string | null;
  currency?: string;
}) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("client_revenue_entries")
    .insert({
      organization_id: input.organization_id,
      client_id: input.client_id,
      amount_cents: input.amount_cents,
      source: "manual",
      earned_on: input.earned_on ?? new Date().toISOString().slice(0, 10),
      note: input.note ?? null,
      currency: input.currency ?? "cad",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
