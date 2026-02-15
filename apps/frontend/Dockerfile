# Multi-stage build for Next.js frontend
FROM node:20-slim AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./

# Copy all package metadata to satisfy workspace dependencies
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared-types ./packages/shared-types
COPY apps/frontend ./apps/frontend

# Build shared packages first
RUN pnpm --filter "@musicseer/shared-types" build

# Development stage
FROM base AS development
WORKDIR /app
EXPOSE 3000
# Dependencies already installed in base stage
CMD ["pnpm", "--filter", "frontend", "dev"]

# Production build stage
FROM base AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm --filter frontend build

# Production stage
FROM node:20-slim AS production
RUN npm install -g pnpm
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml* ./
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/frontend/package.json ./apps/frontend/
COPY --from=builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder /app/apps/frontend/next.config.js ./apps/frontend/

RUN pnpm install --prod --frozen-lockfile --filter frontend

EXPOSE 3000
CMD ["pnpm", "--filter", "frontend", "start"]
