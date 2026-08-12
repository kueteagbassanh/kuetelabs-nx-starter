import { Global, Module } from '@nestjs/common';
import { BackendSupabaseModule } from '@kuetelabs/backend/supabase';
import { NotificationService } from './notification.service';

/**
 * Global so any feature module can notify without importing it explicitly —
 * notifications are a cross-cutting concern, like logging.
 */
@Global()
@Module({
  imports: [BackendSupabaseModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
