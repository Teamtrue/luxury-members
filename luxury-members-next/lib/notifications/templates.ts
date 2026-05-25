export function renderTemplate(templateCode: string, data: Record<string, unknown>): { subject: string; body: string } {
  switch (templateCode) {
    case 'VERIFY_EMAIL': {
      const userId = String(data.userId || '');
      const token = String(data.token || '');
      const base = String(process.env.APP_BASE_URL || 'http://localhost:3000');
      const verifyUrl = `${base}/verify-email?userId=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`;
      return {
        subject: 'Verify your Luxury Members account',
        body: `Welcome! Verify your email by opening: ${verifyUrl}`
      };
    }
    case 'PASSWORD_RESET_OTP': {
      const otp = data.otp ? String(data.otp) : 'Check your registered channel';
      return {
        subject: 'Your password reset OTP',
        body: `Use this OTP to reset your password: ${otp}`
      };
    }
    default:
      return {
        subject: 'Luxury Members notification',
        body: JSON.stringify(data)
      };
  }
}
