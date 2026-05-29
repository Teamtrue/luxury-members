/**
 * lib/env.ts
 * Environment variable validation — runs at startup.
 * Crashes production immediately if required vars are missing.
 * In development, warns but continues (allows UI work without backend).
 *
 * Edge-compatible: no process.exit(), no Node.js-only APIs.
 */

const IS_PROD = process.env.NODE_ENV === 'production'

interface EnvVar {
  name: string
  required: boolean
  secret: boolean
  description: string
}

const REQUIRED_ENV: EnvVar[] = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, secret: false, description: 'Supabase project URL' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', required: true, secret: true, description: 'Supabase anon key' },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true, secret: true, description: 'Supabase service role key' },
  { name: 'APP_SECRET', required: true, secret: true, description: 'App signing secret (min 32 chars)' },
  { name: 'CSRF_SECRET', required: true, secret: true, description: 'CSRF token signing secret (min 32 chars)' },
  { name: 'NEXT_PUBLIC_APP_URL', required: true, secret: false, description: 'Full app URL (no trailing slash)' },
  { name: 'INTERNAL_JOB_TOKEN', required: true, secret: true, description: 'Bearer token for cron job routes' },
]

const OPTIONAL_ENV: EnvVar[] = [
  { name: 'REDIS_URL', required: false, secret: false, description: 'Redis URL for BullMQ worker job queue (required in production for worker)' },
  { name: 'UPSTASH_REDIS_URL', required: false, secret: false, description: 'Redis URL for distributed rate limiting' },
  { name: 'UPSTASH_REDIS_TOKEN', required: false, secret: true, description: 'Redis auth token' },
  { name: 'SENTRY_DSN', required: false, secret: false, description: 'Sentry DSN for error tracking' },
  { name: 'SIEM_WEBHOOK_URL', required: false, secret: false, description: 'SIEM event forwarding URL' },
]

function validateEnv(): { valid: boolean; missing: string[]; warnings: string[] } {
  const missing: string[] = []
  const warnings: string[] = []

  for (const env of REQUIRED_ENV) {
    const val = process.env[env.name]
    if (!val) {
      missing.push(`${env.name} — ${env.description}`)
    } else if ((env.name === 'APP_SECRET' || env.name === 'CSRF_SECRET') && val.length < 32) {
      warnings.push(`${env.name} should be at least 32 characters long`)
    }
  }

  for (const env of OPTIONAL_ENV) {
    if (!process.env[env.name]) {
      warnings.push(`${env.name} not set — ${env.description}`)
    }
  }

  return { valid: missing.length === 0, missing, warnings }
}

const validation = validateEnv()

if (!validation.valid) {
  const lines = [
    '╔════════════════════════════════════════════╗',
    '║      MISSING REQUIRED ENVIRONMENT VARS      ║',
    '╚════════════════════════════════════════════╝',
    '',
    'The following required environment variables are not set:',
    ...validation.missing.map(m => `  ✗ ${m}`),
    '',
    'Copy .env.example to .env.local and fill in all values.',
    '',
  ].join('\n')

  if (IS_PROD) {
    // In production: crash immediately (throw works in Edge Runtime; process.exit does not)
    console.error(lines)
    throw new Error('Missing required environment variables. See logs for details.')
  } else {
    console.warn('\n⚠️  Development mode — running without required env vars:\n')
    console.warn(validation.missing.map(m => `  ✗ ${m}`).join('\n'))
    console.warn('\nSome features will not work. See .env.example.\n')
  }
}

if (validation.warnings.length > 0 && IS_PROD) {
  console.warn('\n⚠️  Configuration warnings:')
  console.warn(validation.warnings.map(w => `  ⚠ ${w}`).join('\n'))
}

export const env = {
  supabaseUrl:            process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey:        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  appSecret:              process.env.APP_SECRET!,
  csrfSecret:             process.env.CSRF_SECRET!,
  appUrl:                 process.env.NEXT_PUBLIC_APP_URL!,
  internalJobToken:       process.env.INTERNAL_JOB_TOKEN!,
  redisUrl:               process.env.REDIS_URL, // optional — required in production for worker
  upstashRedisUrl:        process.env.UPSTASH_REDIS_URL,
  upstashRedisToken:      process.env.UPSTASH_REDIS_TOKEN,
  sentryDsn:              process.env.SENTRY_DSN,
  siemWebhookUrl:         process.env.SIEM_WEBHOOK_URL,
  isDev:                  process.env.NODE_ENV === 'development',
  isProd:                 process.env.NODE_ENV === 'production',
} as const
