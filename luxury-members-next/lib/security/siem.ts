export async function emitSiemEvent(event: Record<string, unknown>): Promise<void> {
  const endpoint = process.env.SIEM_WEBHOOK_URL;
  if (!endpoint) return;

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  } catch {
    // do not block app path
  }
}
