# syntax=docker/dockerfile:1.7
#
# apps/web — Angular with SSR (outputMode: server). The build emits
# dist/apps/web/browser (static assets) and dist/apps/web/server/server.mjs
# (the Express + AngularNodeAppEngine server), which listens on PORT || 4000.
#
# Build from the WORKSPACE ROOT, not from apps/web:
#   docker build -f apps/web/Dockerfile -t kuetelabs/web .

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

# Angular environment files are literals — `process.env` does not exist in a
# browser bundle — so per-deploy values are substituted before the build and
# baked into the output. Leave these empty to build the checked-in
# environment.prod.ts unchanged. See docs/ARCHITECTURE.md §12.
ARG APP_NAME
ARG API_URL
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
RUN node tools/write-environment.mjs apps/web/src/environments/environment.prod.ts

RUN npx nx build web --configuration=production

# --- runtime ----------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime

# Angular's SSRF protection rejects any Host header not in NG_ALLOWED_HOSTS and
# silently falls back to client-side rendering (a future major turns it into a
# 400). Verified: unset, `/` returns a 14KB empty shell; set, 147KB of real
# server-rendered HTML. SET THIS TO YOUR PUBLIC HOSTNAME when deploying — the
# default only covers local access and the healthcheck below. Comma-separated;
# `*` disables the check, `*.example.com` matches subdomains.
ENV NODE_ENV=production \
    PORT=4000 \
    NG_ALLOWED_HOSTS=localhost,127.0.0.1

WORKDIR /app

# The SSR bundle is self-contained — express, @angular/ssr and the rest are
# bundled into server.mjs, so no node_modules is installed here (verified by
# running the output in an empty directory). server.mjs resolves the browser
# assets at ../browser, so keep the browser/ + server/ layout intact.
COPY --from=build --chown=node:node /workspace/dist/apps/web ./

USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/server.mjs"]
