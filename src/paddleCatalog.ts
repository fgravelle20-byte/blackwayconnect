/**
 * @deprecated Paddle has been retired. This file re-exports from paymentCatalog
 * for backward compatibility while imports are being migrated.
 * See ops/payment-lock/ for the unlock record.
 */
export {
  paymentPlanUrl as paddlePlanUrl,
  isPaymentPlanKey as isPaddlePlanKey,
  type PaymentPlanKey as PaddlePlanKey,
  hasCheckoutUrl,
  ALL_PLAN_KEYS,
} from "./paymentCatalog";