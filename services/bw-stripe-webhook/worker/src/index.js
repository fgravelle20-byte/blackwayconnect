/**
 * BlackWayConnect — Cloudflare Worker
 * POST /webhooks/stripe   : point d'entree Stripe
 * GET  /health            : etat du service
 *
 * Le Worker repond 200 immediatement et poursuit le traitement via
 * ctx.waitUntil() : Stripe n'attend jamais HubSpot.
 */
import { verifierSignature } from './stripe.js';
import { traiterPaiement } from './handler.js';

const EVENEMENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
]);

function log(x) { console.log(typeof x === 'string' ? x : JSON.stringify(x)); }

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({
        ok: true,
        service: 'bw-stripe-webhook',
        runtime: 'cloudflare-worker',
        hubspot: Boolean(env.HUBSPOT_TOKEN),
        stripe: Boolean(env.STRIPE_SECRET_KEY),
        signature: Boolean(env.STRIPE_WEBHOOK_SECRET),
        slack: Boolean(env.SLACK_WEBHOOK_URL),
      });
    }

    if (request.method !== 'POST' || url.pathname !== '/webhooks/stripe') {
      return new Response('Not found', { status: 404 });
    }

    const payload = await request.text();
    let event;
    try {
      event = await verifierSignature(
        payload,
        request.headers.get('stripe-signature'),
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      log({ level: 'error', msg: 'signature refusee', err: String(err).slice(0, 200) });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (!EVENEMENTS.has(event.type)) {
      return Response.json({ received: true, ignored: event.type });
    }

    // Garde anti-rejeu KV (optionnelle). Sans KV, la garde
    // bw_stripe_payment_id cote HubSpot suffit a bloquer les doublons.
    ctx.waitUntil(
      (async () => {
        try {
          if (env.BW_EVENTS) {
            const deja = await env.BW_EVENTS.get(event.id);
            if (deja) { log({ level: 'info', msg: 'evenement deja traite', id: event.id }); return; }
          }
          const r = await traiterPaiement(event, env, log);
          if (env.BW_EVENTS) await env.BW_EVENTS.put(event.id, '1', { expirationTtl: 604800 });
          log({ level: 'info', msg: 'ok', id: event.id, ...r });
        } catch (e) {
          // Pas de marquage : Stripe rejouera, la garde CRM evite le doublon.
          log({ level: 'error', msg: 'traitement echoue', id: event.id, err: String(e).slice(0, 500) });
        }
      })()
    );

    return Response.json({ received: true, id: event.id });
  },
};
