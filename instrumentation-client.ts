// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://d0f8b9da20112ce7ddc44bc1d2241393@o4510977568800768.ingest.de.sentry.io/4510997344747600",
  enabled: isProduction,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: isProduction ? 1 : 0,
  // Enable logs to be sent to Sentry
  enableLogs: isProduction,

  // Define how likely Replay events are sampled.
  replaysSessionSampleRate: isProduction ? 0.1 : 0,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: isProduction ? 1.0 : 0,

  // Enable sending user PII (Personally Identifiable Information)
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
