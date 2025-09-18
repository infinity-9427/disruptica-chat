FROM node:22-alpine AS deps

# Configure npm registry and network settings
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

WORKDIR /app

# Install pnpm with retry logic
RUN npm install -g pnpm --maxsockets 1 || \
    (sleep 30 && npm install -g pnpm --maxsockets 1) || \
    (sleep 60 && npm install -g pnpm --maxsockets 1)

COPY package.json pnpm-lock.yaml ./

# Configure pnpm settings
RUN pnpm config set network-timeout 600000 && \
    pnpm config set network-concurrency 1

ARG FROZEN_LOCKFILE=true
RUN if [ "$FROZEN_LOCKFILE" = "true" ]; then \
      pnpm install --frozen-lockfile || \
      (sleep 30 && pnpm install --frozen-lockfile) || \
      (sleep 60 && pnpm install --frozen-lockfile) ; \
    else \
      pnpm install || \
      (sleep 30 && pnpm install) || \
      (sleep 60 && pnpm install) ; \
    fi


FROM node:22-alpine AS builder
WORKDIR /app

# Configure npm and install pnpm
RUN npm config set registry https://registry.npmjs.org/ && \
    npm install -g pnpm --maxsockets 1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:22-alpine AS runner

# Install curl for healthcheck and dumb-init
RUN apk add --no-cache dumb-init curl
WORKDIR /app

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

ENTRYPOINT ["dumb-init","--"]
CMD ["node","server.js"]
