import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest';
import { createCsrfToken, verifyCsrfToken } from '@/lib/security/csrf';

const originalSecret = process.env.CSRF_SECRET;

beforeEach(() => {
  process.env.CSRF_SECRET = 'test_csrf_secret_at_least_32_chars_';
});

afterEach(() => {
  process.env.CSRF_SECRET = originalSecret;
  vi.useRealTimers();
});

describe('csrf tokens', () => {
  it('accepts a valid token for the matching session', () => {
    const token = createCsrfToken('session-a');
    expect(verifyCsrfToken(token, 'session-a')).toBe(true);
  });

  it('rejects token reuse across sessions', () => {
    const token = createCsrfToken('session-a');
    expect(verifyCsrfToken(token, 'session-b')).toBe(false);
  });

  it('rejects expired tokens', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-29T00:00:00.000Z'));
    const token = createCsrfToken('session-a');

    vi.setSystemTime(new Date('2026-05-29T02:01:00.000Z'));
    expect(verifyCsrfToken(token, 'session-a')).toBe(false);
  });
});
