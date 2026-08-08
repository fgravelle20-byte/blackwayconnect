// Optional usage limit enforcement cron — Phase 1 stub.
// Reads subscription_usage + org_effective_limit and writes audit_logs.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (_req) => {
  return new Response(
    JSON.stringify({
      ok: true,
      message: "enforce-usage stub — wire to org_within_limit in Phase 2+",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
