import { Module } from '@nestjs/common';
import { BackendSupabaseModule } from '@kuetelabs/backend/supabase';
import { NotificationModule } from '@kuetelabs/backend/notification';
import { UserManagementModule } from '@kuetelabs/backend/user-management';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/** Composition root: import domain modules, define nothing. */
@Module({
  imports: [BackendSupabaseModule, NotificationModule, UserManagementModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
