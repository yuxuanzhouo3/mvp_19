import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { dbAdapter } from "@/lib/db-adapter"

export async function GET() {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  const data = await dbAdapter.loadRows("orders", {})

  return NextResponse.json({ ok: true, data: data || [] })
}
