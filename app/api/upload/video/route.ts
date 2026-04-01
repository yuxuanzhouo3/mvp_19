import { NextRequest, NextResponse } from "next/server"
import * as cloudbase from "@cloudbase/node-sdk"
import { getUserIdFromRequest } from "@/lib/api-utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CLOUDBASE_CONFIG = {
  envId:     process.env.CLOUDBASE_ENV_ID     || "",
  secretId:  process.env.CLOUDBASE_SECRET_ID  || "",
  secretKey: process.env.CLOUDBASE_SECRET_KEY || "",
}

const BUCKET = process.env.CLOUDBASE_BUCKET_ID || ""
const VIDEO_DIR = "advertisements/videos"
const CDN_BASE = `https://${BUCKET}.tcb.qcloud.la`

function ok(message: string, data?: any) {
  return NextResponse.json({ ok: true, message, data })
}
function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    // 校验登录
    const userId = getUserIdFromRequest(request)
    if (!userId) return fail("用户未登录", 401)

    // 解析 multipart/form-data
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return fail("请选择要上传的视频文件")

    // 只允许 mp4
    const allowedTypes = ["video/mp4", "video/quicktime", "video/x-m4v"]
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith(".mp4")) {
      return fail("只支持上传 MP4 格式视频")
    }

    // 文件大小限制 200MB
    const MAX_SIZE = 200 * 1024 * 1024
    if (file.size > MAX_SIZE) return fail("视频文件不能超过 200MB")

    // 生成唯一文件名
    const ext = file.name.split(".").pop() || "mp4"
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const cloudPath = `${VIDEO_DIR}/${fileName}`

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 初始化 CloudBase
    const app = cloudbase.init({
      env: CLOUDBASE_CONFIG.envId,
      secretId: CLOUDBASE_CONFIG.secretId,
      secretKey: CLOUDBASE_CONFIG.secretKey,
    })

    // 上传到云存储
    await app.uploadFile({
      cloudPath,
      fileContent: buffer,
    })

    // 拼接可直接播放的 URL
    const videoUrl = `${CDN_BASE}/${cloudPath}`

    console.log(`[Upload] 视频上传成功: ${cloudPath}, URL: ${videoUrl}`)

    return ok("视频上传成功", { videoUrl, cloudPath, fileName })
  } catch (error: any) {
    console.error("[Upload] 视频上传失败:", error)
    return fail(error?.message || "视频上传失败，请重试", 500)
  }
}
