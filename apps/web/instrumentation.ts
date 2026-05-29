/**
 * Next.js instrumentation file — runs once at server startup.
 * Handles: env validation, Sentry init, startup logging.
 */
export async function register() {
  await import('@/lib/env')

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }

  if (process.env.NODE_ENV === 'production') {
    const { brand } = await import('@/lib/brand')
    console.info(`[instrumentation] ${brand.name} server starting in production mode`)
  }
}
