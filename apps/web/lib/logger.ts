/**
 * lib/logger.ts
 * Structured JSON logger for production observability.
 * Dev: pretty-prints with color. Prod: JSON lines for log aggregator ingestion.
 *
 * Edge-compatible: uses process.stdout.write in Node, console.log in Edge.
 * TODO: AI — Add ML-based anomaly detection on error patterns (see docs/AI_ROADMAP.md)
 */

import { brand } from '@/lib/brand'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  environment: string
  [key: string]: unknown
}

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: `${brand.slug}-web`,
    environment: process.env.NODE_ENV ?? 'unknown',
    ...context,
  }
}

const IS_DEV = process.env.NODE_ENV === 'development'

function output(level: LogLevel, entry: LogEntry): void {
  if (IS_DEV) {
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', info: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m',
    }
    const reset = '\x1b[0m'
    const prefix = `${colors[level]}[${level.toUpperCase()}]${reset}`
    const ctx = Object.fromEntries(
      Object.entries(entry).filter(([k]) => !['timestamp','level','message','service','environment'].includes(k))
    )
    console.log(`${prefix} ${entry.message}`, Object.keys(ctx).length ? ctx : '')
  } else {
    // JSON lines — compatible with Vercel, Datadog, CloudWatch
    try {
      process.stdout.write(JSON.stringify(entry) + '\n')
    } catch {
      console.log(JSON.stringify(entry))
    }
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => {
    if (IS_DEV) output('debug', formatLog('debug', message, context))
  },

  info: (message: string, context?: Record<string, unknown>) =>
    output('info', formatLog('info', message, context)),

  warn: (message: string, context?: Record<string, unknown>) =>
    output('warn', formatLog('warn', message, context)),

  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const errorCtx = error instanceof Error
      ? { error_name: error.name, error_message: error.message, stack: IS_DEV ? error.stack : undefined }
      : { error_raw: String(error) }
    output('error', formatLog('error', message, { ...errorCtx, ...context }))
  },

  security: (event: string, context?: Record<string, unknown>) => {
    const entry = formatLog('warn', `[SECURITY] ${event}`, { security_event: event, ...context })
    output('warn', entry)
    const siemUrl = process.env.SIEM_WEBHOOK_URL
    if (siemUrl) {
      fetch(siemUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => { /* never throw on SIEM failure */ })
    }
  },

  request: (method: string, path: string, status: number, durationMs: number, context?: Record<string, unknown>) =>
    output('info', formatLog('info', `${method} ${path} ${status}`, { duration_ms: durationMs, ...context })),
}
