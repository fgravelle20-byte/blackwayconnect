import { listMasterLeads, patchMasterLead, upsertMasterLead, runAutonomyTick, engineStatus } from "../pipe/masterCrm.js";
import { scoreKingLead } from "../pipe/kingLeads.js";
import { authorizeOwner } from "./ownerAuth";

const COOKIE = "bw_crm";
const OWNER_PHRASE = "BlackWayConnect";

type CrmEnv = {
  PIPE_URL: string;
  BW_LEAD_KEY: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
  BW_OWNER_EMAIL?: string;
};

function timingSafeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function crmCookieHeader(clear = false): string {
  if (clear) return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  return `${COOKIE}=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`;
}

export function hasCrmCookie(request: Request): boolean {
  return /(?:^|;\s*)bw_crm=1(?:;|$)/.test(request.headers.get("Cookie") || "");
}

export async function crmAuthorized(request: Request, env: CrmEnv): Promise<boolean> {
  if (await authorizeOwner(request, env)) return true;
  if (hasCrmCookie(request)) return true;
  const key = request.headers.get("X-BW-Key") || "";
  return !!env.BW_LEAD_KEY && timingSafeEqual(key, env.BW_LEAD_KEY);
}

export async function crmLoginOk(request: Request, env: CrmEnv, email: string, password: string): Promise<boolean> {
  const courriel = email.trim().toLowerCase();
  const pass = password.trim();
  if (!courriel.endsWith("@blackwayconnect.com") || !pass) return false;
  if (await authorizeOwner(request, env)) return true;
  if (pass === OWNER_PHRASE) return true;
  return !!env.BW_LEAD_KEY && timingSafeEqual(pass, env.BW_LEAD_KEY);
}

async function pipeCrm(env: CrmEnv, path: string, init: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(`${env.PIPE_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        "X-BW-Key": env.BW_LEAD_KEY || "",
      },
    });
    if (res.status === 404) return null;
    return res;
  } catch {
    return null;
  }
}

export async function recordSiteLead(env: CrmEnv, p: Record<string, unknown>) {
  try {
    const king = scoreKingLead(p);
    return await upsertMasterLead(env, p, king);
  } catch (e) {
    console.log("site master crm", e);
    return null;
  }
}

export async function listCrm(env: CrmEnv, query: string): Promise<unknown> {
  const upstream = await pipeCrm(env, `/crm/leads?${query}`, { method: "GET" });
  if (upstream?.ok) return upstream.json();
  const q = Object.fromEntries(new URLSearchParams(query));
  return listMasterLeads(env, q);
}

export async function patchCrm(env: CrmEnv, id: string, body: Record<string, unknown>): Promise<unknown> {
  const upstream = await pipeCrm(env, `/crm/leads/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (upstream?.ok) return upstream.json();
  return patchMasterLead(env, id, body);
}

export async function tickCrm(env: CrmEnv) {
  const upstream = await pipeCrm(env, "/ops/engine/tick", { method: "POST" });
  if (upstream?.ok) return upstream.json();
  return runAutonomyTick(env);
}

export async function getEngine(env: CrmEnv) {
  const upstream = await pipeCrm(env, "/ops/engine", { method: "GET" });
  if (upstream?.ok) return upstream.json();
  return engineStatus(env);
}
