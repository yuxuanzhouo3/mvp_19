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

    let data = await dbAdapter.loadRows("app_releases", {})

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
        (item.version && item.version.toLowerCase().includes(searchLower)) ||
        (item.build_number && item.build_number.toLowerCase().includes(searchLower)) ||
        (item.release_notes && item.release_notes.toLowerCase().includes(searchLower))
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

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const body = await req.json()
    const {
      platform,
      version,
      buildNumber,
      releaseNotes,
      fileUrl,
      fileSize,
      isMandatory = false,
      status = "draft"
    } = body

    if (!platform || !version || !fileUrl) {
      return NextResponse.json({ ok: false, error: "缺少必要参数: platform, version, fileUrl" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const data = await dbAdapter.insertRow("app_releases", {
      platform,
      version,
      build_number: buildNumber || null,
      release_notes: releaseNotes || "",
      file_url: fileUrl,
      file_size: fileSize || null,
      is_mandatory: isMandatory,
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
    const {
      id,
      platform,
      version,
      buildNumber,
      releaseNotes,
      fileUrl,
      fileSize,
      isMandatory,
      status
    } = body

    if (!id) {
      return NextResponse.json({ ok: false, error: "缺少必要参数: id" }, { status: 400 })
    }

    const updateData: any = {}
    if (platform !== undefined) updateData.platform = platform
    if (version !== undefined) updateData.version = version
    if (buildNumber !== undefined) updateData.build_number = buildNumber
    if (releaseNotes !== undefined) updateData.release_notes = releaseNotes
    if (fileUrl !== undefined) updateData.file_url = fileUrl
    if (fileSize !== undefined) updateData.file_size = fileSize
    if (isMandatory !== undefined) updateData.is_mandatory = isMandatory
    if (status !== undefined) updateData.status = status

    const data = await dbAdapter.updateRow("app_releases", { _id: id }, updateData)

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

    const success = await dbAdapter.deleteRow("app_releases", { _id: id })

    return NextResponse.json({ ok: true, success })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
