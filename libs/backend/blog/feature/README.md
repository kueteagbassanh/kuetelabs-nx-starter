# backend-blog

Authoring endpoints for the blog, under `/api/admin/blog`.

`blog_posts` has no client write policy, so every mutation runs here with the service_role key.
There is deliberately **no public read endpoint**: the site reads published posts straight from
Supabase under RLS, and adding a hop would buy nothing.

Permissions, checked on the verified JWT in addition to RLS:

| Route                        | Permission     |
| ---------------------------- | -------------- |
| `GET /`, `GET /:id`          | `blog.read`    |
| `POST /`, `PATCH /:id`, `DELETE /:id` | `blog.write`   |
| `POST /:id/publish`, `POST /:id/unpublish` | `blog.publish` |

`status` is an ordinary field on create and update, so the controller also rejects a payload
carrying `status: 'published'` from a caller without `blog.publish` — otherwise the dedicated
publish route would be trivial to route around. There is a test for it.

## Running unit tests

Run `nx test backend-blog` to execute the unit tests via [Jest](https://jestjs.io).
