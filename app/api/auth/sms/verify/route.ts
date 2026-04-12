import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { codeStore } from "@/lib/sms-store"
import { isCN } from "@/lib/db-adapter"

// POST /api/auth/sms/verify  { phone, code }
export async function POST(req: NextRequest) {
  const { phone, code } = await req.json()
  if (!phone || !code) return NextResponse.json({ ok: false, message: "参数缺失" }, { status: 400 })

  const stored = codeStore.get(phone)
  if (!stored) return NextResponse.json({ ok: false, message: "验证码不存在或已过期" }, { status: 400 })
  if (Date.now() > stored.expires) {
    codeStore.delete(phone)
    return NextResponse.json({ ok: false, message: "验证码已过期，请重新获取" }, { status: 400 })
  }
  if (stored.code !== String(code)) {
    return NextResponse.json({ ok: false, message: "验证码错误" }, { status: 400 })
  }
  codeStore.delete(phone)

  try {
    const now = new Date().toISOString()
    const phoneEmail = `phone_${phone}@sms.local`
    let userId: string
    let isNew = false

    if (isCN()) {
      // 国内版：CloudBase
      const cb = await import("@cloudbase/node-sdk")
      const app = cb.init({ env: process.env.CLOUDBASE_ENV_ID!, secretId: process.env.CLOUDBASE_SECRET_ID!, secretKey: process.env.CLOUDBASE_SECRET_KEY! })
      const db = app.database()

      const existR = await db.collection("users").where({ email: phoneEmail }).get()
      const existing = existR?.data?.[0]
      if (existing) {
        userId = existing.id || existing._id
      } else {
        isNew = true
        userId = `u-${randomUUID().slice(0, 8)}`
        await db.collection("users").add({ id: userId, email: phoneEmail, password: `sms_${phone}`, role: "user", provider: "sms", created_at: now, updated_at: now })
        await db.collection("user_profiles").add({ id: userId, user_id: userId, nickname: `用户${phone.slice(-4)}`, avatar: "", phone, created_at: now })
        await db.collection("user_market_profiles").add({ id: userId, user_id: userId, nickname: `用户${phone.slice(-4)}`, avatar: "", is_influencer_verified: false, is_merchant_verified: false, balance: 0, total_earnings: 0, ad_views_count: 0, created_at: now, updated_at: now })
        await db.collection("ai_search_quota").add({ id: `quota-${randomUUID().slice(0,8)}`, user_id: userId, balance: 0.1, total_used: 0, call_count: 0, created_at: now, updated_at: now })
      }
    } else {
      // 国际版：Supabase
      const { createClient } = await import("@supabase/supabase-js")
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      const { data: existingByEmail } = await sb.from("users").select("id").eq("email", phoneEmail).maybeSingle()
      if (existingByEmail?.id) {
        userId = existingByEmail.id
      } else {
        isNew = true
        const { data: newUser, error } = await sb.from("users").insert({ id: `u-${randomUUID().slice(0, 8)}`, email: phoneEmail, password: `sms_${phone}`, role: "user", provider: "sms", created_at: now, updated_at: now }).select("id").single()
        if (error) throw error
        userId = newUser.id
        await sb.from("user_profiles").insert({ id: userId, user_id: userId, nickname: `用户${phone.slice(-4)}`, avatar: "", phone, created_at: now })
        await sb.from("user_market_profiles").insert({ id: userId, user_id: userId, nickname: `用户${phone.slice(-4)}`, avatar: "", is_influencer_verified: false, is_merchant_verified: false, is_real_name_verified: false, is_real_influencer: false, is_real_merchant: false, balance: 0, total_earnings: 0, ad_views_count: 0, created_at: now, updated_at: now })
        await sb.from("ai_search_quota").upsert({ id: `quota-${randomUUID().slice(0, 8)}`, user_id: userId, balance: 0.1, total_used: 0, call_count: 0, created_at: now, updated_at: now }, { onConflict: "user_id" })
      }
    }

    const response = NextResponse.json({ ok: true, message: isNew ? "注册并登录成功" : "登录成功", user: { userId, phone } })
    response.cookies.set("market_user_id", userId, { path: "/", maxAge: 60 * 60 * 24 * 7, httpOnly: true, sameSite: "lax" })
    return response
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
