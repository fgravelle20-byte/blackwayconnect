/** Ads / conversion IDs — set via Vite env; empty = no-op. */
export const META_PIXEL_ID = String(import.meta.env.VITE_META_PIXEL_ID || "");
export const GOOGLE_ADS_ID = String(import.meta.env.VITE_GOOGLE_ADS_ID || "");
export const GOOGLE_ADS_PURCHASE_LABEL = String(import.meta.env.VITE_GOOGLE_ADS_PURCHASE_LABEL || "");

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq?: any;
    _fbq?: unknown;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

let bootstrapped = false;

export function initTracking() {
  if (typeof window === "undefined" || bootstrapped) return;
  bootstrapped = true;

  if (META_PIXEL_ID) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!w.fbq) {
      const n: any = function (...args: unknown[]) {
        if (n.callMethod) n.callMethod(...args);
        else n.queue.push(args);
      };
      n.queue = [] as unknown[];
      n.loaded = true;
      n.version = "2.0";
      n.push = n;
      w.fbq = n;
      w._fbq = n;
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    }
    w.fbq("init", META_PIXEL_ID);
    w.fbq("track", "PageView");
  }

  if (GOOGLE_ADS_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
    document.head.appendChild(s);
    window.gtag("js", new Date());
    window.gtag("config", GOOGLE_ADS_ID);
  }
}

export function trackPageView(path: string) {
  if (META_PIXEL_ID && window.fbq) window.fbq("track", "PageView");
  if (GOOGLE_ADS_ID && window.gtag) window.gtag("event", "page_view", { page_path: path });
}

export function trackViewContent(opts: { name: string; id?: string; value?: number }) {
  if (META_PIXEL_ID && window.fbq) {
    window.fbq("track", "ViewContent", {
      content_name: opts.name,
      content_ids: opts.id ? [opts.id] : undefined,
      content_type: "product",
      value: opts.value,
      currency: "CAD",
    });
  }
  if (GOOGLE_ADS_ID && window.gtag) {
    window.gtag("event", "view_item", {
      currency: "CAD",
      value: opts.value,
      items: [{ item_id: opts.id || opts.name, item_name: opts.name }],
    });
  }
}

export function trackInitiateCheckout(opts: { plan: string; value: number }) {
  if (META_PIXEL_ID && window.fbq) {
    window.fbq("track", "InitiateCheckout", {
      content_name: opts.plan,
      content_ids: [opts.plan],
      value: opts.value,
      currency: "CAD",
      num_items: 1,
    });
  }
  if (GOOGLE_ADS_ID && window.gtag) {
    window.gtag("event", "begin_checkout", {
      currency: "CAD",
      value: opts.value,
      items: [{ item_id: opts.plan, item_name: opts.plan, price: opts.value }],
    });
  }
}

export function trackLead() {
  if (META_PIXEL_ID && window.fbq) window.fbq("track", "Lead");
  if (GOOGLE_ADS_ID && window.gtag) window.gtag("event", "generate_lead");
}

export function trackPurchase(opts: { plan?: string; value?: number }) {
  if (META_PIXEL_ID && window.fbq) {
    window.fbq("track", "Purchase", {
      content_name: opts.plan,
      content_ids: opts.plan ? [opts.plan] : undefined,
      value: opts.value || 0,
      currency: "CAD",
    });
  }
  if (GOOGLE_ADS_ID && window.gtag) {
    window.gtag("event", "purchase", {
      currency: "CAD",
      value: opts.value || 0,
      items: opts.plan ? [{ item_id: opts.plan, item_name: opts.plan }] : [],
    });
    if (GOOGLE_ADS_PURCHASE_LABEL) {
      window.gtag("event", "conversion", {
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
        value: opts.value || 0,
        currency: "CAD",
      });
    }
  }
}
