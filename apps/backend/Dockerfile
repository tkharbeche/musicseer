# Multi-stage build for NestJS backend
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
RUN pnpm install

# Copy source code
COPY packages/shared-types ./packages/shared-types
COPY apps/backend ./apps/backend

# Build shared packages first if any
RUN pnpm --filter "@musicseer/shared-types" build

# Development stage
FROM base AS development
WORKDIR /app
EXPOSE 4000
CMD ["pnpm", "--filter", "backend", "dev"]

# Production build stage
FROM base AS builder
WORKDIR /app
RUN pnpm --filter backend build

# Production stage
FROM node:20-slim AS production
RUN npm install -g pnpm
WORKDIR /app

COPY --from=builder /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml* ./
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Install production dependencies only
RUN pnpm install --prod --filter backend

EXPOSE 4000
CMD ["node", "apps/backend/dist/main.js"]
