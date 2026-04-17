#!/bin/bash
# Docker构建脚本示例，包含必要的构建参数

# 设置默认值
SITE_REGION=${NEXT_PUBLIC_SITE_REGION:-"cn"}
WECHAT_APP_ID=${NEXT_PUBLIC_WECHAT_APP_ID:-""}
GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID:-""}
APP_URL=${NEXT_PUBLIC_APP_URL:-""}
SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-""}
SUPABASE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-""}
STRIPE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-""}

# 检查必要参数
if [ -z "$WECHAT_APP_ID" ] && [ "$SITE_REGION" = "cn" ]; then
  echo "警告: 国内环境(cn)但未设置微信AppID，微信登录将不可用"
fi

if [ -z "$APP_URL" ]; then
  echo "警告: 未设置APP_URL，某些功能可能受影响"
fi

# 构建命令
echo "正在构建Docker镜像，使用以下参数:"
echo "  SITE_REGION: $SITE_REGION"
echo "  WECHAT_APP_ID: ${WECHAT_APP_ID:-(未设置)}"
echo "  APP_URL: ${APP_URL:-(未设置)}"

docker build \
  --build-arg NEXT_PUBLIC_SITE_REGION="$SITE_REGION" \
  --build-arg NEXT_PUBLIC_WECHAT_APP_ID="$WECHAT_APP_ID" \
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  --build-arg NEXT_PUBLIC_APP_URL="$APP_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$SUPABASE_KEY" \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$STRIPE_KEY" \
  -t mornbusiness:latest .

echo "构建完成"
echo "运行容器: docker run -p 3000:80 mornbusiness:latest"