import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

// FirstHomeBuyers — iOS wrapper around the production website.
//
// This app does NOT bundle the Next.js build. `server.url` tells the native
// WebView to load the real, already-deployed production site directly, so
// every future `git push` to main that goes through the existing Lightsail
// CI/CD pipeline is reflected in the app immediately — no native rebuild, no
// App Store review, no `cap sync` required for ordinary content/feature
// changes. A native rebuild is only needed when this file, a native plugin,
// or anything under mobile/ changes.
//
// `webDir` still has to point at *something* — it's a hard requirement of
// Capacitor's tooling (`cap sync` / `cap add ios` fail without it) — but with
// `server.url` set, iOS never navigates to it. See mobile/www/index.html for
// why it exists and why it is intentionally inert.
const config: CapacitorConfig = {
  // PLACEHOLDER. Replace with the real bundle identifier registered in App
  // Store Connect before any real build/signing happens (see
  // docs/mobile/RELEASE_CHECKLIST.md). Changing this after the app has been
  // submitted once requires a NEW App Store listing, so get it right before
  // first submission.
  appId: 'io.firsthomebuyers.app',
  appName: 'FirstHomeBuyers',
  webDir: 'mobile/www',

  server: {
    url: 'https://firsthomebuyers.io',
    // HTTPS only — never allow the WebView to load plain http:// content.
    cleartext: false,
    // Only these hosts may load INSIDE the app's WebView. Anything else
    // (e.g. the realestate.com.au deep-link from /next-steps, a mailto:
    // link, a future OAuth provider's consent page) falls outside this list
    // and Capacitor's default behaviour is to hand it to the system browser
    // instead of navigating the in-app WebView to it. That is what keeps
    // "navigation remains inside the app" and "external links open
    // appropriately" both true without any extra plugin.
    allowNavigation: ['firsthomebuyers.io', '*.firsthomebuyers.io'],
  },

  ios: {
    // Lets the WebView's content account for the safe area itself (status
    // bar / notch / Dynamic Island / home indicator) rather than being
    // letterboxed by iOS, matching the safe-area CSS added in the web app.
    contentInset: 'automatic',
    scrollEnabled: true,
    // No native link-preview popup on long-press — this is a site, not a
    // document viewer.
    allowsLinkPreview: false,
  },

  plugins: {
    SplashScreen: {
      // We hide it manually (see CapacitorBridge.tsx) once the production
      // page has actually mounted, instead of an arbitrary fixed timeout —
      // that's what makes it a real "loading screen while the site loads"
      // rather than a cosmetic delay.
      launchAutoHide: false,
      backgroundColor: '#F5E642',
      showSpinner: false,
    },
    StatusBar: {
      // Capacitor's "Light" style renders dark status-bar icons/text, which
      // is what reads correctly against the lemon (#F5E642) brand background
      // used behind the status bar area — "Dark" style would render light
      // icons, nearly invisible on this light background.
      style: 'LIGHT',
      backgroundColor: '#F5E642',
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
