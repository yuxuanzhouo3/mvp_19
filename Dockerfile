# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
# 构建参数，用于配置客户端环境变量（Next.js 公共变量）
# 注意：这里设置了硬编码默认值，构建时可通过--build-arg覆盖
ARG NEXT_PUBLIC_SITE_REGION=cn
ARG NEXT_PUBLIC_WECHAT_APP_ID=wx48a648f967ee565f
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ARG NEXT_PUBLIC_APP_URL=https://mornbusiness.mornscience.top
ARG NEXT_PUBLIC_SUPABASE_URL=
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# 服务器端环境变量（AI搜索、数据库等）
ARG ALIYUN_DASHSCOPE_API_KEY
ARG OPENROUTER_API_KEY
ARG CLOUDBASE_ENV_ID
ARG CLOUDBASE_SECRET_ID
ARG CLOUDBASE_SECRET_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG TENCENT_SMS_SECRET_ID
ARG TENCENT_SMS_SECRET_KEY
ARG WECHAT_APP_SECRET
ARG JWT_SECRET
ARG ADMIN_SESSION_SECRET
# 转换为环境变量供构建过程使用
ENV NEXT_PUBLIC_SITE_REGION=${NEXT_PUBLIC_SITE_REGION}
ENV NEXT_PUBLIC_WECHAT_APP_ID=${NEXT_PUBLIC_WECHAT_APP_ID}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
ENV NODE_ENV=production

# 服务器端环境变量
ENV ALIYUN_DASHSCOPE_API_KEY=${ALIYUN_DASHSCOPE_API_KEY}
ENV OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
ENV CLOUDBASE_ENV_ID=${CLOUDBASE_ENV_ID}
ENV CLOUDBASE_SECRET_ID=${CLOUDBASE_SECRET_ID}
ENV CLOUDBASE_SECRET_KEY=${CLOUDBASE_SECRET_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV TENCENT_SMS_SECRET_ID=${TENCENT_SMS_SECRET_ID}
ENV TENCENT_SMS_SECRET_KEY=${TENCENT_SMS_SECRET_KEY}
ENV WECHAT_APP_SECRET=${WECHAT_APP_SECRET}
ENV JWT_SECRET=${JWT_SECRET}
ENV ADMIN_SESSION_SECRET=${ADMIN_SESSION_SECRET}

# 调试：显示构建时的环境变量
RUN echo "构建环境变量:"
RUN echo "NEXT_PUBLIC_SITE_REGION=${NEXT_PUBLIC_SITE_REGION}"
RUN echo "NEXT_PUBLIC_WECHAT_APP_ID=${NEXT_PUBLIC_WECHAT_APP_ID}"
RUN echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}"
RUN echo "NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}"
RUN echo "NODE_ENV=${NODE_ENV}"
# 检查关键变量
RUN if [ -z "${NEXT_PUBLIC_WECHAT_APP_ID}" ] && [ "${NEXT_PUBLIC_SITE_REGION}" = "cn" ]; then echo "⚠️  警告: 国内环境但未设置微信AppID，微信登录将不可用"; fi
RUN if [ -z "${NEXT_PUBLIC_APP_URL}" ]; then echo "⚠️  警告: 未设置APP_URL，某些功能可能受影响"; fi
RUN if [ -z "${ALIYUN_DASHSCOPE_API_KEY}" ] && [ -z "${OPENROUTER_API_KEY}" ]; then echo "⚠️  警告: 未设置AI API密钥，AI搜索将返回模拟数据"; fi
RUN if [ "${NEXT_PUBLIC_SITE_REGION}" = "cn" ] && [ -z "${CLOUDBASE_ENV_ID}" ]; then echo "⚠️  警告: 国内环境但未设置CloudBase配置，数据库功能可能受影响"; fi
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
