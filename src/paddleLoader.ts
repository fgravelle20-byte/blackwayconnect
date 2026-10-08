/**
 * Paddle has been retired. These functions are kept as no-ops
 * so any remaining imports don't crash during the migration.
 */
export function loadPaddleScript(): Promise<void> {
  return Promise.resolve();
}

export async function initializePublicHomePaddle(): Promise<void> {
  // No-op — Paddle.js is no longer loaded.
}