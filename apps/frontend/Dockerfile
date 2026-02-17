# Multi-stage build for Next.js frontend
FROM node:20-slim AS base

# Enable corepack and prepare pnpm
ENV COREPACK_DEFAULT_TO_LATEST=0
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy workspace configuration and all package.jsons for better caching
# IMPORTANT: In a pnpm monorepo, pnpm install needs to see all package.json files
# referenced in the lockfile to maintain consistency with --frozen-lockfile.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages ./packages
COPY apps/frontend ./apps/frontend

# Development stage
FROM base AS development
EXPOSE 3000
CMD ["pnpm", "--filter", "frontend", "dev"]

# Production build stage
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED 1
# Ensure a clean state for the build
RUN rm -rf apps/frontend/.next apps/frontend/dist packages/shared-types/dist
# Build shared packages first
RUN pnpm --filter "shared-types" build
RUN pnpm --filter frontend build

# Production stage
FROM node:20-slim AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only necessary files for production
COPY --from=builder /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml* ./
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
# Ensure dist exists before copying (it might be missing if no files were emitted)
COPY --from=builder /app/packages/shared-types/dist* ./packages/shared-types/dist/
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/next.config.js ./apps/frontend/
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000
CMD ["pnpm", "--filter", "frontend", "start"]
