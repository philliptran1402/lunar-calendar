# syntax=docker/dockerfile:1
#
# Multi-stage build for the âm lịch monorepo.
#   docker compose up                     → dev server with hot reload (:5173)
#   docker compose --profile prod up      → static production build on nginx (:8080)
#
# Layer order matters: manifests are copied before sources so that `pnpm install`
# is only re-run when a dependency actually changes, not on every code edit.

# ---------------------------------------------------------------- base
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
# corepack ships with Node and pins the exact pnpm version from package.json
RUN corepack enable
WORKDIR /app

# ---------------------------------------------------------------- deps
# Only the files that describe dependencies — maximises Docker cache hits.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/sdk/package.json  packages/sdk/
COPY apps/web/package.json      apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---------------------------------------------------------------- dev
# Sources are bind-mounted by compose, so nothing is COPYed here.
FROM deps AS dev
ENV NODE_ENV=development
EXPOSE 5173
# --host 0.0.0.0 is required: without it Vite only listens on the container's
# loopback and the port mapping appears dead from the host.
CMD ["sh", "-c", "pnpm --filter @lunar-calendar/sdk build && pnpm --filter @lunar-calendar/web dev --host 0.0.0.0"]

# ---------------------------------------------------------------- build
FROM deps AS build
COPY . .
RUN pnpm --filter @lunar-calendar/sdk build \
 && pnpm --filter @lunar-calendar/web build

# ---------------------------------------------------------------- test
# `docker compose run --rm test` runs the full suite in a clean environment.
FROM build AS test
CMD ["pnpm", "--filter", "@lunar-calendar/sdk", "test"]

# ---------------------------------------------------------------- runtime
FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost/ >/dev/null || exit 1
