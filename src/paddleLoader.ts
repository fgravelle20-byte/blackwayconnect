/** Paddle.js is shared by the public home page (Retain) and checkout route. */
let scriptPromise: Promise<void> | undefined;
let initialized = false;

export function loadPaddleScript(): Promise<void> {
  if (window.Paddle) return Promise.resolve();
  if (!scriptPromise) scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = undefined;
      script.remove();
      reject(new Error("Paddle unavailable"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function initializePaddleOnce(token: string, eventCallback?: (event: { name?: string; data?: { transaction_id?: string } }) => void): void {
  if (!window.Paddle) throw new Error("Paddle unavailable");
  if (!initialized) {
    window.Paddle.Initialize({ token, ...(eventCallback ? { eventCallback } : {}) });
    initialized = true;
  } else if (eventCallback) {
    window.Paddle.Update({ eventCallback });
  }
}

export async function resolvePaddleClientToken(fallback = "live_a4f8ad8f1c8be908ec3784e8d8b"): Promise<string> {
  const fromBuild = String(import.meta.env.VITE_PADDLE_CLIENT_TOKEN || "").trim();
  if (fromBuild.startsWith("live_")) return fromBuild;
  try {
    const response = await fetch("https://api.blackwayconnect.com/paddle/client-config", { credentials: "omit" });
    if (response.ok) {
      const data = (await response.json()) as { client_token?: string; clientToken?: string };
      const token = String(data.client_token || data.clientToken || "").trim();
      if (token.startsWith("live_")) return token;
    }
  } catch { /* use the existing public checkout fallback */ }
  return fallback;
}
