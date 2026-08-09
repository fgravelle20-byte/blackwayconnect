/**
 * Cloudflare Worker — proxy BlackWayConnect → Railway (site marketing corrigé).
 *
 * Option B go-live: ce Worker remplace ChatGPT Sites une fois le domaine
 * custom attaché (apex + www). Origin = Railway production.
 */
const ORIGIN = 'https://dependable-spirit-production.up.railway.app';

export default {
  async fetch(request) {
    const incoming = new URL(request.url);

    // Force apex : www → apex (www est cassé chez ChatGPT Sites aujourd'hui)
    if (incoming.hostname === 'www.blackwayconnect.com') {
      const apex = new URL(incoming.pathname + incoming.search, 'https://blackwayconnect.com');
      return Response.redirect(apex.toString(), 301);
    }

    const target = new URL(incoming.pathname + incoming.search, ORIGIN);
    const headers = new Headers(request.headers);
    headers.set('Host', new URL(ORIGIN).host);
    headers.set('X-Forwarded-Host', incoming.hostname);
    headers.set('X-Forwarded-Proto', 'https');
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ray');
    headers.delete('cf-visitor');

    const init = {
      method: request.method,
      headers,
      redirect: 'manual',
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
      // @ts-ignore — Workers streaming bodies
      init.duplex = 'half';
    }

    let upstream;
    try {
      upstream = await fetch(target.toString(), init);
    } catch (err) {
      return new Response(
        JSON.stringify({
          error: 'origin_unreachable',
          origin: ORIGIN,
          detail: String(err && err.message ? err.message : err),
        }),
        {
          status: 502,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'x-bw-proxy': 'railway-production',
          },
        },
      );
    }

    const out = new Headers(upstream.headers);
    out.set('x-bw-proxy', 'railway-production');
    out.set('x-bw-origin', ORIGIN);
    // Empêche le cache CDN de servir l'ancien ChatGPT Sites après cutover
    if (incoming.pathname === '/' || incoming.pathname.endsWith('.html')) {
      out.set('cache-control', 'public, max-age=60, must-revalidate');
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: out,
    });
  },
};
