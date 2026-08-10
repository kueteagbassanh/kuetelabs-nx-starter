import { Module } from '@nestjs/common';
import { BackendSupabaseModule } from '@kuetelabs/backend/supabase';
import { UserManagementModule } from '@kuetelabs/backend/user-management';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/** Composition root: import domain modules, define nothing. */
@Module({
  imports: [BackendSupabaseModule, UserManagementModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
