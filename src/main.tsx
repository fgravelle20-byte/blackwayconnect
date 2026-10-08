// Polyfill: requestIdleCallback is not available in Safari/WebKit.
const idleWindow = window as unknown as {
  requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
  cancelIdleCallback?: (id: number) => void;
};
if (!idleWindow.requestIdleCallback) {
  idleWindow.requestIdleCallback = (cb) =>
    window.setTimeout(() => cb({ didTimeout: true, timeRemaining: () => 0 }), 1);
  idleWindow.cancelIdleCallback = (id) => window.clearTimeout(id);
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LanguageProvider } from "./i18n";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);