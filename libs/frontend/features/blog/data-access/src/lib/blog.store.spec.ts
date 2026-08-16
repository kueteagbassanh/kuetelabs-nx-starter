import { TestBed } from '@angular/core/testing';
import { SUPABASE_CLIENT, SUPABASE_CONFIG } from '@kuetelabs/frontend/data-access/supabase';
import { BlogStore } from './blog.store';

interface Call {
  method: string;
  args: unknown[];
}

const ROW = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'hello-world',
  title: 'Hello world',
  excerpt: 'An excerpt.',
  cover_image_url: null,
  tags: ['starter', 'nx'],
  status: 'published',
  author_id: null,
  published_at: '2026-08-01T00:00:00.000Z',
  updated_at: '2026-08-01T00:00:00.000Z',
  reading_minutes: 4,
};

/**
 * A fake postgrest builder that records every filter it is given, so a test can
 * assert on the query itself rather than only on what came back.
 */
function fakeClient(result: { data?: unknown; error?: { message: string } | null; count?: number }) {
  const calls: Call[] = [];

  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'lte', 'order', 'range', 'contains', 'textSearch']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder['maybeSingle'] = () => Promise.resolve({ data: null, error: null, ...result });
  builder['then'] = (resolve: (value: unknown) => unknown) =>
    resolve({ data: [], error: null, count: 0, ...result });

  return {
    calls,
    client: {
      from: (table: string) => {
        calls.push({ method: 'from', args: [table] });
        return builder;
      },
    },
  };
}

function configure(fake: ReturnType<typeof fakeClient> | null) {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: SUPABASE_CONFIG,
        useValue: fake ? { url: 'http://localhost:54321', anonKey: 'anon' } : { url: '', anonKey: '' },
      },
      ...(fake ? [{ provide: SUPABASE_CLIENT, useValue: fake.client }] : []),
    ],
  });
  return TestBed.inject(BlogStore);
}

describe('BlogStore', () => {
  it('filters the public feed on status, not only through RLS', async () => {
    // The reason this matters: an editor holding blog.read matches a second, broader
    // RLS policy, and Postgres OR-es policies together. Without these two filters in
    // the query, signing in as an editor puts drafts on the public blog.
    const fake = fakeClient({ data: [ROW], count: 1 });
    const store = configure(fake);

    await store.load();

    const status = fake.calls.find((call) => call.method === 'eq');
    expect(status?.args).toEqual(['status', 'published']);

    const scheduled = fake.calls.find((call) => call.method === 'lte');
    expect(scheduled?.args[0]).toBe('published_at');
  });

  it('maps rows onto the UI shape', async () => {
    const store = configure(fakeClient({ data: [ROW], count: 1 }));

    await store.load();

    expect(store.entities()).toEqual([
      expect.objectContaining({
        slug: 'hello-world',
        coverImageUrl: null,
        readingMinutes: 4,
        tags: ['starter', 'nx'],
      }),
    ]);
  });

  it('never selects the article body for the feed', async () => {
    // A page of cards must not ship a page of full articles.
    const fake = fakeClient({ data: [ROW], count: 1 });
    const store = configure(fake);

    await store.load();

    const select = fake.calls.find((call) => call.method === 'select');
    expect(select?.args[0]).not.toContain('content');
    expect(select?.args[0]).toContain('reading_minutes');
  });

  it('surfaces a query error instead of leaving the page blank', async () => {
    const store = configure(fakeClient({ error: { message: 'connection refused' } }));

    await store.load();

    expect(store.error()).toBe('connection refused');
    expect(store.loading()).toBe(false);
  });

  it('reports a missing article as missing, not as an error', async () => {
    // The two states render differently: one is a 404 screen, the other is a failure.
    const store = configure(fakeClient({ data: null }));

    await store.loadPost('nope');

    expect(store.postMissing()).toBe(true);
    expect(store.post()).toBeNull();
    expect(store.error()).toBeNull();
  });

  it('collects tag filters from the loaded posts', async () => {
    const store = configure(fakeClient({ data: [ROW, { ...ROW, id: '2', tags: ['nx'] }], count: 2 }));

    await store.load();

    expect(store.tags()).toEqual(['nx', 'starter']);
  });

  it('degrades to an empty feed when Supabase is not configured', async () => {
    // The blog is on the public marketing site, so a fresh clone has to reach it.
    // Injecting SUPABASE_CLIENT unconfigured throws by design.
    const store = configure(null);

    await store.load();

    expect(store.entities()).toEqual([]);
    expect(store.isEmpty()).toBe(true);
    expect(store.error()).toBeNull();
  });
});
