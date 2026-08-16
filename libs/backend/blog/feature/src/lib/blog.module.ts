import { Module } from '@nestjs/common';
import { BackendSupabaseModule } from '@kuetelabs/backend/supabase';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

/**
 * Not @Global, unlike NotificationModule: nothing else in the API needs to write
 * a blog post, so the service stays reachable only through the controller.
 */
@Module({
  imports: [BackendSupabaseModule],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
