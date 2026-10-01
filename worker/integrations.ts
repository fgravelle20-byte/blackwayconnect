import { PROVIDERS, isProvider, providerJson, readItems, type Provider } from './integrationProviders';

export interface IntegrationEnv {
  BW_INTEGRATIONS_DB?: D1Database;
  BW_INTEGRATIONS_KEY?: string;
  BW_GOOGLE_CLIENT_ID?: string; BW_GOOGLE_CLIENT_SECRET?: string;
  BW_MICROSOFT_CLIENT_ID?: string; BW_MICROSOFT_CLIENT_SECRET?: string;
  BW_ATLASSIAN_CLIENT_ID?: string; BW_ATLASSIAN_CLIENT_SECRET?: string;
}
const ORIGIN = 'https://blackwayconnect.com';
const BASE = '/api/integrations';
const COOKIE = '__Host-bw_integrations';
const STATE_COOKIE = '__Host-bw_integration_state';
const enc = new TextEncoder();
type Session = { id: string; owner: string; label: string; expires: number };
type State = { id: string; provider: Provider; browser: string; owner: string | null; session_id: string | null; verifier: string; lang: string; expires: number };
type Tokens = { access_token: string; refresh_token?: string; expires_at: number };
type Connection = { owner: string; provider: Provider; encrypted: string; version: string; updated: number; lock_until: number };
const now = () => Math.floor(Date.now() / 1000);
export function base64(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function unbase64(value: string) { return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); }
const random = () => base64(crypto.getRandomValues(new Uint8Array(32)));
export async function digest(value: string) { return base64(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value)))); }
function cookie(request: Request, name: string) { return (request.headers.get('Cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${name}=`))?.slice(name.length + 1) || ''; }
function setCookie(name: string, value: string, age: number) { return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`; }
function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' } }); }
function redirect(path: string, cookies: string[] = []) {
  const headers = new Headers({ Location: `${ORIGIN}${path}`, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
  for (const value of cookies) headers.append('Set-Cookie', value);
  return new Response(null, { status: 303, headers });
}
function credentials(env: IntegrationEnv, provider: Provider) {
  const prefix = `BW_${provider.toUpperCase()}`;
  const values = env as Record<string, unknown>;
  return { client_id: String(values[`${prefix}_CLIENT_ID`] || ''), client_secret: String(values[`${prefix}_CLIENT_SECRET`] || '') };
}
function ready(env: IntegrationEnv, provider: Provider) {
  const c = credentials(env, provider);
  return !!(env.BW_INTEGRATIONS_DB && /^[A-Za-z0-9_-]{43}$/.test(env.BW_INTEGRATIONS_KEY || '') && c.client_id && c.client_secret);
}
export async function seal(key: string, owner: string, provider: string, value: Tokens) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aes = await crypto.subtle.importKey('raw', unbase64(key), 'AES-GCM', false, ['encrypt']);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(`${owner}|${provider}`) }, aes, enc.encode(JSON.stringify(value)));
  return `${base64(iv)}.${base64(new Uint8Array(ciphertext))}`;
}
export async function unseal(key: string, row: Connection): Promise<Tokens> {
  const [iv, ciphertext] = row.encrypted.split('.');
  const aes = await crypto.subtle.importKey('raw', unbase64(key), 'AES-GCM', false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unbase64(iv), additionalData: enc.encode(`${row.owner}|${row.provider}`) }, aes, unbase64(ciphertext));
  return JSON.parse(new TextDecoder().decode(plain));
}
async function session(request: Request, db: D1Database): Promise<Session | null> {
  const token = cookie(request, COOKIE);
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  return db.prepare('SELECT * FROM integration_sessions WHERE id = ? AND expires > ?').bind(await digest(token), now()).first<Session>();
}
async function tokenExchange(env: IntegrationEnv, provider: Provider, params: Record<string, string>): Promise<Tokens> {
  const def = PROVIDERS[provider];
  const body = { ...credentials(env, provider), ...params };
  const response = await fetch(def.token, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(12000),
    headers: { 'Content-Type': provider === 'atlassian' ? 'application/json' : 'application/x-www-form-urlencoded' },
    body: provider === 'atlassian' ? JSON.stringify(body) : new URLSearchParams(body),
  });
  if (!response.ok) throw new Error(response.status === 400 || response.status === 401 ? 'reconnect_required' : 'provider_unavailable');
  const data = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!data.access_token || !Number.isFinite(Number(data.expires_in))) throw new Error('provider_unavailable');
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: now() + Number(data.expires_in) };
}
async function accessToken(env: IntegrationEnv, row: Connection) {
  const db = env.BW_INTEGRATIONS_DB!;
  const tokens = await unseal(env.BW_INTEGRATIONS_KEY!, row);
  if (tokens.expires_at > now() + 60) return tokens.access_token;
  if (!tokens.refresh_token) throw new Error('reconnect_required');
  // Serialize rotating refresh tokens, with CAS so disconnect/reconnect cannot be undone by a late refresh.
  const locked = await db.prepare('UPDATE integration_connections SET lock_until = ? WHERE owner = ? AND provider = ? AND version = ? AND lock_until < ? RETURNING version')
    .bind(now() + 30, row.owner, row.provider, row.version, now()).first();
  if (!locked) throw new Error('retry_later');
  try {
    const fresh = await tokenExchange(env, row.provider, { grant_type: 'refresh_token', refresh_token: tokens.refresh_token });
    fresh.refresh_token ||= tokens.refresh_token;
    const saved = await db.prepare('UPDATE integration_connections SET encrypted = ?, updated = ?, version = ?, lock_until = 0 WHERE owner = ? AND provider = ? AND version = ? RETURNING version')
      .bind(await seal(env.BW_INTEGRATIONS_KEY!, row.owner, row.provider, fresh), now(), random(), row.owner, row.provider, row.version).first();
    if (!saved) throw new Error('reconnect_required');
    return fresh.access_token;
  } finally {
    await db.prepare('UPDATE integration_connections SET lock_until = 0 WHERE owner = ? AND provider = ? AND version = ?').bind(row.owner, row.provider, row.version).run();
  }
}
export async function handleIntegrations(request: Request, env: IntegrationEnv): Promise<Response> {
  const url = new URL(request.url);
  // No callback or API use from preview hosts; credentials only belong to the canonical production host.
  if (url.origin !== ORIGIN) return json({ error: 'unavailable_on_preview' }, 503);
  if (request.method !== 'GET' && request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (request.method === 'POST' && request.headers.get('Origin') !== ORIGIN) return json({ error: 'invalid_origin' }, 403);
  const parts = url.pathname.slice(BASE.length).split('/').filter(Boolean);
  const provider = parts[0]; const action = parts[1];
  const db = env.BW_INTEGRATIONS_DB;
  try {
    if (!parts.length && request.method === 'GET') {
      const who = db ? await session(request, db) : null;
      const rows = who && db ? (await db.prepare('SELECT provider, updated FROM integration_connections WHERE owner = ?').bind(who.owner).all<{ provider: string; updated: number }>()).results : [];
      return json({ identity: who ? { label: who.label, loginProvider: who.owner.split(':')[0] } : null,
        providers: Object.entries(PROVIDERS).map(([id, def]) => ({ id, name: def.name, available: ready(env, id as Provider), connected: rows.some(r => r.provider === id), updated: rows.find(r => r.provider === id)?.updated || null })) });
    }
    if (!db) return json({ error: 'setup_required' }, 503);
    const who = await session(request, db);
    if (provider === 'logout' && request.method === 'POST') {
      if (who) await db.batch([
        db.prepare('DELETE FROM integration_states WHERE session_id = ?').bind(who.id),
        db.prepare('DELETE FROM integration_sessions WHERE id = ?').bind(who.id),
      ]);
      const response = json({ ok: true }); response.headers.append('Set-Cookie', setCookie(COOKIE, '', 0)); return response;
    }
    if (!isProvider(provider) || parts.length !== 2) return json({ error: 'not_found' }, 404);
    if (!ready(env, provider)) return json({ error: 'setup_required' }, 503);
    const def = PROVIDERS[provider];
    if (action === 'start' && request.method === 'POST') {
      if (!who && provider === 'atlassian') return json({ error: 'sign_in_required' }, 401);
      const state = random(), browser = random(), verifier = random();
      const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'fr';
      await db.batch([
        db.prepare('DELETE FROM integration_states WHERE expires < ?').bind(now()),
        db.prepare('DELETE FROM integration_sessions WHERE expires < ?').bind(now()),
        db.prepare('INSERT INTO integration_states(id,provider,browser,owner,session_id,verifier,lang,expires) VALUES(?,?,?,?,?,?,?,?)')
          .bind(await digest(state), provider, await digest(browser), who?.owner || null, who?.id || null, verifier, lang, now() + 600),
      ]);
      const auth = new URL(def.authorization);
      const params: Record<string, string> = { client_id: credentials(env, provider).client_id, response_type: 'code', redirect_uri: `${ORIGIN}${BASE}/${provider}/callback`, scope: def.scopes, state, prompt: provider === 'microsoft' ? 'select_account' : 'consent' };
      if (def.pkce) Object.assign(params, { code_challenge: await digest(verifier), code_challenge_method: 'S256' });
      if (provider === 'google') params.access_type = 'offline';
      if (provider === 'atlassian') params.audience = 'api.atlassian.com';
      Object.entries(params).forEach(([key, value]) => auth.searchParams.set(key, value));
      const response = json({ url: auth.toString() }); response.headers.append('Set-Cookie', setCookie(STATE_COOKIE, browser, 600)); return response;
    }
    if (action === 'callback' && request.method === 'GET') {
      const rawState = url.searchParams.get('state') || '';
      const browser = cookie(request, STATE_COOKIE);
      if (!/^[A-Za-z0-9_-]{43}$/.test(rawState) || !browser) return json({ error: 'invalid_state' }, 400);
      const state = await db.prepare('DELETE FROM integration_states WHERE id = ? AND provider = ? AND browser = ? AND expires > ? RETURNING *')
        .bind(await digest(rawState), provider, await digest(browser), now()).first<State>();
      if (!state || (state.session_id && (!who || state.session_id !== who.id || state.owner !== who.owner))) return json({ error: 'invalid_state' }, 400);
      const returnPath = `${state.lang === 'en' ? '/en' : ''}/portail/connexions`;
      const cookies = [setCookie(STATE_COOKIE, '', 0)];
      if (url.searchParams.has('error')) return redirect(`${returnPath}?connection=cancelled`, cookies);
      const code = url.searchParams.get('code');
      if (!code) return redirect(`${returnPath}?connection=failed`, cookies);
      try {
        const params: Record<string, string> = { grant_type: 'authorization_code', code, redirect_uri: `${ORIGIN}${BASE}/${provider}/callback` };
        if (def.pkce) params.code_verifier = state.verifier;
        const tokens = await tokenExchange(env, provider, params);
        let owner = state.owner;
        const statements: D1PreparedStatement[] = [];
        if (!owner) {
          if (!def.userinfo) throw new Error('sign_in_required');
          // Identity is obtained directly from the provider, never an email/owner supplied by the browser or legacy portal.
          const identity = await providerJson(def.userinfo, tokens.access_token);
          if (typeof identity.sub !== 'string' || !identity.sub) throw new Error('sign_in_required');
          owner = `${provider}:${identity.sub}`;
          const label = String(identity.email || identity.name || def.name).slice(0, 200);
          const sessionToken = random();
          statements.push(db.prepare('INSERT INTO integration_sessions(id,owner,label,expires) VALUES(?,?,?,?)').bind(await digest(sessionToken), owner, label, now() + 7 * 86400));
          cookies.push(setCookie(COOKIE, sessionToken, 7 * 86400));
        }
        statements.push(db.prepare('INSERT INTO integration_connections(owner,provider,encrypted,updated,version) VALUES(?,?,?,?,?) ON CONFLICT(owner,provider) DO UPDATE SET encrypted=excluded.encrypted,updated=excluded.updated,version=excluded.version,lock_until=0')
          .bind(owner, provider, await seal(env.BW_INTEGRATIONS_KEY!, owner, provider, tokens), now(), random()));
        await db.batch(statements);
        return redirect(`${returnPath}?connection=success`, cookies);
      } catch { return redirect(`${returnPath}?connection=failed`, cookies); }
    }
    if (!who) return json({ error: 'sign_in_required' }, 401);
    if (action === 'disconnect' && request.method === 'POST') {
      await db.batch([
        db.prepare('DELETE FROM integration_states WHERE owner = ? AND provider = ?').bind(who.owner, provider),
        db.prepare('DELETE FROM integration_connections WHERE owner = ? AND provider = ?').bind(who.owner, provider),
      ]);
      return json({ ok: true, providerAuthorizationRetained: true });
    }
    if (action === 'items' && request.method === 'GET') {
      const row = await db.prepare('SELECT * FROM integration_connections WHERE owner = ? AND provider = ?').bind(who.owner, provider).first<Connection>();
      if (!row) return json({ error: 'not_connected' }, 404);
      const items = await readItems(provider, await accessToken(env, row));
      return json({ items, fetchedAt: new Date().toISOString() });
    }
    return json({ error: 'not_found' }, 404);
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    const safe = ['reconnect_required', 'provider_unavailable', 'retry_later'].includes(reason) ? reason : 'temporarily_unavailable';
    return json({ error: safe }, safe === 'reconnect_required' ? 409 : 503);
  }
}
