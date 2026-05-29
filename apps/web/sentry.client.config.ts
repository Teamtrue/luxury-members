import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Capture 10% of sessions in production; 100% in dev for easier testing
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Replay 1% of sessions, 100% on error
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,      // PII — mask all text by default
      blockAllMedia: true,
    }),
  ],

  // Strip PII from breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') {
      // Don't log request bodies — may contain OTPs, passwords, card data
      if (breadcrumb.data) {
        delete breadcrumb.data.body;
      }
    }
    return breadcrumb;
  },
});
