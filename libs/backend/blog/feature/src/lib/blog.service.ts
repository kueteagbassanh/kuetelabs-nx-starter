import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  BlogPost,
  BlogPostPage,
  BlogPostSummary,
  CreateBlogPostDto,
  ListBlogPostsQuery,
  UpdateBlogPostDto,
} from '@kuetelabs/shared/domain';
import type { Database } from '@kuetelabs/shared/database-types';
import { SupabaseAdminService } from '@kuetelabs/backend/supabase';

type BlogPostRow = Database['public']['Tables']['blog_posts']['Row'];
type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert'];

/**
 * Exactly the columns SUMMARY_COLUMNS selects. supabase-js types the result from
 * the select string, so this has to stay in step with it — a Pick rather than an
 * Omit, because the query does not ask for `created_at` either.
 */
type BlogPostSummaryRow = Pick<
  BlogPostRow,
  | 'id'
  | 'slug'
  | 'title'
  | 'excerpt'
  | 'cover_image_url'
  | 'tags'
  | 'status'
  | 'author_id'
  | 'published_at'
  | 'updated_at'
  | 'reading_minutes'
>;

/** Postgres unique_violation — the slug is the only unique column on the table. */
const UNIQUE_VIOLATION = '23505';

/** Every column except the search vector, which is a Postgres detail. */
const POST_COLUMNS =
  'id, slug, title, excerpt, content, cover_image_url, tags, status, author_id, published_at, updated_at, reading_minutes';

/** The list view never selects `content` — see BlogPostSummary. */
const SUMMARY_COLUMNS =
  'id, slug, title, excerpt, cover_image_url, tags, status, author_id, published_at, updated_at, reading_minutes';

function toPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImageUrl: row.cover_image_url,
    tags: row.tags,
    status: row.status,
    authorId: row.author_id,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    readingMinutes: row.reading_minutes,
  };
}

/**
 * Reading time comes off the generated column, which is the whole reason it is
 * generated: a summary row deliberately has no `content` to measure.
 */
function toSummary(row: BlogPostSummaryRow): BlogPostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    tags: row.tags,
    status: row.status,
    authorId: row.author_id,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    readingMinutes: row.reading_minutes,
  };
}

/**
 * Authoring for the blog.
 *
 * `blog_posts` has no client write policy, so every mutation lands here and runs
 * with the service_role key. The permission check happens on the controller,
 * against the claims in the caller's verified JWT — this service assumes it has
 * already passed and does not re-derive authorization from the payload.
 *
 * Reading is the opposite case: the public feed goes straight to Supabase from the
 * browser under RLS. The list method here exists for the authoring screen, which
 * needs drafts and scheduled posts in one query.
 */
@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(private readonly supabase: SupabaseAdminService) {}

  async list(query: ListBlogPostsQuery): Promise<BlogPostPage> {
    return this.supabase.withAdmin('blog.list', async (client) => {
      let request = client
        .from('blog_posts')
        .select(SUMMARY_COLUMNS, { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range(query.offset, query.offset + query.limit - 1);

      if (query.status) {
        request = request.eq('status', query.status);
      }
      if (query.tag) {
        request = request.contains('tags', [query.tag]);
      }
      if (query.search) {
        request = request.textSearch('search_vector', query.search, {
          type: 'websearch',
          config: 'english',
        });
      }

      const { data, error, count } = await request;
      if (error) {
        throw new Error(`Failed to list posts: ${error.message}`);
      }

      return { posts: (data ?? []).map(toSummary), total: count ?? 0 };
    });
  }

  async findById(id: string): Promise<BlogPost> {
    return this.supabase.withAdmin('blog.findById', async (client) => {
      const { data, error } = await client
        .from('blog_posts')
        .select(POST_COLUMNS)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load post: ${error.message}`);
      }
      if (!data) {
        throw new NotFoundException(`No post with id ${id}`);
      }
      return toPost(data as BlogPostRow);
    });
  }

  async create(authorId: string, dto: CreateBlogPostDto): Promise<BlogPost> {
    return this.supabase.withAdmin('blog.create', async (client) => {
      const { data, error } = await client
        .from('blog_posts')
        .insert(this.toRow(dto, authorId))
        .select(POST_COLUMNS)
        .single();

      if (error) {
        // A duplicate slug is the author's mistake, not a server fault: 409, not 500.
        if (error.code === UNIQUE_VIOLATION) {
          throw new ConflictException(`The slug "${dto.slug}" is already taken.`);
        }
        throw new Error(`Failed to create post: ${error.message}`);
      }

      this.logger.log(`Created post ${data.slug} (${data.status})`);
      return toPost(data as BlogPostRow);
    });
  }

  async update(id: string, dto: UpdateBlogPostDto): Promise<BlogPost> {
    return this.supabase.withAdmin('blog.update', async (client) => {
      const changes = this.toRow(dto);

      const { data, error } = await client
        .from('blog_posts')
        .update(changes)
        .eq('id', id)
        .select(POST_COLUMNS)
        .maybeSingle();

      if (error) {
        if (error.code === UNIQUE_VIOLATION) {
          throw new ConflictException(`The slug "${dto.slug}" is already taken.`);
        }
        throw new Error(`Failed to update post: ${error.message}`);
      }
      if (!data) {
        throw new NotFoundException(`No post with id ${id}`);
      }
      return toPost(data as BlogPostRow);
    });
  }

  async remove(id: string): Promise<void> {
    await this.supabase.withAdmin('blog.remove', async (client) => {
      const { error } = await client.from('blog_posts').delete().eq('id', id);
      if (error) {
        throw new Error(`Failed to delete post: ${error.message}`);
      }
      this.logger.log(`Deleted post ${id}`);
    });
  }

  /**
   * Publish and unpublish are their own endpoints rather than a status field on
   * update, because they carry a different permission: an author with blog.write
   * may edit a draft all day without ever being able to put it in front of readers.
   */
  async setStatus(id: string, status: BlogPost['status']): Promise<BlogPost> {
    return this.update(id, { status });
  }

  /**
   * DTO to row. Only keys the caller actually sent are included, so a PATCH that
   * omits `excerpt` leaves the stored excerpt alone instead of nulling it.
   */
  private toRow(dto: UpdateBlogPostDto, authorId?: string): BlogPostInsert {
    const row: Record<string, unknown> = {};

    if (dto.slug !== undefined) row['slug'] = dto.slug;
    if (dto.title !== undefined) row['title'] = dto.title;
    if (dto.excerpt !== undefined) row['excerpt'] = dto.excerpt || null;
    if (dto.content !== undefined) row['content'] = dto.content;
    if (dto.coverImageUrl !== undefined) row['cover_image_url'] = dto.coverImageUrl || null;
    if (dto.tags !== undefined) row['tags'] = dto.tags;
    if (dto.status !== undefined) row['status'] = dto.status;
    if (dto.publishedAt !== undefined) row['published_at'] = dto.publishedAt;
    if (authorId !== undefined) row['author_id'] = authorId;

    return row as BlogPostInsert;
  }
}
