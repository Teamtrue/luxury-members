export type NotificationPayload = {
  userId: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH';
  templateCode: string;
  data: Record<string, unknown>;
};

export async function sendNotification(payload: NotificationPayload): Promise<{ ok: boolean; providerMessageId?: string }> {
  // Placeholder adapter. Next step: integrate SES/SendGrid/Twilio providers.
  console.info('NOTIFY', payload);
  return { ok: true, providerMessageId: `msg_${crypto.randomUUID()}` };
}
