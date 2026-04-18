import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { dbAdapter } from "@/lib/db-adapter"

export async function GET() {
  const session = await getAdminSession()
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const ads = await dbAdapter.loadRows("advertisements", {})
    
    const files = ads.map((ad: any) => ({
      name: ad.title || '未命名广告',
      url: ad.file_url,
      size: ad.file_size,
      lastModified: ad.created_at,
      source: 'cloudbase' as const
    })).filter((file: any) => file.url)

    return NextResponse.json({ ok: true, files })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
