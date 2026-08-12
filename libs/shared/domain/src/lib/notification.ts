import { z } from 'zod';
import type { Database } from '@kuetelabs/shared/database-types';

export type NotificationType = Database['public']['Enums']['notification_type'];

export const NOTIFICATION_TYPES = [
  'role.granted',
  'role.revoked',
  'user.invited',
  'user.disabled',
  'user.enabled',
  'system',
] as const satisfies readonly NotificationType[];

export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);

/** A notification as the UI consumes it — camelCase, not the raw row. */
export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  actionUrl: string | null;
  read: boolean;
  createdAt: string;
}

/** Payload the API uses to create one. Producers are server-side only. */
export const createNotificationSchema = z.object({
  userId: z.uuid(),
  type: notificationTypeSchema,
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(2000).optional(),
  /** Relative path within the app, e.g. `/users`. */
  actionUrl: z.string().startsWith('/').optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
