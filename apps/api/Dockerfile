# syntax=docker/dockerfile:1.7
#
# apps/api — NestJS, webpack bundle, served on :3000 under /api.
#
# Build from the WORKSPACE ROOT, not from apps/api:
#   docker build -f apps/api/Dockerfile -t kuetelabs/api .

ARG NODE_VERSION=24-alpine

# --- deps -------------------------------------------------------------------
# Split from the build stage so a source-only change does not reinstall npm.
# The three Dockerfiles share this stage byte-for-byte, so Docker reuses one
# cached layer across all of them.
FROM node:${NODE_VERSION} AS deps
WORKDIR /workspace
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci

# --- build ------------------------------------------------------------------
FROM deps AS build
WORKDIR /workspace
COPY . .
# webpack's `generatePackageJson: true` emits dist/apps/api/package.json with
# exact versions for the 8 packages the bundle leaves external, plus a fully
# pruned package-lock.json. That pair is what the runtime stage installs, so the
# image never sees the workspace's dependency tree.
#
# NOT `nx run api:prune`: the prune-lockfile / copy-workspace-modules targets in
# project.json require an apps/api/package.json, which this repo does not have,
# and they fail with "apps/api/package.json does not exist". They are redundant
# here anyway — generatePackageJson already produces both files.
RUN npx nx build api

# --- runtime ----------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

COPY --from=build --chown=node:node /workspace/dist/apps/api ./
# Carry .npmrc over so this install honours legacy-peer-deps too, exactly as the
# workspace install does.
COPY --from=build --chown=node:node /workspace/.npmrc ./
# `npm install`, not `npm ci`: the lockfile webpack generates drifts slightly
# from the package.json it generates alongside it (npm reports e.g.
# "Missing: content-type@1.0.5 from lock file"), and `npm ci` refuses to install
# when the two disagree. Direct dependencies are pinned to exact versions in that
# package.json, so only transitives can move.
RUN --mount=type=cache,target=/root/.npm \
    npm install --omit=dev --no-audit --no-fund && npm cache clean --force

USER node
EXPOSE 3000
# Nest binds 0.0.0.0 by default, so the port is reachable from outside the container.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "main.js"]
