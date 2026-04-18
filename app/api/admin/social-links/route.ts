import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { dbAdapter } from "@/lib/db-adapter"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const platform = req.nextUrl.searchParams.get("platform") || ""
    const status = req.nextUrl.searchParams.get("status") || ""
    const search = req.nextUrl.searchParams.get("search") || ""
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100")
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0")

    let data = await dbAdapter.loadRows("social_links", {})

    // 过滤
    if (platform && platform !== "all") {
      data = data.filter((item: any) => item.platform === platform)
    }
    if (status && status !== "all") {
      data = data.filter((item: any) => item.status === status)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      data = data.filter((item: any) => 
        item.url && item.url.toLowerCase().includes(searchLower)
      )
    }

    // 排序
    data.sort((a: any, b: any) => 
      (a.display_order || 0) - (b.display_order || 0)
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

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const body = await req.json()
    const { platform, url, iconUrl, displayOrder = 0, status = "active" } = body

    if (!platform || !url) {
      return NextResponse.json({ ok: false, error: "缺少必要参数: platform和url" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const data = await dbAdapter.insertRow("social_links", {
      platform,
      url,
      icon_url: iconUrl || null,
      display_order: displayOrder,
      status,
      created_by: session.adminId
    })

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const body = await req.json()
    const { id, platform, url, iconUrl, displayOrder, status } = body

    if (!id) {
      return NextResponse.json({ ok: false, error: "缺少必要参数: id" }, { status: 400 })
    }

    const updateData: any = {}
    if (platform !== undefined) updateData.platform = platform
    if (url !== undefined) updateData.url = url
    if (iconUrl !== undefined) updateData.icon_url = iconUrl
    if (displayOrder !== undefined) updateData.display_order = displayOrder
    if (status !== undefined) updateData.status = status

    const data = await dbAdapter.updateRow("social_links", { _id: id }, updateData)

    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ ok: false, error: "缺少必要参数: id" }, { status: 400 })
    }

    const success = await dbAdapter.deleteRow("social_links", { _id: id })

    return NextResponse.json({ ok: true, success })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
