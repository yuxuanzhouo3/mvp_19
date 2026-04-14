import { NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth/service"
import { emailCodeStore } from "@/lib/email-code-store"
import { isCN } from "@/lib/db-adapter"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email?.trim()
    const password = body.password ?? ""
    const referralCode = body.referralCode?.trim() || undefined
    const emailCode = body.emailCode?.trim() || ""

    // 国内版：校验邮箱验证码
    if (isCN()) {
      if (!emailCode) {
        return NextResponse.json({ ok: false, message: "请输入邮箱验证码" }, { status: 400 })
      }
      const stored = emailCodeStore.get(email)
      if (!stored || stored.type !== "register") {
        return NextResponse.json({ ok: false, message: "验证码不存在或已过期" }, { status: 400 })
      }
      if (Date.now() > stored.expires) {
        emailCodeStore.delete(email)
        return NextResponse.json({ ok: false, message: "验证码已过期，请重新获取" }, { status: 400 })
      }
      if (stored.code !== emailCode) {
        return NextResponse.json({ ok: false, message: "验证码错误" }, { status: 400 })
      }
      emailCodeStore.delete(email)
    }

    const result = await registerUser(email, password, { referralCode })

    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: result.message })
  } catch (error: any) {
    console.error("[API /api/auth/register] 错误:", error)
    return NextResponse.json({ ok: false, message: error.message || "注册失败" }, { status: 500 })
  }
}