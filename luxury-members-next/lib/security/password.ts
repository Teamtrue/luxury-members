export function validateStrongPassword(value: string): { ok: boolean; reason?: string } {
  if (value.length < 10) return { ok: false, reason: 'Password must be at least 10 characters' };
  if (!/[A-Z]/.test(value)) return { ok: false, reason: 'Password must include an uppercase letter' };
  if (!/[a-z]/.test(value)) return { ok: false, reason: 'Password must include a lowercase letter' };
  if (!/[0-9]/.test(value)) return { ok: false, reason: 'Password must include a number' };
  if (!/[^A-Za-z0-9]/.test(value)) return { ok: false, reason: 'Password must include a special character' };
  return { ok: true };
}
