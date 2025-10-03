import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  beforeSend(event) {
    if (event.level === "info") return null;
    if (event.message?.startsWith("api_call")) return null;
    if (event.tags?.kind === "api") return null;
    return event;
  },
  beforeSendTransaction(txn) {
    if (txn.transaction === "POST /api/internal/log") return null;
    return txn;
  },
  integrations: [Sentry.consoleIntegration({ levels: ["error", "warn"] })],
});
