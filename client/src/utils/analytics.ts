// ---------------------------------------------------------------------------
// Umami analytics — privacy-first, cookieless web analytics.
//
// Loads only when REACT_APP_UMAMI_WEBSITE_ID is set, so local/dev builds stay
// clean and nothing tracks until you drop the id into the deploy env.
//
// Cloud setup: create a website at https://cloud.umami.is, copy its
// "Website ID", and set REACT_APP_UMAMI_WEBSITE_ID at build time.
//   REACT_APP_UMAMI_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
//   REACT_APP_UMAMI_SRC=https://cloud.umami.is/script.js   (optional override)
// ---------------------------------------------------------------------------

const WEBSITE_ID = process.env['REACT_APP_UMAMI_WEBSITE_ID'];
const SCRIPT_SRC = process.env['REACT_APP_UMAMI_SRC'] || 'https://cloud.umami.is/script.js';

declare global {
  interface Window {
    umami?: {
      track: (
        event?: string | ((props: Record<string, unknown>) => Record<string, unknown>),
        data?: Record<string, unknown>,
      ) => void;
    };
  }
}

/** Typed event names — single source of truth for everything we track. */
export type AnalyticsEvent =
  // ── Conversion funnel ──
  | 'login-success'
  | 'kyc-complete'
  | 'join-submit'
  // ── Engagement ──
  | 'language-switch'
  | 'theme-change'
  | 'globe-open'
  | 'cargo-open'
  // ── Landing interactions ──
  | 'landing-section'
  | 'join-click'
  | 'login-cta'
  // ── Shop ──
  | 'shop-open'
  | 'order-submit';

/** Inject the Umami script once, on app boot. No-op if unconfigured. */
export function initAnalytics(): void {
  if (!WEBSITE_ID || typeof document === 'undefined') return;
  if (document.querySelector('script[data-website-id]')) return;

  const script = document.createElement('script');
  script.async = true;
  script.defer = true;
  script.src = SCRIPT_SRC;
  script.setAttribute('data-website-id', WEBSITE_ID);
  document.head.appendChild(script);
}

/**
 * Track a custom event. Safe to call anywhere — never throws, and silently
 * does nothing when analytics is unconfigured or the script hasn't loaded.
 */
export function track(event: AnalyticsEvent, data?: Record<string, unknown>): void {
  try {
    window.umami?.track(event, data);
  } catch {
    /* analytics must never break the app */
  }
}
