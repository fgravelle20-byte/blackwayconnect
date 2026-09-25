/** Shared lead capture → site Worker `/api/lead` → pipe → HubSpot. */

export type PostLeadResult = {
  ok: boolean;
  status: number;
  score?: number | null;
  deal?: string | null;
  contact?: string | null;
  error?: string;
};

export async function postLead(payload: Record<string, unknown>): Promise<PostLeadResult> {
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data: Record<string, unknown> = {};
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      data = {};
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: String(data.erreur || data.error || `HTTP ${res.status}`),
      };
    }
    return {
      ok: true,
      status: res.status,
      score: typeof data.score === "number" ? data.score : null,
      deal: data.deal ? String(data.deal) : null,
      contact: data.contact ? String(data.contact) : null,
    };
  } catch (e) {
    return { ok: false, status: 0, error: String(e) };
  }
}
