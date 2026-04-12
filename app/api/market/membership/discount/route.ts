import { NextRequest, NextResponse } from "next/server"
import { isCN } from "@/lib/db-adapter"

// POST /api/market/membership/discount  { code }
export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code?.trim()) return NextResponse.json({ ok: false, message: "请输入折扣码" }, { status: 400 })
  const upperCode = code.trim().toUpperCase()

  try {
    if (isCN()) {
      // 国内版：查 CloudBase discount_codes 集合
      const cb = await import("@cloudbase/node-sdk")
      const app = cb.init({
        env: process.env.CLOUDBASE_ENV_ID!,
        secretId: process.env.CLOUDBASE_SECRET_ID!,
        secretKey: process.env.CLOUDBASE_SECRET_KEY!,
      })
      const db = app.database()
      const r = await db.collection("discount_codes").where({ code: upperCode }).get()
      const data = r?.data?.[0]
      if (!data) return NextResponse.json({ ok: false, message: "折扣码无效" }, { status: 404 })
      if (data.expires_at && new Date(data.expires_at) < new Date())
        return NextResponse.json({ ok: false, message: "折扣码已过期" }, { status: 400 })
      if ((data.used_count || 0) >= (data.max_uses || 1))
        return NextResponse.json({ ok: false, message: "折扣码已达使用上限" }, { status: 400 })
      return NextResponse.json({ ok: true, discount: data.discount, code: data.code })
    }

    // 国际版：查 Supabase
    const { createClient } = await import("@supabase/supabase-js")
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await sb.from("discount_codes")
      .select("*").eq("code", upperCode).single()
    if (error || !data) return NextResponse.json({ ok: false, message: "折扣码无效" }, { status: 404 })
    if (data.expires_at && new Date(data.expires_at) < new Date())
      return NextResponse.json({ ok: false, message: "折扣码已过期" }, { status: 400 })
    if (data.used_count >= data.max_uses)
      return NextResponse.json({ ok: false, message: "折扣码已达使用上限" }, { status: 400 })
    return NextResponse.json({ ok: true, discount: data.discount, code: data.code })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
