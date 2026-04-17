# Next.js 应用 Dockerfile for 腾讯云托管（80端口已修复 + 前端变量构建注入）
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 👇 关键：构建时注入 NEXT_PUBLIC_ 变量（腾讯云后台无法覆盖）
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SITE_REGION=cn
ENV NEXT_PUBLIC_WECHAT_APP_ID=wx48a648f967ee565f
ENV NEXT_PUBLIC_APP_URL=https://mornbusiness.mornscience.top

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

# 端口改为 3000（避免权限问题，腾讯云托管会自动映射到外网）
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "-r", "dotenv/config", "server.js", "-p", "80"]
