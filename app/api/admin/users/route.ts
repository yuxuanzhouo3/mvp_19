import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { dbAdapter } from "@/lib/db-adapter"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  const search = req.nextUrl.searchParams.get("search") || ""
  
  let users = await dbAdapter.loadRows("users", {})
  
  // 搜索过滤
  if (search) {
    users = users.filter((u: any) => 
      u.email && u.email.toLowerCase().includes(search.toLowerCase())
    )
  }

  // 获取 profiles
  const ids = users.map((u: any) => u.id || u._id)
  const profiles = await dbAdapter.loadRows("user_market_profiles", {})
  const profileMap = Object.fromEntries(
    profiles.map((p: any) => [p.userId || p.user_id, p])
  )

  const usersWithProfiles = users.map((u: any) => ({
    ...u,
    id: u.id || u._id,
    nickname: profileMap[u.id || u._id]?.nickname,
    balance: profileMap[u.id || u._id]?.balance ?? 0,
  }))

  return NextResponse.json({ ok: true, data: usersWithProfiles })
}
