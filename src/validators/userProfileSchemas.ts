import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/[0-9]/);
export const emailSchema = z.email().trim().toLowerCase().max(255);
export const fullNameSchema = z.string().trim().min(3).max(150);
export const phoneSchema = z.string().trim().min(9).max(20);
