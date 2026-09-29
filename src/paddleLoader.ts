/** Initialize Retain on the public homepage, using the existing checkout account. */
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

async function resolvePaddleClientToken(): Promise<string> {
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
  // This browser-public token is already used by the production /payer page.
  return "live_a4f8ad8f1c8be908ec3784e8d8b";
}

export async function initializePublicHomePaddle(): Promise<void> {
  // Checkout may have initialized Paddle already during same-tab navigation.
  if (window.Paddle || initialized) return;
  const token = await resolvePaddleClientToken();
  if (window.Paddle || initialized) return;
  await loadPaddleScript();
  if (!initialized) {
    const paddle = getPaddle();
    if (!paddle) throw new Error("Paddle unavailable");
    paddle.Initialize({ token });
    initialized = true;
  }
}

function getPaddle(): Window["Paddle"] {
  return window.Paddle;
}
