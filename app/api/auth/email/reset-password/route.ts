import { NextRequest, NextResponse } from "next/server"
import { emailCodeStore } from "@/lib/email-code-store"
import { isCN } from "@/lib/db-adapter"

// POST /api/auth/email/reset-password  { email, code, newPassword }
export async function POST(req: NextRequest) {
  const { email, code, newPassword } = await req.json()
  if (!email || !code || !newPassword) {
    return NextResponse.json({ ok: false, message: "参数缺失" }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ ok: false, message: "密码长度至少6位" }, { status: 400 })
  }

  const stored = emailCodeStore.get(email)
  if (!stored || stored.type !== "reset") {
    return NextResponse.json({ ok: false, message: "验证码不存在或已过期" }, { status: 400 })
  }
  if (Date.now() > stored.expires) {
    emailCodeStore.delete(email)
    return NextResponse.json({ ok: false, message: "验证码已过期，请重新获取" }, { status: 400 })
  }
  if (stored.code !== String(code)) {
    return NextResponse.json({ ok: false, message: "验证码错误" }, { status: 400 })
  }
  emailCodeStore.delete(email)

  try {
    if (isCN()) {
      const cb = await import("@cloudbase/node-sdk")
      const app = cb.init({ env: process.env.CLOUDBASE_ENV_ID!, secretId: process.env.CLOUDBASE_SECRET_ID!, secretKey: process.env.CLOUDBASE_SECRET_KEY! })
      const db = app.database()
      const r = await db.collection("users").where({ email }).get()
      const user = r?.data?.[0]
      if (!user) return NextResponse.json({ ok: false, message: "该邮箱未注册" }, { status: 404 })
      await db.collection("users").doc(user._id).update({ password: newPassword, updated_at: new Date().toISOString() })
    } else {
      const { createClient } = await import("@supabase/supabase-js")
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      const { data: user } = await sb.from("users").select("id").eq("email", email).maybeSingle()
      if (!user) return NextResponse.json({ ok: false, message: "该邮箱未注册" }, { status: 404 })
      await sb.from("users").update({ password: newPassword, updated_at: new Date().toISOString() }).eq("email", email)
    }
    return NextResponse.json({ ok: true, message: "密码重置成功，请重新登录" })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
