import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { dbAdapter } from "@/lib/db-adapter"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const status = req.nextUrl.searchParams.get("status") || ""
    const search = req.nextUrl.searchParams.get("search") || ""
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100")
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0")

    let data = await dbAdapter.loadRows("user_reports", {})

    // 过滤
    if (status && status !== "all") {
      data = data.filter((item: any) => item.status === status)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      data = data.filter((item: any) => 
        (item.reporter_email && item.reporter_email.toLowerCase().includes(searchLower)) ||
        (item.reported_user_email && item.reported_user_email.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      )
    }

    // 排序
    data.sort((a: any, b: any) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )

    const total = data.length

    // 分页
    data = data.slice(offset, offset + limit)

    return NextResponse.json({
      ok: true,
      data: data || [],
      total,
      limit,
      offset
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const { id, status, resolutionNotes } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "缺少必要参数" }, { status: 400 })
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
      resolved_at: status !== "pending" ? new Date().toISOString() : null,
      resolved_by: session.adminId
    }

    if (resolutionNotes) {
      updateData.resolution_notes = resolutionNotes
    }

    const data = await dbAdapter.updateRow("user_reports", { _id: id }, updateData)

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
