import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'esbuild';
const temp = mkdtempSync(join(tmpdir(), 'bw-integrations-'));
await build({ entryPoints: ['worker/integrations.ts'], outfile: join(temp, 'worker.mjs'), bundle: true, format: 'esm', platform: 'node' });
const { handleIntegrations, seal, unseal, digest, base64 } = await import(join(temp, 'worker.mjs'));
after(() => rmSync(temp, { recursive: true, force: true }));
const origin = 'https://blackwayconnect.com';
function database() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync('migrations/integrations/0001.sql', 'utf8'));
  const prepare = sql => {
    let args = [];
    return { bind(...values) { args = values; return this; },
      async first() { return db.prepare(sql).get(...args) || null; },
      async all() { return { results: db.prepare(sql).all(...args) }; },
      async run() { return db.prepare(sql).run(...args); },
    };
  };
  return { raw: db, prepare, async batch(statements) { db.exec('BEGIN'); try { const results = []; for (const s of statements) results.push(await s.run()); db.exec('COMMIT'); return results; } catch (e) { db.exec('ROLLBACK'); throw e; } } };
}
function env() { return { BW_INTEGRATIONS_DB: database(), BW_INTEGRATIONS_KEY: base64(crypto.getRandomValues(new Uint8Array(32))), BW_GOOGLE_CLIENT_ID: 'test', BW_GOOGLE_CLIENT_SECRET: 'test' }; }
function request(path = '', method = 'GET', cookie = '', headers = {}) { return new Request(`${origin}/api/integrations${path}`, { method, headers: { Origin: origin, Cookie: cookie, ...headers } }); }
async function addSession(e, owner = 'google:alice') {
  const token = base64(crypto.getRandomValues(new Uint8Array(32)));
  await e.BW_INTEGRATIONS_DB.prepare('INSERT INTO integration_sessions VALUES(?,?,?,?)').bind(await digest(token), owner, owner, Math.floor(Date.now()/1000)+3600).run();
  return `__Host-bw_integrations=${token}`;
}
test('unconfigured providers are unavailable and no legacy portal token grants access', async () => {
  const result = await (await handleIntegrations(request(), {})).json();
  assert.equal(result.identity, null); assert(result.providers.every(p => !p.available && !p.connected));
  const e = env();
  const response = await handleIntegrations(request('/google/items', 'GET', 'bw_portal_session=forged', { Authorization: 'Bearer forged' }), e);
  assert.equal(response.status, 401);
});
test('mutations reject cross-origin calls and preview hosts', async () => {
  const e = env();
  assert.equal((await handleIntegrations(request('/google/start', 'POST', '', { Origin: 'https://evil.invalid' }), e)).status, 403);
  assert.equal((await handleIntegrations(new Request('https://preview.invalid/api/integrations'), e)).status, 503);
});
test('ciphertext is bound to owner and provider', async () => {
  const e = env(); const tokens = { access_token: 'private', expires_at: 9999999999 };
  const encrypted = await seal(e.BW_INTEGRATIONS_KEY, 'google:alice', 'google', tokens);
  assert(!encrypted.includes('private'));
  assert.deepEqual(await unseal(e.BW_INTEGRATIONS_KEY, { owner: 'google:alice', provider: 'google', encrypted }), tokens);
  await assert.rejects(unseal(e.BW_INTEGRATIONS_KEY, { owner: 'google:bob', provider: 'google', encrypted }));
  await assert.rejects(unseal(e.BW_INTEGRATIONS_KEY, { owner: 'google:alice', provider: 'microsoft', encrypted }));
});
test('connection lists and disconnect are isolated by verified owner', async () => {
  const e = env(), a = await addSession(e), b = await addSession(e, 'google:bob');
  await e.BW_INTEGRATIONS_DB.prepare('INSERT INTO integration_connections(owner,provider,encrypted,updated,version) VALUES(?,?,?,?,?)').bind('google:alice','google','secret',1,'v1').run();
  assert.equal((await (await handleIntegrations(request('', 'GET', a), e)).json()).providers[0].connected, true);
  assert.equal((await (await handleIntegrations(request('', 'GET', b), e)).json()).providers[0].connected, false);
  await handleIntegrations(request('/google/disconnect', 'POST', b), e);
  assert.equal((await (await handleIntegrations(request('', 'GET', a), e)).json()).providers[0].connected, true);
  await handleIntegrations(request('/google/disconnect', 'POST', a), e);
  assert.equal((await (await handleIntegrations(request('', 'GET', a), e)).json()).providers[0].connected, false);
});
test('OAuth callback requires browser-bound state and state is single use', async () => {
  const e = env();
  const start = await handleIntegrations(request('/google/start', 'POST'), e);
  const stateCookie = start.headers.get('set-cookie').split(';')[0];
  const auth = new URL((await start.json()).url);
  assert(auth.searchParams.get('code_challenge')); assert.equal(auth.searchParams.get('code_challenge_method'), 'S256');
  const callback = `/google/callback?state=${auth.searchParams.get('state')}&error=access_denied`;
  assert.equal((await handleIntegrations(request(callback), e)).status, 400);
  const valid = await handleIntegrations(request(callback, 'GET', stateCookie), e);
  assert.equal(valid.status, 303); assert(valid.headers.get('location').endsWith('connection=cancelled'));
  assert.equal((await handleIntegrations(request(callback, 'GET', stateCookie), e)).status, 400);
});
test('logout cancels pending authorizations', async () => {
  const e = env(), a = await addSession(e);
  const start = await handleIntegrations(request('/google/start', 'POST', a), e);
  const stateCookie = start.headers.get('set-cookie').split(';')[0];
  const auth = new URL((await start.json()).url);
  await handleIntegrations(request('/logout', 'POST', a), e);
  assert.equal((await handleIntegrations(request(`/google/callback?state=${auth.searchParams.get('state')}&code=fake`, 'GET', `${a}; ${stateCookie}`), e)).status, 400);
});
test('verified provider login stores encrypted credentials, reads data and never returns a token', async () => {
  const e = env(); const original = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes('oauth2.googleapis.com/token')) return Response.json({ access_token: 'private-access', refresh_token: 'private-refresh', expires_in: 3600 });
    if (String(url).includes('/v1/userinfo')) return Response.json({ sub: 'alice', email: 'alice@example.test' });
    if (String(url).includes('/calendar/v3/')) return Response.json({ items: [{ id:'event', summary:'Meeting', start:{ date:'2026-10-02' } }] });
    throw new Error('unexpected fetch');
  };
  try {
    const start = await handleIntegrations(request('/google/start', 'POST'), e);
    const stateCookie = start.headers.get('set-cookie').split(';')[0];
    const auth = new URL((await start.json()).url);
    const callback = await handleIntegrations(request(`/google/callback?state=${auth.searchParams.get('state')}&code=valid`, 'GET', stateCookie), e);
    assert(callback.headers.get('location').endsWith('connection=success'));
    const sessionCookie = callback.headers.getSetCookie().find(v=>v.startsWith('__Host-bw_integrations=')).split(';')[0];
    const row = await e.BW_INTEGRATIONS_DB.prepare('SELECT * FROM integration_connections').first();
    assert(!row.encrypted.includes('private'));
    const result = await handleIntegrations(request('/google/items','GET',sessionCookie),e);
    const text = await result.text(); assert(!text.includes('private')); assert(text.includes('Meeting'));
  } finally { globalThis.fetch = original; }
});
test('expired credentials refresh once and persist the rotated refresh token', async () => {
  const e = env(), a = await addSession(e), original = globalThis.fetch;
  const tokens = { access_token:'expired', refresh_token:'old-refresh', expires_at:1 };
  await e.BW_INTEGRATIONS_DB.prepare('INSERT INTO integration_connections(owner,provider,encrypted,updated,version) VALUES(?,?,?,?,?)').bind('google:alice','google',await seal(e.BW_INTEGRATIONS_KEY,'google:alice','google',tokens),1,'old').run();
  let exchanges=0;
  globalThis.fetch = async url => {
    if (String(url).includes('/token')) { exchanges++; return Response.json({access_token:'fresh',refresh_token:'rotated',expires_in:3600}); }
    return Response.json({items:[]});
  };
  try {
    assert.equal((await handleIntegrations(request('/google/items','GET',a),e)).status,200);
    assert.equal((await handleIntegrations(request('/google/items','GET',a),e)).status,200);
    assert.equal(exchanges,1);
    const row=await e.BW_INTEGRATIONS_DB.prepare('SELECT * FROM integration_connections').first();
    assert.equal((await unseal(e.BW_INTEGRATIONS_KEY,row)).refresh_token,'rotated');
  } finally { globalThis.fetch=original; }
});
test('disconnect during refresh cannot recreate the credentials', async () => {
  const e=env(),a=await addSession(e),original=globalThis.fetch;
  await e.BW_INTEGRATIONS_DB.prepare('INSERT INTO integration_connections(owner,provider,encrypted,updated,version) VALUES(?,?,?,?,?)').bind('google:alice','google',await seal(e.BW_INTEGRATIONS_KEY,'google:alice','google',{access_token:'old',refresh_token:'refresh',expires_at:1}),1,'old').run();
  globalThis.fetch=async()=>{
    await handleIntegrations(request('/google/disconnect','POST',a),e);
    return Response.json({access_token:'new',refresh_token:'rotated',expires_in:3600});
  };
  try {
    assert.equal((await handleIntegrations(request('/google/items','GET',a),e)).status,409);
    assert.equal(await e.BW_INTEGRATIONS_DB.prepare('SELECT * FROM integration_connections').first(),null);
  } finally {globalThis.fetch=original;}
});
