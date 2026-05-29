import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Never log request/response bodies — they may contain payment data or OTPs
  beforeSend(event) {
    if (event.request) {
      delete event.request.data;
      delete event.request.cookies;
    }
    return event;
  },
});
