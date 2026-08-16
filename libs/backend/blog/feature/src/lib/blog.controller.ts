import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  type AuthenticatedUser,
  CurrentUser,
  PermissionsGuard,
  RequirePermissions,
  SupabaseAuthGuard,
  ZodValidationPipe,
} from '@kuetelabs/backend/core';
import {
  type CreateBlogPostDto,
  type ListBlogPostsQuery,
  type UpdateBlogPostDto,
  createBlogPostSchema,
  listBlogPostsQuerySchema,
  updateBlogPostSchema,
} from '@kuetelabs/shared/domain';
import { BlogService } from './blog.service';

/**
 * Authoring surface for the blog.
 *
 * There is no public read endpoint here on purpose: the site reads published posts
 * straight from Supabase under RLS, which is faster and one less hop to keep alive.
 * What needs the API is writing, because `blog_posts` has no client write policy.
 *
 * Every route requires a verified Supabase JWT plus an explicit permission, checked
 * here in addition to RLS. The Angular guards only decide what renders.
 */
@Controller('admin/blog')
@UseGuards(SupabaseAuthGuard, PermissionsGuard)
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Get()
  @RequirePermissions('blog.read')
  list(@Query(new ZodValidationPipe(listBlogPostsQuerySchema)) query: ListBlogPostsQuery) {
    return this.blog.list(query);
  }

  @Get(':id')
  @RequirePermissions('blog.read')
  find(@Param('id', ParseUUIDPipe) id: string) {
    return this.blog.findById(id);
  }

  @Post()
  @RequirePermissions('blog.write')
  create(
    @CurrentUser() author: AuthenticatedUser,
    @Body(new ZodValidationPipe(createBlogPostSchema)) dto: CreateBlogPostDto,
  ) {
    this.assertMayPublish(author, dto.status);
    return this.blog.create(author.id, dto);
  }

  @Patch(':id')
  @RequirePermissions('blog.write')
  update(
    @CurrentUser() author: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateBlogPostSchema)) dto: UpdateBlogPostDto,
  ) {
    this.assertMayPublish(author, dto.status);
    return this.blog.update(id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions('blog.publish')
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.blog.setStatus(id, 'published');
  }

  @Post(':id/unpublish')
  @RequirePermissions('blog.publish')
  unpublish(@Param('id', ParseUUIDPipe) id: string) {
    return this.blog.setStatus(id, 'draft');
  }

  @Delete(':id')
  @RequirePermissions('blog.write')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.blog.remove(id);
  }

  /**
   * Publishing is gated by blog.publish, and `status` is an ordinary field on
   * create and update — so without this an author with only blog.write could
   * publish by POSTing `status: 'published'` instead of calling /publish.
   */
  private assertMayPublish(user: AuthenticatedUser, status: string | undefined): void {
    if (status === 'published' && !user.permissions.includes('blog.publish')) {
      throw new ForbiddenException('Missing permission(s): blog.publish');
    }
  }
}
