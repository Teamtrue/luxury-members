/**
 * Next.js instrumentation file — runs once at server startup.
 * Handles: env validation, Sentry init, startup logging.
 */
export async function register() {
  await import('@/lib/env')

  if (process.env.SENTRY_DSN) {
    console.info('[instrumentation] Sentry DSN detected — install @sentry/nextjs to enable error tracking')
  }

  if (process.env.NODE_ENV === 'production') {
    const { brand } = await import('@/lib/brand')
    console.info(`[instrumentation] ${brand.name} server starting in production mode`)
  }
}
