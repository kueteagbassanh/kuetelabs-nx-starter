import { Injectable, Logger } from '@nestjs/common';
import type { CreateNotificationDto } from '@kuetelabs/shared/domain';
import { SupabaseAdminService } from '@kuetelabs/backend/supabase';

/**
 * Creates in-app notifications.
 *
 * Server-side only: `notifications` has no client insert policy, so a browser
 * cannot notify another user. Delivery to the UI is Supabase Realtime, which
 * applies the same RLS as a normal read — the client receives only its own rows.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly supabase: SupabaseAdminService) {}

  async notify(dto: CreateNotificationDto): Promise<void> {
    await this.supabase.withAdmin('notify', async (client) => {
      const { error } = await client.from('notifications').insert({
        user_id: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body ?? null,
        action_url: dto.actionUrl ?? null,
        metadata: (dto.metadata ?? {}) as never,
      });

      if (error) {
        // A failed notification must not fail the operation that triggered it —
        // losing a bell badge is not worth rolling back a role grant.
        this.logger.error(`Failed to create notification for ${dto.userId}: ${error.message}`);
      }
    });
  }

  /** Fan-out helper for events that concern several people. */
  async notifyMany(userIds: string[], dto: Omit<CreateNotificationDto, 'userId'>): Promise<void> {
    await Promise.all(userIds.map((userId) => this.notify({ ...dto, userId })));
  }
}
