export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runChecks(env));
  },
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/run") {
      await runChecks(env);
      return new Response("check triggered", { status: 200 });
    }
    return new Response("blackway-sentinel OK", { status: 200 });
  },
};

async function runChecks(env) {
  const pageTargets = (env.TARGETS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const pipelineChecks = [
    { url: env.SITE_HEALTH || "https://blackwayconnect.com/api/health", expect: (s) => s === 200, label: "site /api/health" },
    { url: env.PIPE_HEALTH || "https://api.blackwayconnect.com/health", expect: (s) => s === 200, label: "pipe /health" },
    {
      url: env.LEAD_PROBE || "https://blackwayconnect.com/api/lead",
      expect: (s) => s === 405,
      label: "lead GET denied (405)",
    },
    {
      url: env.CONFIG_PROBE || "https://blackwayconnect.com/api/config",
      expect: (s) => s === 200,
      label: "public /api/config",
    },
  ];

  const pageResults = await Promise.all(
    pageTargets.map(async (url) => {
      try {
        const res = await fetch(url, { method: "GET" });
        return { url, label: url, ok: res.status < 500, status: res.status };
      } catch (err) {
        return { url, label: url, ok: false, status: 0, error: String(err) };
      }
    }),
  );

  const pipeResults = await Promise.all(
    pipelineChecks.map(async (check) => {
      try {
        const res = await fetch(check.url, { method: "GET" });
        return {
          url: check.url,
          label: check.label,
          ok: check.expect(res.status),
          status: res.status,
        };
      } catch (err) {
        return { url: check.url, label: check.label, ok: false, status: 0, error: String(err) };
      }
    }),
  );

  const failures = [...pageResults, ...pipeResults].filter((r) => !r.ok);
  if (failures.length === 0) return;

  const lines = failures
    .map((f) => `- ${f.label} (${f.url}) -> statut ${f.status}${f.error ? " (" + f.error + ")" : ""}`)
    .join("\n");

  if (env.SLACK_WEBHOOK_URL) {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `BLACKWAY ALERTE — panne / fuite pipeline:\n${lines}`,
      }),
    });
  }
}
