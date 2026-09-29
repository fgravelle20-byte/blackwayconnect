import { Capacitor } from "@capacitor/core";
import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";

/**
 * RevenueCat access gate.
 *
 * The app must not grant free access: on iOS/Android the Portal is unlocked
 * only when the configured entitlement is active. Keys are injected at build
 * time via Vite env (never hard-coded) — see mobile/.env.example.
 */

const IOS_KEY = (import.meta.env.VITE_RC_IOS_KEY as string | undefined)?.trim();
const ANDROID_KEY = (import.meta.env.VITE_RC_ANDROID_KEY as string | undefined)?.trim();

/** Entitlement identifier configured in the RevenueCat dashboard. */
export const ENTITLEMENT_ID =
  (import.meta.env.VITE_RC_ENTITLEMENT as string | undefined)?.trim() || "pro";

const platform = Capacitor.getPlatform(); // "ios" | "android" | "web"

/** True on a real store build (iOS/Android) where the gate must be enforced. */
export const isNativeStore = platform === "ios" || platform === "android";

function apiKeyForPlatform(): string | undefined {
  if (platform === "ios") return IOS_KEY || undefined;
  if (platform === "android") return ANDROID_KEY || undefined;
  return undefined;
}

/** Whether a RevenueCat public SDK key is available for this platform. */
export const hasApiKey = Boolean(apiKeyForPlatform());

let configured = false;

export async function configureRevenueCat(): Promise<void> {
  if (!isNativeStore) return;
  const apiKey = apiKeyForPlatform();
  if (!apiKey) {
    throw new Error(`RevenueCat public SDK key missing for platform "${platform}".`);
  }
  if (configured) return;
  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
  } catch {
    /* older plugin without setLogLevel — ignore */
  }
  await Purchases.configure({ apiKey });
  configured = true;
}

function entitledFrom(active: Record<string, unknown>): boolean {
  return Object.prototype.hasOwnProperty.call(active, ENTITLEMENT_ID);
}

/** Current entitlement status. On web (dev) it is not gated and returns true. */
export async function isEntitled(): Promise<boolean> {
  if (!isNativeStore) return true;
  const { customerInfo } = await Purchases.getCustomerInfo();
  return entitledFrom(customerInfo.entitlements.active);
}

export class PurchaseCancelledError extends Error {}

/** Buy the first package of the current offering. Returns true if now entitled. */
export async function purchaseSubscription(): Promise<boolean> {
  if (!isNativeStore) return true;
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages?.[0];
  if (!pkg) {
    throw new Error(
      "Aucune offre RevenueCat disponible : configure une offering « current » avec au moins un produit dans le tableau de bord RevenueCat.",
    );
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    return entitledFrom(customerInfo.entitlements.active);
  } catch (e) {
    if (e && typeof e === "object" && (e as { userCancelled?: boolean }).userCancelled) {
      throw new PurchaseCancelledError("Achat annulé par l’utilisateur.");
    }
    throw e;
  }
}

/** Restore prior purchases. Returns true if the entitlement is now active. */
export async function restoreEntitlement(): Promise<boolean> {
  if (!isNativeStore) return true;
  const { customerInfo } = await Purchases.restorePurchases();
  return entitledFrom(customerInfo.entitlements.active);
}
