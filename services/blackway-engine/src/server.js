/**
 * server.js
 * ------------------------------------------------------------------
 * Point d'entrée de l'application Express du BlackWay Lead Engine.
 *
 * Particularité importante : la route Stripe (/webhook/stripe) a
 * besoin du corps BRUT (raw Buffer) de la requête pour vérifier la
 * signature Stripe. Toutes les autres routes utilisent le parseur
 * JSON standard. On applique donc express.raw() uniquement sur le
 * chemin du webhook Stripe, et express.json() pour le reste.
 * ------------------------------------------------------------------
 */

import 'dotenv/config';
import express from 'express';
import { config } from './config.js';
import { logger } from './logger.js';
import routeurStripe from './routes/stripe.js';
import routeurForms from './routes/forms.js';
import routeurHubspotWebhook from './routes/hubspot-webhook.js';

const app = express();

// Journalisation simple de chaque requête entrante.
app.use((req, res, next) => {
  const debut = Date.now();
  res.on('finish', () => {
    logger.info(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - debut}ms)`
    );
  });
  next();
});

// --- Route Stripe : corps BRUT requis pour la vérification de signature ---
// IMPORTANT : ce middleware doit être monté AVANT tout express.json() global,
// sinon le corps serait déjà parsé en objet JS et la vérification de
// signature Stripe échouerait systématiquement.
app.use(
  '/webhook/stripe',
  express.raw({ type: 'application/json' })
);
app.use(routeurStripe);

// --- Toutes les autres routes : JSON standard ---
app.use(express.json({ limit: '2mb' }));
app.use(routeurForms);
app.use(routeurHubspotWebhook);

/** Route de vérification de santé du service (utile pour Railway/Render/Fly). */
app.get('/health', (req, res) => {
  res.status(200).json({
    statut: 'ok',
    service: 'blackway-lead-engine',
    horodatage: new Date().toISOString(),
  });
});

// Route racine informative.
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'BlackWay Lead Engine + Deal Engine — service opérationnel.',
    endpoints: [
      'GET  /health',
      'POST /webhook/stripe',
      'POST /webhook/form',
      'POST /webhook/hubspot',
    ],
  });
});

// Gestionnaire 404 générique.
app.use((req, res) => {
  res.status(404).json({ erreur: `Route non trouvée : ${req.method} ${req.originalUrl}` });
});

// Gestionnaire d'erreurs global (filet de sécurité final).
app.use((err, req, res, _next) => {
  logger.error({ erreur: err.message, pile: err.stack }, "[server] Erreur non gérée capturée par le middleware global.");
  res.status(500).json({ erreur: 'Erreur interne du serveur.' });
});

app.listen(config.port, () => {
  logger.info(`🚀 BlackWay Lead Engine démarré sur le port ${config.port}.`);
  logger.info(`   Santé du service : http://localhost:${config.port}/health`);

  if (!config.hubspot.token) {
    logger.warn('⚠️  HUBSPOT_TOKEN est absent — les appels HubSpot échoueront jusqu\u2019à configuration.');
  }
  if (!config.stripe.webhookSecret) {
    logger.warn('⚠️  STRIPE_WEBHOOK_SECRET est absent — le webhook Stripe rejettera toutes les requêtes.');
  }
  if (!config.pipelines.dealPipelineId || !config.pipelines.ticketPipelineId) {
    logger.warn(
      '⚠️  BW_DEAL_PIPELINE_ID ou BW_TICKET_PIPELINE_ID absent — lancez `node scripts/setup-hubspot.js` puis renseignez .env.'
    );
  }
});

export default app;
