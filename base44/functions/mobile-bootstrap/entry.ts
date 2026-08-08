/**
 * Returns public Grow Hub checkout + site URLs for the mobile app.
 * No secrets — safe to call from Base44 frontend.
 */
export default async function (_req: Request): Promise<Response> {
  const res = await fetch("https://blackwayconnect.com/api/mobile/bootstrap");
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
