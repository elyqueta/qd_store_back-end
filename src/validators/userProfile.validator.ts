import { z } from 'zod';
import { emailSchema, fullNameSchema, passwordSchema, phoneSchema } from './userProfileSchemas';

export const updateUserProfileSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: passwordSchema.optional(),
    removePhoto: z.preprocess(
      (value) => (value === 'true' ? true : value === 'false' ? false : value),
      z.boolean().optional()
    ),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envie pelo menos um campo para actualizar o perfil.',
  })
  .refine(
    (data) =>
      data.fullName !== undefined ||
      data.email !== undefined ||
      data.phone !== undefined ||
      data.newPassword !== undefined ||
      data.removePhoto !== undefined,
    { message: 'Envie pelo menos uma alteração de perfil.' }
  )
  .refine((data) => !data.newPassword || !!data.currentPassword, {
    message: 'currentPassword é obrigatória para alterar a password.',
    path: ['currentPassword'],
  })
  .refine((data) => !data.email || !!data.currentPassword, {
    message: 'currentPassword é obrigatória para alterar o email.',
    path: ['currentPassword'],
  });

export const emptyUserProfileSchema = z.object({}).strict();
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
