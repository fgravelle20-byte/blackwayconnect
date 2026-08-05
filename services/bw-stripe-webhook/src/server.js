/**
 * BlackWayConnect — Serveur webhook Stripe
 * Endpoint : POST /webhooks/stripe
 *
 * Regle d'or : on repond 200 a Stripe le plus vite possible, puis on traite.
 * Si on traite avant de repondre et que HubSpot est lent, Stripe timeout (10 s)
 * et rejoue l'evenement -> doublons. L'idempotence couvre le reste.
 */
import express from 'express';
import Stripe from 'stripe';
import { ENV } from './config.js';
import { handleCheckoutSessionCompleted } from './handlers/checkoutSessionCompleted.js';
import { alreadyProcessed, markProcessed } from './lib/idempotency.js';
import { log } from './lib/logger.js';

const stripe = new Stripe(ENV.stripeSecretKey || 'sk_placeholder', { apiVersion: '2024-06-20' });
const app = express();

app.get('/health', (_req, res) =>
  res.json({
    ok: true,
    service: 'bw-stripe-webhook',
    hubspot: Boolean(ENV.hubspotToken),
    stripe: Boolean(ENV.stripeSecretKey),
    signature: Boolean(ENV.stripeWebhookSecret),
    dryRun: ENV.dryRun,
  })
);

// IMPORTANT : body brut obligatoire pour verifier la signature Stripe.
app.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    let event;

    try {
      if (!ENV.stripeWebhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET absent');
      event = stripe.webhooks.constructEvent(req.body, signature, ENV.stripeWebhookSecret);
    } catch (err) {
      log.error('signature invalide', { err: String(err).slice(0, 200) });
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Accuse reception immediat.
    res.status(200).json({ received: true, id: event.id });

    if (alreadyProcessed(event.id)) {
      log.info('evenement deja traite', { id: event.id });
      return;
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event);
          break;
        case 'checkout.session.async_payment_succeeded':
          await handleCheckoutSessionCompleted(event);
          break;
        default:
          log.debug('evenement ignore', { type: event.type });
      }
      markProcessed(event.id);
    } catch (err) {
      // Pas de markProcessed : Stripe rejouera, la garde bw_stripe_payment_id evite le doublon.
      log.error('traitement echoue', { id: event.id, type: event.type, err: String(err).slice(0, 500) });
    }
  }
);

app.use(express.json());

app.listen(ENV.port, () => {
  log.info('serveur demarre', { port: ENV.port, dryRun: ENV.dryRun });
});

export default app;
