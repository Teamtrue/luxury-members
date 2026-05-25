import { describe, expect, it } from 'vitest';
import { validateStrongPassword } from '../lib/security/password';

describe('validateStrongPassword', () => {
  it('accepts strong password', () => {
    const result = validateStrongPassword('Str0ng!Passw0rd');
    expect(result.ok).toBe(true);
  });

  it('rejects weak password', () => {
    const result = validateStrongPassword('weakpass');
    expect(result.ok).toBe(false);
  });
});
