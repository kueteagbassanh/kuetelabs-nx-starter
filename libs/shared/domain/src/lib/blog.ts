import { z } from 'zod';
import type { Database } from '@kuetelabs/shared/database-types';

/**
 * The blog contract shared by the Angular apps and the NestJS API.
 *
 * Same split as `rbac.ts`: the status enum is derived from the generated database
 * types, so a migration that adds a status breaks compilation everywhere it needs
 * handling rather than silently falling through a switch.
 */
export type BlogPostStatus = Database['public']['Enums']['blog_post_status'];

export const BLOG_POST_STATUSES = [
  'draft',
  'published',
  'archived',
] as const satisfies readonly BlogPostStatus[];

export const blogPostStatusSchema = z.enum(BLOG_POST_STATUSES);

/** Lower-case, hyphen-separated. Mirrors the check constraint on the column. */
export const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const blogSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(BLOG_SLUG_PATTERN, 'Use lower-case words separated by single hyphens.');

// ---------------------------------------------------------------- UI shapes

/** A post as the UI consumes it — camelCase, not the raw row. */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  /** Markdown. Rendered as text and inline formatting, never as raw HTML. */
  content: string;
  coverImageUrl: string | null;
  tags: string[];
  status: BlogPostStatus;
  authorId: string | null;
  publishedAt: string | null;
  updatedAt: string;
  /** Derived from the body — see `estimateReadingMinutes`. */
  readingMinutes: number;
}

/**
 * What a list renders. `content` is deliberately absent: the feed would otherwise
 * ship every article in full just to draw a page of cards.
 */
export type BlogPostSummary = Omit<BlogPost, 'content'>;

export interface BlogPostPage {
  posts: BlogPostSummary[];
  total: number;
}

// ---------------------------------------------------------------- helpers

const WORDS_PER_MINUTE = 200;

/** Rounded up, and never zero — "0 min read" reads like a bug. */
export function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/**
 * Title to URL segment. The editor uses it to propose a slug; the value is still
 * validated by `blogSlugSchema` before it reaches the database, because the author
 * may edit it afterwards.
 */
export function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      // Strip diacritics, so "Déploiement" becomes "deploiement" rather than
      // losing the accented letters to the non-alphanumeric pass below.
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120)
      // The slice can leave a trailing hyphen behind.
      .replace(/-+$/g, '')
  );
}

// ---------------------------------------------------------------- API payloads

const tagsSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(10)
  .transform((tags) => [...new Set(tags.map((tag) => tag.toLowerCase()))]);

export const createBlogPostSchema = z.object({
  slug: blogSlugSchema,
  title: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(400).optional(),
  content: z.string().trim().min(1).max(100_000),
  coverImageUrl: z.url().startsWith('http').optional(),
  tags: tagsSchema.default([]),
  status: blogPostStatusSchema.default('draft'),
  /**
   * Optional, and in the future for a scheduled post: the row is `published` but
   * the RLS policy hides it until the clock passes the date.
   */
  publishedAt: z.iso.datetime({ offset: true }).optional(),
});
export type CreateBlogPostDto = z.infer<typeof createBlogPostSchema>;

/** Every field optional — the editor sends only what changed. */
export const updateBlogPostSchema = createBlogPostSchema.partial();
export type UpdateBlogPostDto = z.infer<typeof updateBlogPostSchema>;

export const listBlogPostsQuerySchema = z.object({
  /** Full-text search across title, excerpt and body. */
  search: z.string().trim().max(200).optional(),
  tag: z.string().trim().max(40).optional(),
  /** Authoring only — the public feed is always published posts. */
  status: blogPostStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ListBlogPostsQuery = z.infer<typeof listBlogPostsQuerySchema>;
