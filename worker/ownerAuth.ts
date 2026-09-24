type OwnerEnv = {
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  BW_OWNER_EMAIL?: string;
};

function decodeBase64Url(value: string): ArrayBuffer {
  const decoded = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0)).buffer as ArrayBuffer;
}

/** The owner endpoint fails closed until Access and the exact owner email are set. */
export async function authorizeOwner(request: Request, env: OwnerEnv): Promise<boolean> {
  const domain = (env.CF_ACCESS_TEAM_DOMAIN || "").trim().toLowerCase();
  const audience = (env.CF_ACCESS_AUD || "").trim();
  const owner = (env.BW_OWNER_EMAIL || "").trim().toLowerCase();
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!domain || !audience || !owner || !token) return false;
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain)) return false;

  try {
    const issuer = `https://${domain}`;
    const parts = token.split(".");
    if (parts.length !== 3 || parts.some((part) => !part)) return false;
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0]))) as { alg?: string; kid?: string };
    if (header.alg !== "RS256" || !header.kid) return false;
    const keysResponse = await fetch(`${issuer}/cdn-cgi/access/certs`);
    if (!keysResponse.ok) return false;
    const jwks = await keysResponse.json() as { keys?: Array<JsonWebKey & { kid?: string }> };
    const key = jwks.keys?.find((candidate) => candidate.kid === header.kid && candidate.kty === "RSA");
    if (!key) return false;
    const imported = await crypto.subtle.importKey("jwk", key, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    if (!(await crypto.subtle.verify("RSASSA-PKCS1-v1_5", imported, decodeBase64Url(parts[2]), signed))) return false;
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))) as {
      iss?: string; aud?: string | string[]; email?: string; exp?: number; nbf?: number;
    };
    const now = Math.floor(Date.now() / 1000);
    return payload.iss === issuer &&
      (payload.aud === audience || (Array.isArray(payload.aud) && payload.aud.includes(audience))) &&
      typeof payload.exp === "number" && payload.exp > now &&
      (payload.nbf === undefined || (typeof payload.nbf === "number" && payload.nbf <= now)) &&
      typeof payload.email === "string" && payload.email.toLowerCase() === owner;
  } catch {
    return false;
  }
}
