import { PendingTasks, computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntities, setAllEntities, withEntities } from '@ngrx/signals/entities';
import { debounceTime, distinctUntilChanged, pipe, switchMap, tap } from 'rxjs';
import type { BlogPost, BlogPostSummary } from '@kuetelabs/shared/domain';
import type { Database } from '@kuetelabs/shared/database-types';
import {
  SUPABASE_CONFIG,
  injectSupabaseClient,
  isSupabaseConfigured,
} from '@kuetelabs/frontend/data-access/supabase';

type BlogPostRow = Database['public']['Tables']['blog_posts']['Row'];

/**
 * The columns a card needs. `content` is deliberately absent — a page of nine
 * articles would otherwise ship nine full articles to draw nine summaries, which
 * is also why `reading_minutes` is a generated column rather than a count done here.
 */
const SUMMARY_COLUMNS =
  'id, slug, title, excerpt, cover_image_url, tags, status, author_id, published_at, updated_at, reading_minutes';

const POST_COLUMNS = `${SUMMARY_COLUMNS}, content`;

/** Three rows of three. */
const PAGE_SIZE = 9;

type SummaryRow = Pick<
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

function toSummary(row: SummaryRow): BlogPostSummary {
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

function toPost(row: SummaryRow & { content: string }): BlogPost {
  return { ...toSummary(row), content: row.content };
}

interface BlogState {
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  total: number;
  search: string;
  tag: string | null;
  offset: number;
  /** The article currently open at /blog/:slug. */
  post: BlogPost | null;
  postLoading: boolean;
  /** Distinguishes "no such post" from "the request failed" — one is a 404 page. */
  postMissing: boolean;
}

const initialState: BlogState = {
  loading: false,
  loadingMore: false,
  error: null,
  total: 0,
  search: '',
  tag: null,
  offset: 0,
  post: null,
  postLoading: false,
  postMissing: false,
};

/**
 * The public blog feed.
 *
 * Reads go straight to Supabase under RLS — there is no API hop, which is what lets
 * `web` render /blog on the server with nothing but the anon key. Writing is the
 * opposite case and lives in `BlogAdminStore`, because `blog_posts` has no client
 * write policy at all.
 */
export const BlogStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<BlogPostSummary>(),
  withComputed(({ entities, total, loading }) => ({
    hasMore: computed(() => entities().length < total()),
    isEmpty: computed(() => !loading() && entities().length === 0),
    /**
     * Tag filters, drawn from the posts that are loaded rather than from a separate
     * query. It is a filter over what the reader can see, not a site-wide index.
     */
    tags: computed(() =>
      [...new Set(entities().flatMap((post) => post.tags))].sort((a, b) => a.localeCompare(b)),
    ),
  })),
  withMethods((store) => {
    // Injecting SUPABASE_CLIENT throws when no anon key is set, and the blog sits on
    // the public marketing site — a fresh clone has to stay navigable. So the client
    // is resolved only when there is something to connect to, and every method below
    // degrades to an empty feed instead of a broken page.
    const configured = isSupabaseConfigured(inject(SUPABASE_CONFIG, { optional: true }));
    const supabase = configured ? injectSupabaseClient() : null;
    const pendingTasks = inject(PendingTasks);

    /**
     * The public feed filters on status explicitly, even though RLS already limits
     * what comes back. It has to: an editor holding blog.read matches a second,
     * broader policy, and policies are OR-ed — without this, signing in as an editor
     * would quietly put drafts on the public blog.
     */
    function publishedQuery() {
      const client = supabase;
      if (!client) {
        return null;
      }
      return client
        .from('blog_posts')
        .select(SUMMARY_COLUMNS, { count: 'exact' })
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false });
    }

    async function fetchPage(offset: number): Promise<void> {
      const base = publishedQuery();
      if (!base) {
        patchState(store, setAllEntities([] as BlogPostSummary[]), { loading: false, total: 0 });
        return;
      }

      const append = offset > 0;
      patchState(store, append ? { loadingMore: true } : { loading: true, error: null });

      // Blocks SSR serialization until the rows arrive. Without it the server would
      // render an empty feed and the page would only fill in after hydration —
      // exactly what a blog cannot afford, since crawlers read the server's HTML.
      const done = pendingTasks.add();
      try {
        let request = base.range(offset, offset + PAGE_SIZE - 1);

        const tag = store.tag();
        if (tag) {
          request = request.contains('tags', [tag]);
        }
        const search = store.search().trim();
        if (search) {
          request = request.textSearch('search_vector', search, {
            type: 'websearch',
            config: 'english',
          });
        }

        const { data, error, count } = await request;
        if (error) {
          patchState(store, { error: error.message, loading: false, loadingMore: false });
          return;
        }

        const posts = (data ?? []).map(toSummary);
        patchState(
          store,
          append ? addEntities(posts) : setAllEntities(posts),
          { total: count ?? 0, offset, loading: false, loadingMore: false },
        );
      } finally {
        done();
      }
    }

    return {
      /** First page, replacing whatever was loaded. */
      load(): Promise<void> {
        return fetchPage(0);
      },

      loadMore(): Promise<void> {
        if (!store.hasMore() || store.loadingMore()) {
          return Promise.resolve();
        }
        return fetchPage(store.offset() + PAGE_SIZE);
      },

      /**
       * Debounced so typing issues one request, and switchMap'd so a slow earlier
       * response cannot overwrite a newer one.
       */
      search: rxMethod<string>(
        pipe(
          debounceTime(300),
          distinctUntilChanged(),
          tap((term) => patchState(store, { search: term })),
          switchMap(() => fetchPage(0)),
        ),
      ),

      filterByTag(tag: string | null): Promise<void> {
        patchState(store, { tag });
        return fetchPage(0);
      },

      /** Loads one article by slug. The same published filters apply. */
      async loadPost(slug: string): Promise<void> {
        if (!supabase) {
          patchState(store, { post: null, postMissing: true, postLoading: false });
          return;
        }

        patchState(store, { postLoading: true, postMissing: false, error: null });

        const done = pendingTasks.add();
        try {
          const { data, error } = await supabase
            .from('blog_posts')
            .select(POST_COLUMNS)
            .eq('slug', slug)
            .eq('status', 'published')
            .lte('published_at', new Date().toISOString())
            .maybeSingle();

          if (error) {
            patchState(store, { error: error.message, postLoading: false });
            return;
          }

          patchState(store, {
            post: data ? toPost(data as SummaryRow & { content: string }) : null,
            postMissing: !data,
            postLoading: false,
          });
        } finally {
          done();
        }
      },

      /** Called when leaving the article, so the next one never flashes stale copy. */
      clearPost(): void {
        patchState(store, { post: null, postMissing: false });
      },
    };
  }),
);
