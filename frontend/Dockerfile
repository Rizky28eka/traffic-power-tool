# Stage 1: Install dependencies
FROM node:18-slim AS deps
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm
WORKDIR /app/frontend
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile


# Stage 2: Build app
FROM node:18-slim AS builder
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*
WORKDIR /app/frontend
COPY --from=deps /app/frontend/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_SKIP_POSTINSTALL_GENERATE=true
RUN pnpm build

# Stage 3: Production runner
FROM node:18-slim
WORKDIR /app/frontend

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
