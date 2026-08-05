/**
 * Cloudflare Worker — proxy vers Railway (site marketing corrigé).
 * blackwayconnect.com pointe encore vers ChatGPT Sites côté DNS ;
 * ce worker sert dès que le domaine / la route Worker est branché sur Railway.
 */
const ORIGIN = 'https://blackwayconnect-production.up.railway.app';

export default {
  async fetch(request) {
    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, ORIGIN);

    const headers = new Headers(request.headers);
    headers.set('Host', new URL(ORIGIN).host);
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
    }

    const upstream = await fetch(target.toString(), init);
    const out = new Headers(upstream.headers);
    out.set('x-bw-proxy', 'railway-production');
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: out,
    });
  },
};
