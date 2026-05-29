/**
 * lib/security/siem.ts
 * ---------------------------------------------------------------------------
 * SIEM (Security Information and Event Management) event sink.
 *
 * When SIEM_WEBHOOK_URL is set, audit and security events are forwarded
 * to the configured endpoint (e.g. Splunk, Datadog, Elastic SIEM).
 * Failures are silent — never block the main application path.
 * ---------------------------------------------------------------------------
 */

import { createHmac } from 'crypto';

/**
 * Emit a security event to the configured SIEM webhook.
 * No-ops silently if SIEM_WEBHOOK_URL is not configured.
 */
export async function emitSiemEvent(event: Record<string, unknown>): Promise<void> {
  const endpoint = process.env.SIEM_WEBHOOK_URL;
  if (!endpoint) return;

  const body = JSON.stringify({ ...event, emittedAt: new Date().toISOString() });
  const secret = process.env.SIEM_WEBHOOK_SECRET ?? '';
  const signature = secret
    ? createHmac('sha256', secret).update(body).digest('hex')
    : '';

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature ? { 'X-Siem-Signature': signature } : {}),
      },
      body,
    });
  } catch {
    // Never block app path on SIEM outage.
  }
}

/** Convenience: emit a failed auth event (brute-force, invalid OTP, etc.). */
export async function emitAuthFailure(details: {
  action: string;
  identifier: string;
  ip: string;
  reason: string;
}): Promise<void> {
  await emitSiemEvent({ category: 'auth_failure', ...details });
}

/** Convenience: emit a suspicious admin action event. */
export async function emitAdminAlert(details: {
  action: string;
  adminId: string;
  ip: string;
  details: Record<string, unknown>;
}): Promise<void> {
  await emitSiemEvent({ category: 'admin_alert', ...details });
}
