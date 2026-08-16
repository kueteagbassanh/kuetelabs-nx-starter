import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '@kuetelabs/backend/core';
import type { SupabaseAdminService } from '@kuetelabs/backend/supabase';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

const ROW = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'hello-world',
  title: 'Hello world',
  excerpt: 'An excerpt.',
  content: 'Some body text.',
  cover_image_url: null,
  tags: ['starter'],
  status: 'draft' as const,
  author_id: 'author-1',
  published_at: null,
  updated_at: '2026-08-16T00:00:00.000Z',
  reading_minutes: 3,
};

/**
 * A fake postgrest builder. Every method returns `this` so a chain of filters
 * resolves to whatever the test configured, and the last payload passed to
 * insert/update is captured for assertions.
 */
function serviceWith(result: { data?: unknown; error?: { message: string; code?: string } | null }) {
  const captured: { payload?: Record<string, unknown> } = {};

  const builder: Record<string, unknown> = {
    select: () => builder,
    order: () => builder,
    range: () => builder,
    eq: () => builder,
    contains: () => builder,
    textSearch: () => builder,
    delete: () => builder,
    insert: (payload: Record<string, unknown>) => {
      captured.payload = payload;
      return builder;
    },
    update: (payload: Record<string, unknown>) => {
      captured.payload = payload;
      return builder;
    },
    single: () => Promise.resolve({ error: null, ...result }),
    maybeSingle: () => Promise.resolve({ error: null, ...result }),
    then: (resolve: (value: unknown) => unknown) =>
      resolve({ error: null, count: 0, ...result }),
  };

  const client = { from: () => builder };
  const supabase = {
    withAdmin: <T>(_operation: string, fn: (c: unknown) => Promise<T>) => fn(client),
  } as unknown as SupabaseAdminService;

  return { service: new BlogService(supabase), captured };
}

describe('BlogService', () => {
  it('maps a row onto the UI shape', async () => {
    const { service } = serviceWith({ data: ROW });

    const post = await service.findById(ROW.id);

    expect(post).toEqual(
      expect.objectContaining({ slug: 'hello-world', coverImageUrl: null, tags: ['starter'] }),
    );
  });

  it('takes reading time from the generated column rather than recomputing it', async () => {
    // The list query has no `content` to measure, so the number has to come from
    // the database or the two views would disagree.
    const { service } = serviceWith({ data: { ...ROW, reading_minutes: 7 } });

    expect((await service.findById(ROW.id)).readingMinutes).toBe(7);
  });

  it('stamps the author on create', async () => {
    const { service, captured } = serviceWith({ data: ROW });

    await service.create('author-1', {
      slug: 'hello-world',
      title: 'Hello world',
      content: 'Some body text.',
      tags: [],
      status: 'draft',
    });

    expect(captured.payload).toEqual(expect.objectContaining({ author_id: 'author-1' }));
  });

  it('sends only the fields the caller supplied', async () => {
    const { service, captured } = serviceWith({ data: ROW });

    await service.update(ROW.id, { title: 'A new title' });

    // Omitting excerpt must leave the stored one alone, not null it out.
    expect(captured.payload).toEqual({ title: 'A new title' });
  });

  it('turns a duplicate slug into a 409 rather than a 500', async () => {
    const { service } = serviceWith({ error: { message: 'duplicate key', code: '23505' } });

    await expect(
      service.create('author-1', {
        slug: 'hello-world',
        title: 'Hello world',
        content: 'Body.',
        tags: [],
        status: 'draft',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('404s on a missing post instead of returning undefined', async () => {
    const { service } = serviceWith({ data: null });

    await expect(service.findById(ROW.id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('leaves published_at to the database trigger when publishing', async () => {
    const { service, captured } = serviceWith({ data: { ...ROW, status: 'published' } });

    await service.setStatus(ROW.id, 'published');

    expect(captured.payload).toEqual({ status: 'published' });
  });
});

describe('BlogController', () => {
  const writer: AuthenticatedUser = {
    id: 'author-1',
    email: 'author@example.com',
    roles: [],
    permissions: ['blog.read', 'blog.write'],
  };

  function controller() {
    const { service } = serviceWith({ data: ROW });
    return new BlogController(service);
  }

  it('refuses to create an already-published post without blog.publish', () => {
    // Otherwise blog.write alone would publish by POSTing status: 'published',
    // going around the /publish route the permission actually guards. The check
    // runs before the service is touched, so it throws synchronously.
    expect(() =>
      controller().create(writer, {
        slug: 'hello-world',
        title: 'Hello world',
        content: 'Body.',
        tags: [],
        status: 'published',
      }),
    ).toThrow(ForbiddenException);
  });

  it('refuses to publish through an update without blog.publish', () => {
    expect(() => controller().update(writer, ROW.id, { status: 'published' })).toThrow(
      ForbiddenException,
    );
  });

  it('allows a draft through with only blog.write', async () => {
    await expect(
      controller().create(writer, {
        slug: 'hello-world',
        title: 'Hello world',
        content: 'Body.',
        tags: [],
        status: 'draft',
      }),
    ).resolves.toEqual(expect.objectContaining({ slug: 'hello-world' }));
  });
});
