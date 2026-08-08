import { secrets } from "base44:runtime";

/**
 * BlackWayConnect — submit lead from Grow Hub mobile app → HubSpot via blackway-pipe.
 *
 * Secrets (Dashboard → Secrets / env):
 * - BW_LEAD_KEY  (required) — same key as Cloudflare Workers blackway-site / blackway-pipe
 *
 * Optional: call site bootstrap first:
 *   GET https://blackwayconnect.com/api/mobile/bootstrap
 */
export default async function (req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  const leadKey = secrets.get("BW_LEAD_KEY");
  if (!leadKey) {
    return Response.json(
      { error: "missing_secret", detail: "Set BW_LEAD_KEY in Base44 Dashboard → Secrets" },
      { status: 500 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = String(body.email || "").trim();
  if (!email || !email.includes("@")) {
    return Response.json({ error: "email_required" }, { status: 400 });
  }

  const payload = {
    email,
    prenom: String(body.prenom || body.firstName || "").trim(),
    nom: String(body.nom || body.lastName || "").trim(),
    entreprise: String(body.entreprise || body.company || "").trim(),
    telephone: String(body.telephone || body.phone || "").trim(),
    message: String(body.message || "").trim(),
    forfait: String(body.forfait || "grow_hub_growth").trim(),
    source: "app_mobile",
    urgence: String(body.urgence || "normal").trim(),
    langue: String(body.langue || body.lang || "fr").trim(),
    bw_source: "mobile_app",
    bw_ref: String(body.bw_ref || "base44_app").trim(),
  };

  const upstream = await fetch("https://api.blackwayconnect.com/lead", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BW-Key": leadKey,
    },
    body: JSON.stringify(payload),
  });

  const text = await upstream.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    /* keep text */
  }

  return Response.json(
    { ok: upstream.ok, status: upstream.status, data },
    { status: upstream.ok ? 200 : upstream.status },
  );
}
