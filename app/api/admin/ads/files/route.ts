import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { dbAdapter } from "@/lib/db-adapter"

export async function GET() {
  const session = await getAdminSession()
  console.log('[ads/files] session valid:', session.valid)
  if (!session.valid) return NextResponse.json({ ok: false }, { status: 401 })

  try {
    const ads = await dbAdapter.loadRows("advertisements", {})
    console.log('[ads/files] advertisements count:', ads.length)

    const files = ads.map((ad: any) => ({
      name: ad.title || '未命名广告',
      url: ad.file_url,
      size: ad.file_size,
      lastModified: ad.created_at,
      source: 'cloudbase' as const
    })).filter((file: any) => file.url)

    console.log('[ads/files] filtered files count:', files.length)
    return NextResponse.json({ ok: true, files })
  } catch (e: any) {
    console.error('[ads/files] error:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
