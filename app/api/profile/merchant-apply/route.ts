import { NextRequest, NextResponse } from "next/server"
import { applyMerchantVerification } from "@/lib/auth/service"

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
    const {
      companyName,
      creditCode,
      businessLicenseUrl,
      brandName,
      contactPerson,
      contactPhone,
      industry
    } = body

    // 验证必填字段
    if (!companyName || !creditCode || !contactPerson || !contactPhone) {
      return NextResponse.json(
        { ok: false, message: "公司名称、信用代码、联系人和联系电话为必填项" },
        { status: 400 }
      )
    }

    const result = await applyMerchantVerification(userId, {
      companyName,
      creditCode,
      businessLicenseUrl: businessLicenseUrl || "",
      brandName: brandName || "",
      contactPerson,
      contactPhone,
      industry: industry || ""
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
    console.error("[API /api/profile/merchant-apply] 错误:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "商家认证失败" },
      { status: 500 }
    )
  }
}