# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
# 构建参数，用于配置客户端环境变量（Next.js 公共变量）
ARG NEXT_PUBLIC_SITE_REGION=cn
ARG NEXT_PUBLIC_WECHAT_APP_ID
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# 转换为环境变量供构建过程使用
ENV NEXT_PUBLIC_SITE_REGION=${NEXT_PUBLIC_SITE_REGION}
ENV NEXT_PUBLIC_WECHAT_APP_ID=${NEXT_PUBLIC_WECHAT_APP_ID}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
ENV NODE_ENV=production

# 调试：显示构建时的环境变量
RUN echo "构建环境变量:"
RUN echo "NEXT_PUBLIC_SITE_REGION=${NEXT_PUBLIC_SITE_REGION}"
RUN echo "NEXT_PUBLIC_WECHAT_APP_ID=${NEXT_PUBLIC_WECHAT_APP_ID}"
RUN echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}"
RUN echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}"
RUN echo "NODE_ENV=${NODE_ENV}"

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=80

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/components ./components
COPY --from=builder /app/hooks ./hooks
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 80
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "80"]
