import { z } from 'zod';

export const requestPasswordResetSchema = z.object({
  email: z.string().email()
});

export const confirmPasswordResetSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(10),
  newPassword: z.string().min(10)
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(10)
});
