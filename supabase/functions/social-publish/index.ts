// Future: social provider publish worker (Phase 5+).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (_req) => {
  return new Response(
    JSON.stringify({
      ok: false,
      error: "social_publish_not_enabled",
      message: "Social OAuth/publish is Phase 5+. No fake publishes.",
    }),
    { status: 501, headers: { "Content-Type": "application/json" } },
  );
});
