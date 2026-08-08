// Stripe webhooks are handled by Next.js at /api/webhooks/stripe (Phase 1).
// This Edge Function is reserved for optional Supabase-side processing
// (usage enforcement fan-out) in later phases. Keep secrets in Supabase vault.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message:
        "Use apps/web /api/webhooks/stripe for Phase 1. This function is a placeholder.",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
