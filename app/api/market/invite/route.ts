import { NextRequest, NextResponse } from "next/server"
import { getUserInviteData } from "@/lib/market1/fission"
import { isCN } from "@/lib/db-adapter"
import { randomBytes } from "crypto"

function getUserId(req: NextRequest) {
  const cookie = req.headers.get("cookie") || ""
  const m = cookie.match(/(?:^|;\s*)market_user_id=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ""
}

function genCode() {
  return randomBytes(4).toString("hex").toUpperCase()
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })
  try {
    // 国内版：确保用户有 referral_code（CloudBase）
    if (isCN()) {
      try {
        const cb = await import("@cloudbase/node-sdk")
        const app = cb.init({
          env: process.env.CLOUDBASE_ENV_ID!,
          secretId: process.env.CLOUDBASE_SECRET_ID!,
          secretKey: process.env.CLOUDBASE_SECRET_KEY!,
        })
        const db = app.database()
        // 同时尝试 id 和 _id 查询
        let userDoc: any = null
        const byId = await db.collection("users").where({ id: userId }).get()
        userDoc = byId?.data?.[0]
        if (!userDoc) {
          const byDocId = await db.collection("users").where({ _id: userId }).get()
          userDoc = byDocId?.data?.[0]
        }
        if (userDoc && !userDoc.referral_code) {
          const code = genCode()
          const docId = userDoc._id
          await db.collection("users").doc(docId).update({ referral_code: code })
        }
      } catch (e) {
        console.warn("[invite] CN referral_code 生成失败:", e)
      }
    }

    // 国际版：确保用户有 referral_code（Supabase）
    if (!isCN()) {
      try {
        const { createClient } = await import("@supabase/supabase-js")
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { data: user } = await sb.from("users").select("id,referral_code").eq("id", userId).maybeSingle()
        if (user && !user.referral_code) {
          let code = genCode()
          for (let i = 0; i < 5; i++) {
            const { data: exists } = await sb.from("users").select("id").eq("referral_code", code).maybeSingle()
            if (!exists) break
            code = genCode()
          }
          await sb.from("users").update({ referral_code: code }).eq("id", userId)
        }
      } catch (e) {
        console.warn("[invite] INTL referral_code 生成失败:", e)
      }
    }

    const data = await getUserInviteData(userId)
    console.log("[invite API] userId:", userId, "isCN:", isCN(), "data:", JSON.stringify(data))

    // 查询该用户的折扣券（国内外都支持）
    let discountCodes: any[] = []
    if (!isCN()) {
      try {
        const { createClient } = await import("@supabase/supabase-js")
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        const { data: codes } = await sb.from("referral_discount_codes")
          .select("code,discount,max_uses,used_count,expires_at,created_at")
          .eq("inviter_user_id", userId)
          .order("created_at", { ascending: false })
        discountCodes = codes || []
      } catch {}
    } else {
      // 国内版：从 CloudBase 查询折扣券
      try {
        const cb = await import("@cloudbase/node-sdk")
        const app = cb.init({
          env: process.env.CLOUDBASE_ENV_ID!,
          secretId: process.env.CLOUDBASE_SECRET_ID!,
          secretKey: process.env.CLOUDBASE_SECRET_KEY!,
        })
        const db = app.database()
        const r = await db.collection("referral_discount_codes")
          .where({ inviter_user_id: userId })
          .get()
        discountCodes = Array.isArray(r?.data) ? r.data : []
      } catch {}
    }

    return NextResponse.json({ ok: true, data: { ...data, discountCodes } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
