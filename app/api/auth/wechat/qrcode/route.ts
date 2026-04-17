import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/auth/wechat/qrcode
 * 生成微信扫码登录二维码 URL
 * 仅国内版可用（已强制锁定为国内版）
 */
export async function GET(request: NextRequest) {
  // 强制锁定为国内版，移除区域检查
  const appId = process.env.NEXT_PUBLIC_WECHAT_APP_ID
  if (!appId) {
    return NextResponse.json({ ok: false, message: "微信 AppID 未配置" }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/wechat/callback`)
  // state 用于防 CSRF，这里用时间戳简单处理
  const state = `wx_${Date.now()}`

  // 微信 OAuth2 授权 URL（PC 扫码）
  const qrcodeUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`

  return NextResponse.json({ ok: true, data: { qrcodeUrl, state } })
}
