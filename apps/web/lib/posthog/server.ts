/** Server-side PostHog capture via HTTP — avoids posthog-node dependency. */
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const host = (
    process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.posthog.com"
  ).replace(/\/$/, "");
  try {
    await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $lib: "noirroutes-server" },
      }),
    });
  } catch {
    // Analytics must never break primary flows
  }
}
