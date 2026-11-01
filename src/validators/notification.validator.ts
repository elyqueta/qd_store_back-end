import { z } from 'zod';

export const listNotificationsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    unreadOnly: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .default(false),
  })
  .strict();

export const notificationIdParamSchema = z
  .object({ id: z.uuid('id deve ser um UUID válido.') })
  .strict();

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
