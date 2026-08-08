// Optional: Clerk sync can also run here; Phase 1 uses Next.js /api/webhooks/clerk.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (_req) => {
  return new Response(
    JSON.stringify({
      ok: true,
      message: "Clerk webhook handled by Next.js /api/webhooks/clerk in Phase 1",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
