import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { dbAdapter } from "@/lib/db-adapter"

export async function GET() {
  const session = await getAdminSession()
  console.log('[stats] session valid:', session.valid)
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    console.log('[stats] fetching data...')

    const [users, userProfiles, orders] = await Promise.all([
      dbAdapter.loadRows("users", {}),
      dbAdapter.loadRows("user_market_profiles", {}),
      dbAdapter.loadRows("orders", {}),
    ])
    console.log('[stats] users:', users?.length, 'profiles:', userProfiles?.length, 'orders:', orders?.length)

    const totalUsers = users?.length || 0
    const newUsersToday = users?.filter((u: any) => u.created_at && u.created_at >= todayStart).length || 0
    const paidUsers = userProfiles?.filter((p: any) => p.balance > 0).length || 0
    const paidOrders = orders?.filter((o: any) => o.status === "paid") || []
    const totalOrders = paidOrders.length
    const monthPaidOrders = paidOrders.filter((o: any) => o.created_at && o.created_at >= monthStart)
    const monthOrdersCount = monthPaidOrders.length

    const totalRevenue = paidOrders.reduce((s: number, r: any) => s + (r.amount || 0), 0).toFixed(2)
    const monthRevenue = monthPaidOrders.reduce((s: number, r: any) => s + (r.amount || 0), 0).toFixed(2)

    const conversionRate = totalUsers ? ((paidUsers / totalUsers) * 100).toFixed(1) : "0"
    console.log('[stats] result:', { totalUsers, newUsersToday, paidUsers, totalOrders, monthOrdersCount, totalRevenue, monthRevenue, conversionRate })

    return NextResponse.json({
      ok: true,
      data: { totalUsers, newUsersToday, paidUsers, totalOrders, monthOrders: monthOrdersCount, totalRevenue, monthRevenue, conversionRate }
    })
  } catch (e: any) {
    console.error('[stats] error:', e)
    const errorResponse: any = { ok: false, error: e.message }
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = e.stack
      errorResponse.env = {
        CLOUDBASE_ENV_ID: process.env.CLOUDBASE_ENV_ID ? '***' + process.env.CLOUDBASE_ENV_ID.slice(-4) : 'not set',
        region: dbAdapter.region,
        nodeEnv: process.env.NODE_ENV
      }
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
