import { z } from 'zod';

export const verifyEmailSchema = z.object({
  userId: z.string().min(8),
  token: z.string().min(16)
});
