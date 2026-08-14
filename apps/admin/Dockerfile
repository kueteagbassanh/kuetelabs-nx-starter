# syntax=docker/dockerfile:1.7
#
# apps/admin — Angular SPA, no SSR (the whole app sits behind auth). The build
# emits dist/apps/admin/browser, which nginx serves with a SPA fallback.
#
# Build from the WORKSPACE ROOT, not from apps/admin:
#   docker build -f apps/admin/Dockerfile -t kuetelabs/admin .

ARG NODE_VERSION=24-alpine

# --- deps -------------------------------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /workspace
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci

# --- build ------------------------------------------------------------------
FROM deps AS build
WORKDIR /workspace
COPY . .

# See apps/web/Dockerfile — same build-time substitution. admin's environment
# file has no appName, so APP_NAME is skipped there with a warning.
ARG API_URL
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
RUN node tools/write-environment.mjs apps/admin/src/environments/environment.prod.ts

RUN npx nx build admin --configuration=production

# --- runtime ----------------------------------------------------------------
FROM nginx:alpine AS runtime
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/admin/nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /workspace/dist/apps/admin/browser /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --spider -q http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
