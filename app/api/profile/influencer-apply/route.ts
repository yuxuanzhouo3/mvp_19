import { NextRequest, NextResponse } from "next/server"
import { applyInfluencerVerification } from "@/lib/auth/service"

export async function POST(request: NextRequest) {
  try {
    // 从 cookie 中获取用户 ID
    const cookieHeader = request.headers.get("cookie") || ""
    const match = cookieHeader.match(/(?:^|;\s*)market_user_id=([^;]+)/)
    const userId = match ? decodeURIComponent(match[1]) : ""

    if (!userId) {
      return NextResponse.json(
        { ok: false, message: "用户未登录" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { platform, platformAccount, platformHomeUrl, followers, cost, commission } = body

    // 验证必填字段
    if (!platform || !platformAccount || !followers) {
      return NextResponse.json(
        { ok: false, message: "平台、账号和粉丝数为必填项" },
        { status: 400 }
      )
    }

    const result = await applyInfluencerVerification(userId, {
      platform,
      platformAccount,
      platformHomeUrl: platformHomeUrl || "",
      followers,
      cost: cost || "",
      commission: commission || ""
    })

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: result.message
    })

  } catch (error: any) {
    console.error("[API /api/profile/influencer-apply] 错误:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "达人认证失败" },
      { status: 500 }
    )
  }
}