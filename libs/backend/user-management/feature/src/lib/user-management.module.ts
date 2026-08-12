import { Module } from '@nestjs/common';
import { BackendSupabaseModule } from '@kuetelabs/backend/supabase';
import { NotificationModule } from '@kuetelabs/backend/notification';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';

@Module({
  imports: [BackendSupabaseModule, NotificationModule],
  controllers: [UserManagementController],
  providers: [UserManagementService],
  exports: [UserManagementService],
})
export class UserManagementModule {}
