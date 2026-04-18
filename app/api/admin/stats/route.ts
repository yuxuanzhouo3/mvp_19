import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { dbAdapter } from "@/lib/db-adapter"

export async function GET() {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const [users, userProfiles, orders] = await Promise.all([
      dbAdapter.loadRows("users", {}),
      dbAdapter.loadRows("user_market_profiles", {}),
      dbAdapter.loadRows("orders", {}),
    ])

    const totalUsers = users?.length || 0
    const newUsersToday = users?.filter((u: any) => u.created_at && u.created_at >= todayStart).length || 0
    const paidUsers = userProfiles?.filter((p: any) => p.balance > 0).length || 0
    const paidOrders = orders?.filter((o: any) => o.status === "paid") || []
    const totalOrders = paidOrders.length
    const monthOrders = paidOrders.filter((o: any) => o.created_at && o.created_at >= monthStart).length

    const totalRevenue = paidOrders.reduce((s: number, r: any) => s + (r.amount || 0), 0).toFixed(2)
    const monthRevenue = monthOrders.reduce((s: number, r: any) => s + (r.amount || 0), 0).toFixed(2)

    const conversionRate = totalUsers ? ((paidUsers / totalUsers) * 100).toFixed(1) : "0"

    return NextResponse.json({
      ok: true,
      data: { totalUsers, newUsersToday, paidUsers, totalOrders, monthOrders, totalRevenue, monthRevenue, conversionRate }
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
