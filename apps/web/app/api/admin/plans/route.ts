import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getOrCreateProfile, isPlatformAdmin } from "@/lib/auth/session";

const limitSchema = z.object({
  id: z.string().uuid(),
  value_int: z.number().int(),
});

const featureSchema = z.object({
  id: z.string().uuid(),
  enabled: z.boolean(),
});

const priceSchema = z.object({
  id: z.string().uuid(),
  amount_cents: z.number().int().nonnegative().optional(),
  annual_discount_percent: z.number().int().min(0).max(100).optional(),
  stripe_price_id: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

const bodySchema = z.object({
  limits: z.array(limitSchema).optional(),
  features: z.array(featureSchema).optional(),
  prices: z.array(priceSchema).optional(),
});

export async function PATCH(req: Request) {
  const profile = await getOrCreateProfile();
  if (!profile || !(await isPlatformAdmin(profile.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const sb = createAdminSupabaseClient();
  for (const limit of parsed.data.limits ?? []) {
    await sb.from("plan_limits").update({ value_int: limit.value_int }).eq("id", limit.id);
  }
  for (const feature of parsed.data.features ?? []) {
    await sb.from("plan_features").update({ enabled: feature.enabled }).eq("id", feature.id);
  }
  for (const price of parsed.data.prices ?? []) {
    const patch: Record<string, unknown> = {};
    if (price.amount_cents !== undefined) patch.amount_cents = price.amount_cents;
    if (price.annual_discount_percent !== undefined) {
      patch.annual_discount_percent = price.annual_discount_percent;
    }
    if (price.stripe_price_id !== undefined) patch.stripe_price_id = price.stripe_price_id;
    if (price.is_active !== undefined) patch.is_active = price.is_active;
    if (Object.keys(patch).length > 0) {
      await sb.from("plan_prices").update(patch).eq("id", price.id);
    }
  }
  return NextResponse.json({ ok: true });
}