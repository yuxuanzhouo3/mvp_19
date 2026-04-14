import { NextRequest, NextResponse } from "next/server"
import { emailCodeStore } from "@/lib/email-code-store"
import { sendEmail } from "@/lib/market/send-email"

// POST /api/auth/email/send-code  { email, type: "register" | "reset" }
export async function POST(req: NextRequest) {
  const { email, type = "register" } = await req.json()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, message: "请输入正确的邮箱地址" }, { status: 400 })
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expires = Date.now() + 10 * 60 * 1000 // 10分钟有效
  emailCodeStore.set(email, { code, expires, type })

  const subject = type === "reset" ? "mornbusiness 密码重置验证码" : "mornbusiness 注册验证码"
  const body = type === "reset"
    ? `您正在重置密码，验证码为：${code}\n\n验证码10分钟内有效，请勿泄露给他人。\n\n如非本人操作，请忽略此邮件。`
    : `欢迎注册 mornbusiness！\n\n您的注册验证码为：${code}\n\n验证码10分钟内有效，请勿泄露给他人。`

  const result = await sendEmail({ to: email, subject, body })
  if (!result.success) {
    console.error("[email-code] 发送失败:", result.message)
    return NextResponse.json({ ok: false, message: "邮件发送失败，请稍后重试" }, { status: 500 })
  }

  console.log(`[email-code] 已发送 ${type} 验证码到 ${email}`)
  return NextResponse.json({ ok: true, message: "验证码已发送，请查收邮件" })
}
