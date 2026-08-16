import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { removeEntity, setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import type {
  BlogPost,
  BlogPostStatus,
  BlogPostSummary,
  CreateBlogPostDto,
  UpdateBlogPostDto,
} from '@kuetelabs/shared/domain';
import { BlogAdminApi } from './blog-admin.api';

interface BlogAdminState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  total: number;
  status: BlogPostStatus | null;
  search: string;
  /** The post open in the editor. Null while creating a new one. */
  editing: BlogPost | null;
  editingLoading: boolean;
}

const initialState: BlogAdminState = {
  loading: false,
  saving: false,
  error: null,
  total: 0,
  status: null,
  search: '',
  editing: null,
  editingLoading: false,
};

/** Turns whatever the HTTP layer threw into something worth showing an author. */
function messageOf(error: unknown): string {
  const body = (error as { error?: { message?: string | string[] } })?.error;
  const message = body?.message;
  if (Array.isArray(message)) {
    // A zod failure comes back as one string per issue.
    return message.join(', ');
  }
  return message ?? (error as Error)?.message ?? 'Something went wrong.';
}

/**
 * Authoring state for the blog.
 *
 * Every method here goes through the API, never Supabase: `blog_posts` has no
 * client write policy, and the permission that decides whether a post may be
 * published is checked against the JWT on the server.
 */
export const BlogAdminStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withEntities<BlogPostSummary>(),
  withComputed(({ entities }) => ({
    draftCount: computed(() => entities().filter((post) => post.status === 'draft').length),
    publishedCount: computed(() => entities().filter((post) => post.status === 'published').length),
  })),
  withMethods((store, api = inject(BlogAdminApi)) => {
    const load = async (): Promise<void> => {
      patchState(store, { loading: true, error: null });
      try {
        const page = await api.list({
          status: store.status() ?? undefined,
          search: store.search().trim() || undefined,
          limit: 50,
        });
        patchState(store, setAllEntities(page.posts), { total: page.total, loading: false });
      } catch (error) {
        patchState(store, { error: messageOf(error), loading: false });
      }
    };

    return {
      load,

      filterByStatus(status: BlogPostStatus | null): Promise<void> {
        patchState(store, { status });
        return load();
      },

      setSearch(search: string): Promise<void> {
        patchState(store, { search });
        return load();
      },

      /** Opens an existing post in the editor; `null` starts a blank one. */
      async edit(id: string | null): Promise<void> {
        if (!id) {
          patchState(store, { editing: null, editingLoading: false, error: null });
          return;
        }

        patchState(store, { editingLoading: true, error: null });
        try {
          patchState(store, { editing: await api.find(id), editingLoading: false });
        } catch (error) {
          patchState(store, { error: messageOf(error), editingLoading: false });
        }
      },

      /**
       * Returns the saved post so the editor can route to it, or null when the save
       * failed — the caller must not assume success and navigate away regardless.
       */
      async save(id: string | null, dto: CreateBlogPostDto | UpdateBlogPostDto): Promise<BlogPost | null> {
        patchState(store, { saving: true, error: null });
        try {
          const post = id
            ? await api.update(id, dto)
            : await api.create(dto as CreateBlogPostDto);

          patchState(store, { editing: post, saving: false });
          await load();
          return post;
        } catch (error) {
          patchState(store, { error: messageOf(error), saving: false });
          return null;
        }
      },

      async setPublished(id: string, published: boolean): Promise<void> {
        // Optimistic: the badge should flip the instant the button is clicked.
        const previous = store.entities().find((post) => post.id === id)?.status;
        patchState(
          store,
          updateEntity({ id, changes: { status: published ? 'published' : 'draft' } }),
        );

        try {
          const post = published ? await api.publish(id) : await api.unpublish(id);
          patchState(store, updateEntity({ id, changes: { publishedAt: post.publishedAt } }));
        } catch (error) {
          if (previous) {
            patchState(store, updateEntity({ id, changes: { status: previous } }));
          }
          patchState(store, { error: messageOf(error) });
        }
      },

      async remove(id: string): Promise<void> {
        try {
          await api.remove(id);
          patchState(store, removeEntity(id), { total: Math.max(0, store.total() - 1) });
        } catch (error) {
          patchState(store, { error: messageOf(error) });
        }
      },

      dismissError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
