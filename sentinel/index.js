export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runChecks(env));
  },
  async fetch(request, env) {
    // Allows manual trigger via HTTP GET for testing, and confirms the worker is alive.
    const url = new URL(request.url);
    if (url.pathname === "/run") {
      await runChecks(env);
      return new Response("check triggered", { status: 200 });
    }
    return new Response("blackway-sentinel OK", { status: 200 });
  }
};

async function runChecks(env) {
  const targets = (env.TARGETS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const results = await Promise.all(
    targets.map(async (url) => {
      try {
        const res = await fetch(url, { method: "GET" });
        return { url, ok: res.status < 500, status: res.status };
      } catch (err) {
        return { url, ok: false, status: 0, error: String(err) };
      }
    })
  );

  const failures = results.filter((r) => !r.ok);
  if (failures.length === 0) return;

  const lines = failures
    .map((f) => `- ${f.url} -> statut ${f.status}${f.error ? " (" + f.error + ")" : ""}`)
    .join("\n");

  if (env.SLACK_WEBHOOK_URL) {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `BLACKWAY ALERTE - panne detectee:\n${lines}`,
      }),
    });
  }
}
