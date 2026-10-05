import { z } from 'zod';

export const registerSchema = z.object({
  phone: z.string().min(10, 'Nomor HP minimal 10 digit'),
  fullName: z.string().min(3, 'Nama minimal 3 karakter'),
});

export const otpSchema = z.object({
  phone: z.string(),
  code: z.string().length(6, 'Kode OTP 6 digit'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
