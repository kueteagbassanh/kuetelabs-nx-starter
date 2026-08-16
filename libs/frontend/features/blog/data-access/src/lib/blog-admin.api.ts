import { InjectionToken, Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type {
  BlogPost,
  BlogPostPage,
  CreateBlogPostDto,
  ListBlogPostsQuery,
  UpdateBlogPostDto,
} from '@kuetelabs/shared/domain';
import { AuthStore } from '@kuetelabs/frontend/data-access/supabase';

/** Base URL of the NestJS API, e.g. `http://localhost:3000/api`. */
export const BLOG_API_URL = new InjectionToken<string>('BLOG_API_URL');

/**
 * Client for the authoring endpoints.
 *
 * Writing a post is service_role work — `blog_posts` has no client write policy —
 * so it goes through the API rather than Supabase. Reading published posts does not,
 * and `BlogStore` talks to Supabase directly for that.
 */
@Injectable({ providedIn: 'root' })
export class BlogAdminApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStore);
  private readonly baseUrl = inject(BLOG_API_URL);

  private async authHeaders(): Promise<Record<string, string>> {
    const token = this.auth.session()?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async list(query: Partial<ListBlogPostsQuery> = {}): Promise<BlogPostPage> {
    const params = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
    ) as Record<string, string | number>;

    return firstValueFrom(
      this.http.get<BlogPostPage>(`${this.baseUrl}/admin/blog`, {
        params,
        headers: await this.authHeaders(),
      }),
    );
  }

  async find(id: string): Promise<BlogPost> {
    return firstValueFrom(
      this.http.get<BlogPost>(`${this.baseUrl}/admin/blog/${id}`, {
        headers: await this.authHeaders(),
      }),
    );
  }

  async create(dto: CreateBlogPostDto): Promise<BlogPost> {
    return firstValueFrom(
      this.http.post<BlogPost>(`${this.baseUrl}/admin/blog`, dto, {
        headers: await this.authHeaders(),
      }),
    );
  }

  async update(id: string, dto: UpdateBlogPostDto): Promise<BlogPost> {
    return firstValueFrom(
      this.http.patch<BlogPost>(`${this.baseUrl}/admin/blog/${id}`, dto, {
        headers: await this.authHeaders(),
      }),
    );
  }

  /**
   * Its own endpoint rather than `update({ status })`: publishing is guarded by
   * blog.publish, which an author with blog.write does not necessarily hold.
   */
  async publish(id: string): Promise<BlogPost> {
    return firstValueFrom(
      this.http.post<BlogPost>(`${this.baseUrl}/admin/blog/${id}/publish`, null, {
        headers: await this.authHeaders(),
      }),
    );
  }

  async unpublish(id: string): Promise<BlogPost> {
    return firstValueFrom(
      this.http.post<BlogPost>(`${this.baseUrl}/admin/blog/${id}/unpublish`, null, {
        headers: await this.authHeaders(),
      }),
    );
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.baseUrl}/admin/blog/${id}`, {
        headers: await this.authHeaders(),
      }),
    );
  }
}
