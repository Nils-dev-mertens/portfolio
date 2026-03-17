# Stage 1: Builder
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lockb* ./
COPY apps/ ./apps/
COPY packages/ ./packages/

RUN bun install --frozen-lockfile

# Seed the database
RUN bun packages/data/src/seed.ts

# Build the Astro app
RUN bun run build

# Stage 2: Runner
FROM oven/bun:1-slim AS runner

WORKDIR /app

COPY --from=builder /app/apps/web/dist ./dist
COPY --from=builder /app/portfolio.db ./portfolio.db
COPY --from=builder /app/packages/data ./packages/data
COPY --from=builder /app/node_modules ./node_modules

ENV DB_PATH=/data/portfolio.db

EXPOSE 4321

CMD ["bun", "./dist/server/entry.mjs"]
