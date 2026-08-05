/**
 * logger.js
 * ------------------------------------------------------------------
 * Logger pino partagé par toute l'application. En développement,
 * la sortie est formatée joliment par pino-pretty ; en production,
 * on garde le format JSON brut (plus performant, mieux ingéré par
 * les agrégateurs de logs).
 * ------------------------------------------------------------------
 */

import pino from 'pino';

const estProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: estProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
});
