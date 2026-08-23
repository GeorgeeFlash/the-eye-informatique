// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: "https://d0f8b9da20112ce7ddc44bc1d2241393@o4510977568800768.ingest.de.sentry.io/4510997344747600",
  enabled: isProduction,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: isProduction ? 1 : 0,

  // Enable logs to be sent to Sentry
  enableLogs: isProduction,

  // Enable sending user PII (Personally Identifiable Information)
  sendDefaultPii: true,
});
