import { createHmac } from 'crypto';

export async function emitAuditEvent(event: Record<string, unknown>): Promise<void> {
  const webhook = process.env.AUDIT_WEBHOOK_URL;
  if (!webhook) return;

  const body = JSON.stringify(event);
  const secret = process.env.AUDIT_WEBHOOK_SECRET || '';
  const signature = secret
    ? createHmac('sha256', secret).update(body).digest('hex')
    : '';

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Audit-Signature': signature
      },
      body
    });
  } catch {
    // Do not block main flow on sink outage.
  }
}
