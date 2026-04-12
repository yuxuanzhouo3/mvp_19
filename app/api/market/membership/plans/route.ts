import { NextRequest, NextResponse } from "next/server"
import { isCN } from "@/lib/db-adapter"

// GET /api/market/membership/plans?region=cn
export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get("region") || "cn"
  try {
    if (isCN()) {
      // 国内版：查 CloudBase
      const cb = await import("@cloudbase/node-sdk")
      const app = cb.init({
        env: process.env.CLOUDBASE_ENV_ID!,
        secretId: process.env.CLOUDBASE_SECRET_ID!,
        secretKey: process.env.CLOUDBASE_SECRET_KEY!,
      })
      const db = app.database()
      const r = await db.collection("membership_plans").where({ region }).get()
      const data = Array.isArray(r?.data) ? r.data : []
      // 去重（按 id 去重，防止重复文档）
      const seen = new Set()
      const unique = data.filter((item: any) => {
        const key = item.id || item._id
        if (seen.has(key)) return false
        seen.add(key); return true
      })
      unique.sort((a: any, b: any) => (a.months || 0) - (b.months || 0))
      return NextResponse.json({ ok: true, data: unique })
    }

    // 国际版：查 Supabase
    const { createClient } = await import("@supabase/supabase-js")
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await sb.from("membership_plans")
      .select("*").eq("region", region).order("months", { ascending: true })
    if (error) throw error
    return NextResponse.json({ ok: true, data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
