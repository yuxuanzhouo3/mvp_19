import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin/session"
import { isCN } from "@/lib/db-adapter"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ADS_DIR = "advertisements"

async function uploadToCloudBase(buffer: Buffer, fileName: string, cloudPath: string) {
  const cloudbase = await import("@cloudbase/node-sdk")
  const BUCKET = process.env.CLOUDBASE_BUCKET_ID || ""
  const CDN_BASE = `https://${BUCKET}.tcb.qcloud.la`
  const app = cloudbase.init({
    env: process.env.CLOUDBASE_ENV_ID || "",
    secretId: process.env.CLOUDBASE_SECRET_ID || "",
    secretKey: process.env.CLOUDBASE_SECRET_KEY || "",
  })
  await app.uploadFile({ cloudPath, fileContent: buffer })
  return `${CDN_BASE}/${cloudPath}`
}

async function uploadToSupabase(buffer: Buffer, fileName: string, cloudPath: string) {
  const { createClient } = await import("@supabase/supabase-js")
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error } = await sb.storage.from("advertisements").upload(cloudPath, buffer, {
    contentType: "application/octet-stream",
    upsert: false,
  })
  if (error) throw new Error(error.message)
  const { data } = sb.storage.from("advertisements").getPublicUrl(cloudPath)
  return data.publicUrl
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员会话
    const session = await getAdminSession()
    if (!session.valid) {
      return NextResponse.json({ ok: false, error: "管理员未登录" }, { status: 401 })
    }

    console.log('[admin/upload] admin session:', session.session?.username)

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ ok: false, error: "请选择要上传的文件" }, { status: 400 })
    }

    // 检查文件类型
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    const isInstaller = [".apk", ".ipa", ".zip", ".rar", ".tar.gz"].some(ext => file.name.toLowerCase().endsWith(ext))

    if (!isImage && !isVideo && !isInstaller) {
      return NextResponse.json({ ok: false, error: "只支持上传图片、视频或安装包文件" }, { status: 400 })
    }

    // 文件大小限制（50MB）
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ ok: false, error: "文件大小不能超过50MB" }, { status: 400 })
    }

    // 生成文件名和路径
    const ext = file.name.split(".").pop() || (isImage ? "jpg" : "mp4")
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    let cloudPath: string
    
    if (isInstaller) {
      // 安装包文件上传到 Installpackage/apk 目录
      cloudPath = `Installpackage/apk/${fileName}`
    } else {
      // 图片和视频上传到原来的目录
      const subDir = isImage ? "images" : "videos"
      cloudPath = `${ADS_DIR}/${subDir}/${fileName}`
    }

    console.log('[admin/upload] uploading file:', {
      originalName: file.name,
      type: file.type,
      size: file.size,
      cloudPath
    })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let fileUrl: string
    if (isCN()) {
      fileUrl = await uploadToCloudBase(buffer, fileName, cloudPath)
    } else {
      fileUrl = await uploadToSupabase(buffer, fileName, cloudPath)
    }

    console.log(`[admin/upload] 文件上传成功 (${isCN() ? "CloudBase" : "Supabase"}): ${fileUrl}`)

    return NextResponse.json({
      ok: true,
      data: {
        fileUrl,
        cloudPath,
        fileName,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        isImage,
        isVideo
      }
    })

  } catch (error: any) {
    console.error("[admin/upload] 文件上传失败:", error)
    return NextResponse.json({
      ok: false,
      error: error?.message || "文件上传失败，请重试"
    }, { status: 500 })
  }
}