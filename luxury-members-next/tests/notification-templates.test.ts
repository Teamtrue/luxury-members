import { describe, expect, it } from 'vitest';
import { renderTemplate } from '../lib/notifications/templates';

describe('renderTemplate', () => {
  it('renders verify email template', () => {
    const out = renderTemplate('VERIFY_EMAIL', { userId: 'u1', token: 't1' });
    expect(out.subject.length).toBeGreaterThan(0);
    expect(out.body).toContain('verify-email');
  });

  it('renders password reset template', () => {
    const out = renderTemplate('PASSWORD_RESET_OTP', { otp: '123456' });
    expect(out.body).toContain('123456');
  });
});
