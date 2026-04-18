"use server"

import { dbAdapter } from "@/lib/db-adapter"
import { requireAdminSession } from "@/lib/admin/session"
import type { Advertisement, AdFilters, AdStats, CreateAdData, UpdateAdData } from "@/lib/admin/types"
import { isCN } from "@/lib/db-adapter"

export async function listAds(filters: AdFilters = {}) {
  try {
    await requireAdminSession()
    let ads = await dbAdapter.loadRows("advertisements", {})

    // 过滤
    if (filters.status) {
      ads = ads.filter((ad: any) => ad.status === filters.status)
    }
    if (filters.type) {
      ads = ads.filter((ad: any) => ad.type === filters.type)
    }
    if (filters.position) {
      ads = ads.filter((ad: any) => ad.position === filters.position)
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      ads = ads.filter((ad: any) => 
        ad.title && ad.title.toLowerCase().includes(searchLower)
      )
    }

    // 排序
    ads.sort((a: any, b: any) => {
      if (b.priority !== a.priority) {
        return (b.priority || 0) - (a.priority || 0)
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })

    const total = ads.length
    const offset = filters.offset || 0
    const limit = filters.limit || 10
    const items = ads.slice(offset, offset + limit)

    return {
      success: true,
      data: {
        items,
        total,
        page: filters.offset ? Math.floor(filters.offset / (filters.limit || 10)) + 1 : 1,
        pageSize: filters.limit || 10,
        totalPages: filters.limit ? Math.ceil(total / filters.limit) : 1
      }
    }
  } catch (error: any) {
    console.error("[listAds] Error:", error)
    return { success: false, error: error.message || "获取广告列表失败" }
  }
}

export async function getAdStats() {
  try {
    await requireAdminSession()
    const ads = await dbAdapter.loadRows("advertisements", {})

    const total = ads.length
    const active = ads.filter((ad: any) => ad.status === "active").length
    const inactive = ads.filter((ad: any) => ad.status === "inactive").length
    const byType: Record<string, number> = { image: 0, video: 0 }

    let totalImpressions = 0
    let totalClicks = 0

    ads.forEach((ad: any) => {
      totalImpressions += ad.impression_count || 0
      totalClicks += ad.click_count || 0
      byType[ad.type] = (byType[ad.type] || 0) + 1
    })

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

    return {
      success: true,
      data: {
        total,
        active,
        inactive,
        totalImpressions,
        totalClicks,
        ctr: parseFloat(ctr.toFixed(2)),
        byType
      }
    }
  } catch (error: any) {
    console.error("[getAdStats] Error:", error)
    return { success: false, error: error.message || "获取广告统计失败" }
  }
}

export async function createAd(formData: FormData) {
  try {
    const session = await requireAdminSession()

    const title = formData.get("title") as string
    const type = formData.get("type") as "image" | "video"
    const position = formData.get("position") as string
    const linkUrl = formData.get("linkUrl") as string
    const priority = parseInt(formData.get("priority") as string || "0")
    const status = formData.get("status") as "active" | "inactive"
    const file = formData.get("file") as File

    if (!title || !type || !position || !file) {
      return { success: false, error: "缺少必要参数" }
    }

    // 实现文件上传逻辑
    const ext = file.name.split(".").pop() || "jpg"
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const cloudPath = `advertisements/${file.type.startsWith('image') ? 'images' : 'videos'}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let fileUrl: string
    if (isCN()) {
      const cloudbase = await import("@cloudbase/node-sdk")
      const BUCKET = process.env.CLOUDBASE_BUCKET_ID || ""
      const CDN_BASE = `https://${BUCKET}.tcb.qcloud.la`
      const app = cloudbase.init({
        env: process.env.CLOUDBASE_ENV_ID || "",
        secretId: process.env.CLOUDBASE_SECRET_ID || "",
        secretKey: process.env.CLOUDBASE_SECRET_KEY || "",
      })
      await app.uploadFile({ cloudPath, fileContent: buffer })
      fileUrl = `${CDN_BASE}/${cloudPath}`
    } else {
      const { createClient } = await import("@supabase/supabase-js")
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )
      const { error } = await sb.storage.from("advertisements").upload(cloudPath, buffer, {
        contentType: file.type,
        upsert: false,
      })
      if (error) throw new Error(error.message)
      const { data } = sb.storage.from("advertisements").getPublicUrl(cloudPath)
      fileUrl = data.publicUrl
    }
    const fileSize = file.size

    const now = new Date().toISOString()
    const data = await dbAdapter.insertRow("advertisements", {
      title,
      type,
      position,
      file_url: fileUrl,
      link_url: linkUrl || null,
      priority,
      status,
      file_size: fileSize,
      impression_count: 0,
      click_count: 0,
      created_by: session.adminId
    })

    return { success: true, data }
  } catch (error: any) {
    console.error("[createAd] Error:", error)
    return { success: false, error: error.message || "创建广告失败" }
  }
}

export async function updateAd(id: string, updateData: UpdateAdData) {
  try {
    await requireAdminSession()

    const data = await dbAdapter.updateRow("advertisements", { _id: id }, updateData)

    return { success: true, data }
  } catch (error: any) {
    console.error("[updateAd] Error:", error)
    return { success: false, error: error.message || "更新广告失败" }
  }
}

export async function deleteAd(id: string) {
  try {
    await requireAdminSession()

    const success = await dbAdapter.deleteRow("advertisements", { _id: id })

    return { success: true, success }
  } catch (error: any) {
    console.error("[deleteAd] Error:", error)
    return { success: false, error: error.message || "删除广告失败" }
  }
}

export async function toggleAdStatus(id: string) {
  try {
    await requireAdminSession()

    // 先获取当前状态
    const ads = await dbAdapter.loadRows("advertisements", { _id: id })
    const ad = ads[0]
    
    if (!ad) {
      return { success: false, error: "广告不存在" }
    }

    const newStatus = ad.status === "active" ? "inactive" : "active"

    const data = await dbAdapter.updateRow("advertisements", { _id: id }, { status: newStatus })

    return { success: true, data }
  } catch (error: any) {
    console.error("[toggleAdStatus] Error:", error)
    return { success: false, error: error.message || "切换广告状态失败" }
  }
}
