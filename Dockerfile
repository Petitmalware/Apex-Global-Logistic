FROM node:22-alpine AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat openssl

FROM base AS deps

ARG DATABASE_URL="postgresql://apex:apex_password@localhost:5432/apex_global_logistics?schema=public"
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ARG NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=""
ARG AUTH_JWT_SECRET="docker-development-secret-change-before-production"

ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY
ENV AUTH_JWT_SECRET=$AUTH_JWT_SECRET

COPY package.json package-lock.json* ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM base AS builder

ARG DATABASE_URL="postgresql://apex:apex_password@localhost:5432/apex_global_logistics?schema=public"
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ARG NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=""
ARG AUTH_JWT_SECRET="docker-development-secret-change-before-production"

ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY
ENV AUTH_JWT_SECRET=$AUTH_JWT_SECRET

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS migrator

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* prisma.config.ts ./
COPY prisma ./prisma
COPY scripts ./scripts

CMD ["npm", "run", "db:migrate:deploy"]

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
