import nodemailer from 'nodemailer';
import { renderTemplate } from '@/lib/notifications/templates';

export type NotificationPayload = {
  userId: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH';
  templateCode: string;
  data: Record<string, unknown>;
};

function getSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !port || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

export async function sendNotification(payload: NotificationPayload): Promise<{ ok: boolean; providerMessageId?: string }> {
  const transport = getSmtpTransport();
  const rendered = renderTemplate(payload.templateCode, payload.data);

  if (payload.channel === 'EMAIL' && transport && payload.data.email) {
    try {
      const info = await transport.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@luxurymembers.example',
        to: String(payload.data.email),
        subject: rendered.subject,
        text: rendered.body
      });
      return { ok: true, providerMessageId: info.messageId };
    } catch {
      return { ok: false };
    }
  }

  console.info('NOTIFY_FALLBACK', { payload, rendered });
  return { ok: true, providerMessageId: `msg_${crypto.randomUUID()}` };
}
