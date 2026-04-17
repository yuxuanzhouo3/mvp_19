# Next.js 应用 Dockerfile for 腾讯云托管（80端口，构建时注入前端变量）
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 👇 关键：构建时注入前端环境变量（NEXT_PUBLIC_* 必须在这里定义）
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SITE_REGION=cn
ENV NEXT_PUBLIC_WECHAT_APP_ID=wx48a648f967ee565f
ENV NEXT_PUBLIC_APP_URL=https://mornbusiness.mornscience.top

# Build Next.js（standalone 模式）
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 80

ENV PORT=80
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
