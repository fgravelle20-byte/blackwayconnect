import assert from "node:assert/strict";
import {
  isVorixaManagedStripeObject,
  VORIXA_GERE_PLANS,
} from "./vorixaManaged.js";
import { forfaitFromStripeObject } from "./index.js";

const depart = VORIXA_GERE_PLANS.vorixa_gere_depart;

assert.equal(
  isVorixaManagedStripeObject({
    amount_due: 49900,
    metadata: { vorixa_repair_batch: "2026-08-31" },
  }),
  true,
);

assert.equal(
  isVorixaManagedStripeObject({
    payment_link: depart.paymentLinkId,
    amount_total: 49900,
  }),
  true,
);

assert.equal(
  isVorixaManagedStripeObject({
    payment_link: depart.legacyPaymentLinkIds[0],
    amount_total: 49900,
  }),
  true,
);

assert.equal(
  isVorixaManagedStripeObject({
    description: "Vorixa - Plan Départ 499$/mo",
    amount_due: 49900,
  }),
  true,
);

assert.equal(
  isVorixaManagedStripeObject({
    amount_total: 49900,
    metadata: { bw_forfait: "grow_hub_growth" },
  }),
  false,
);

assert.equal(
  forfaitFromStripeObject({
    amount_due: 49900,
    metadata: {
      vorixa_repair_batch: "2026-08-31",
      vorixa_ref_price: depart.priceId,
    },
    lines: {
      data: [
        {
          amount: 49900,
          description: "Abonnement Vorixa - Plan Départ 499$/mo - premier mois",
        },
      ],
    },
  }),
  null,
  "Vorixa $499 invoice must not unlock Grow Hub Growth",
);

assert.equal(
  forfaitFromStripeObject({
    amount_total: 49900,
    metadata: { bw_forfait: "grow_hub_growth" },
  }),
  "grow_hub_growth",
);

assert.equal(
  forfaitFromStripeObject({
    amount_total: 9900,
    metadata: {},
  }),
  "grow_hub_spark",
);

assert.equal(
  forfaitFromStripeObject({
    amount: 99900,
    metadata: {},
  }),
  null,
  "bare $999 stays unmapped",
);

console.log("ok pipe/vorixaManaged.test.mjs");
