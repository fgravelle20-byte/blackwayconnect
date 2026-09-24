/**
 * Twin Turbo Full Performance — dual lead engines for BlackWayConnect.
 *
 * Turbo A (Volume)  — intake pressure: how many leads the system must absorb.
 * Turbo B (Quality) — close pressure: speed, CRM integrity, payments recovered.
 * Twin score        — blended performance index for CRM + plan recommendation.
 *
 * Never invent payment proof from the client score alone — fulfillment stays
 * on verified Paddle/Stripe webhooks.
 */

import type { PlanKey } from "./stripeConfig";

export const ENGINE_MODE = "twin_turbo_full_performance" as const;

export type TwinTurboInput = {
  /** Leak Score 0–100 (higher = more revenue leaking). */
  leakScore: number;
  answers: Record<string, string>;
};

export type TwinTurboResult = {
  mode: typeof ENGINE_MODE;
  volumeTurbo: number;
  qualityTurbo: number;
  twinScore: number;
  band: "low" | "mid" | "high";
  recommendedPlan: PlanKey;
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** Turbo A — volume / bilingual expansion pressure. */
export function volumeTurbo(answers: Record<string, string>): number {
  const volume = { v1: 28, v2: 48, v3: 72, v4: 92 }[answers.volume || ""] ?? 40;
  const bilingual = { b1: 12, b2: 28, b3: 48, b4: 62 }[answers.bilingual || ""] ?? 20;
  return clamp(volume * 0.7 + bilingual * 0.3);
}

/** Turbo B — quality / speed / CRM / payments recovery pressure. */
export function qualityTurbo(answers: Record<string, string>, leakScore: number): number {
  const speed = { s1: 18, s2: 36, s3: 68, s4: 92 }[answers.speed || ""] ?? 40;
  const crm = { c1: 16, c2: 42, c3: 68, c4: 90 }[answers.crm || ""] ?? 40;
  const close = { cl1: 18, cl2: 40, cl3: 66, cl4: 88 }[answers.close || ""] ?? 40;
  const payments = { p1: 16, p2: 44, p3: 72, p4: 94 }[answers.payments || ""] ?? 40;
  const fromAnswers = speed * 0.28 + crm * 0.24 + close * 0.24 + payments * 0.24;
  return clamp(fromAnswers * 0.65 + leakScore * 0.35);
}

export function twinBand(twinScore: number): "low" | "mid" | "high" {
  if (twinScore >= 72) return "high";
  if (twinScore >= 42) return "mid";
  return "low";
}

/**
 * Recommend among Paddle self-serve plans only (Launch / Growth / Scale).
 * Spark / Command / Partner stay contact-led — not returned here.
 */
export function twinRecommendPlan(
  twinScore: number,
  answers: Record<string, string>,
): PlanKey {
  const volumeHeavy = ["v3", "v4"].includes(answers.volume || "");
  const paymentLeak = ["p3", "p4"].includes(answers.payments || "");
  const speedLeak = ["s3", "s4"].includes(answers.speed || "");
  if (twinScore >= 72 || (volumeHeavy && (paymentLeak || speedLeak))) {
    return "grow_hub_scale";
  }
  if (twinScore >= 42 || volumeHeavy || paymentLeak) {
    return "grow_hub_growth";
  }
  return "grow_hub_launch";
}

export function computeTwinTurbo(input: TwinTurboInput): TwinTurboResult {
  const leak = clamp(input.leakScore);
  const volume = volumeTurbo(input.answers);
  const quality = qualityTurbo(input.answers, leak);
  // Twin turbo blend — quality weighted slightly higher (close the leak).
  const twinScore = clamp(volume * 0.42 + quality * 0.58);
  return {
    mode: ENGINE_MODE,
    volumeTurbo: volume,
    qualityTurbo: quality,
    twinScore,
    band: twinBand(twinScore),
    recommendedPlan: twinRecommendPlan(twinScore, input.answers),
  };
}

/** Payload fragment for POST /api/lead — first-class CRM fields. */
export function twinTurboLeadFields(result: TwinTurboResult, answers: Record<string, string>) {
  return {
    leak_score: result.twinScore,
    band: result.band,
    engine_mode: result.mode,
    volume_turbo: result.volumeTurbo,
    quality_turbo: result.qualityTurbo,
    twin_score: result.twinScore,
    answers,
  };
}
