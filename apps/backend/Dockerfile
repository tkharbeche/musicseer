# Multi-stage build for NestJS backend
FROM node:20-slim AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration and all package.jsons for better caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages ./packages
COPY apps/backend ./apps/backend

# Development stage
FROM base AS development
EXPOSE 4000
CMD ["pnpm", "--filter", "backend", "dev"]

# Production build stage
FROM base AS builder
# If backend ends up depending on shared-types, build it first
RUN pnpm --filter "@musicseer/*" build
RUN pnpm --filter backend build

# Production stage
FROM node:20-slim AS production
RUN npm install -g pnpm
WORKDIR /app

# Copy only necessary files for production
COPY --from=builder /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml* ./
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

EXPOSE 4000
CMD ["node", "apps/backend/dist/main.js"]
