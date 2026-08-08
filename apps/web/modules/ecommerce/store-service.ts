import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { CHECKOUT_STATUS } from "./index";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "store";
}

export async function listStores(organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("stores")
    .select("*, store_products(count)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createStore(input: {
  organization_id: string;
  name: string;
  currency?: string;
  project_id?: string | null;
}) {
  const sb = createAdminSupabaseClient();
  const base = slugify(input.name);
  const slug = `${base}-${Date.now().toString(36).slice(-4)}`;
  const { data, error } = await sb
    .from("stores")
    .insert({
      organization_id: input.organization_id,
      name: input.name,
      slug,
      currency: input.currency ?? "usd",
      project_id: input.project_id ?? null,
      status: "draft",
      checkout_status: CHECKOUT_STATUS,
      settings: {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateStore(
  id: string,
  organizationId: string,
  patch: { name?: string; status?: string; currency?: string; settings?: Record<string, unknown> },
) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("stores")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteStore(id: string, organizationId: string) {
  const sb = createAdminSupabaseClient();
  const { error } = await sb
    .from("stores")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);
  if (error) throw error;
}

export async function listProducts(storeId: string) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("store_products")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createProduct(input: {
  store_id: string;
  name: string;
  description?: string | null;
  price_cents?: number;
  sku?: string | null;
  inventory?: number | null;
}) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("store_products")
    .insert({
      store_id: input.store_id,
      name: input.name,
      description: input.description ?? null,
      price_cents: input.price_cents ?? 0,
      sku: input.sku ?? null,
      inventory: input.inventory ?? null,
      status: "draft",
      media: [],
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateProduct(
  id: string,
  storeId: string,
  patch: {
    name?: string;
    description?: string | null;
    price_cents?: number;
    sku?: string | null;
    inventory?: number | null;
    status?: string;
  },
) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("store_products")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("store_id", storeId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string, storeId: string) {
  const sb = createAdminSupabaseClient();
  const { error } = await sb
    .from("store_products")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId);
  if (error) throw error;
}

export async function listOrders(storeId: string) {
  const sb = createAdminSupabaseClient();
  const { data, error } = await sb
    .from("store_orders")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
