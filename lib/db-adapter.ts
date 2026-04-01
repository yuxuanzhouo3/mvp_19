/**
 * 统一数据库适配器
 * 国内（NEXT_PUBLIC_SITE_REGION=cn）→ 腾讯云 CloudBase
 * 国际（其他）→ Supabase
 *
 * 通过环境变量 NEXT_PUBLIC_SITE_REGION 控制，默认 cn
 */

// ── 判断当前区域 ──────────────────────────────────────
function isCN(): boolean {
  return (process.env.NEXT_PUBLIC_SITE_REGION || "cn").toLowerCase() === "cn"
}

function nowIso() {
  return new Date().toISOString()
}

// ══════════════════════════════════════════════════════
// CloudBase（国内）
// ══════════════════════════════════════════════════════
import * as cloudbase from "@cloudbase/node-sdk"

const CLOUDBASE_CONFIG = {
  envId:     process.env.CLOUDBASE_ENV_ID     || "",
  secretId:  process.env.CLOUDBASE_SECRET_ID  || "",
  secretKey: process.env.CLOUDBASE_SECRET_KEY || "",
}

let _cbDB: any = null
function getCloudBaseDB() {
  if (_cbDB) return _cbDB
  const app = cloudbase.init({
    env:       CLOUDBASE_CONFIG.envId,
    secretId:  CLOUDBASE_CONFIG.secretId,
    secretKey: CLOUDBASE_CONFIG.secretKey,
  })
  _cbDB = app.database()
  return _cbDB
}

// CloudBase CRUD
const cbAdapter = {
  async loadRows(table: string, filters: Record<string, any> = {}): Promise<any[]> {
    const db = getCloudBaseDB()
    try {
      const res = await db.collection(table).where(filters).get()
      return Array.isArray(res.data) ? res.data : []
    } catch (err: any) {
      if (err.message?.includes("not exist") || err.code?.includes("NOT_EXIST")) return []
      throw err
    }
  },

  async insertRow(table: string, row: Record<string, any>): Promise<any> {
    const db = getCloudBaseDB()
    const now = nowIso()
    const finalRow = { ...row, created_at: now, updated_at: now }
    try {
      const result = await db.collection(table).add(finalRow)
      return { ...finalRow, _id: result._id }
    } catch (err: any) {
      const isNotExist = err.message?.includes("not exist") || err.code?.includes("NOT_EXIST")
      const isEnvError = err.message?.includes("env not exists") || err.code === "INVALID_ENV"
      if (isNotExist && !isEnvError) {
        await db.createCollection(table)
        const result = await db.collection(table).add(finalRow)
        return { ...finalRow, _id: result._id }
      }
      throw err
    }
  },

  async updateRow(table: string, filters: Record<string, any>, patch: Record<string, any>): Promise<any | null> {
    const db = getCloudBaseDB()
    const finalPatch = { ...patch, updated_at: nowIso() }
    const res = await db.collection(table).where(filters).get()
    if (res.data?.[0]?._id) {
      await db.collection(table).doc(res.data[0]._id).update(finalPatch)
      return { ...res.data[0], ...finalPatch }
    }
    return null
  },

  async deleteRow(table: string, filters: Record<string, any>): Promise<boolean> {
    const db = getCloudBaseDB()
    const res = await db.collection(table).where(filters).remove()
    return res.deleted > 0
  },
}

// ══════════════════════════════════════════════════════
// Supabase（国际）
// ══════════════════════════════════════════════════════
import { createClient, SupabaseClient } from "@supabase/supabase-js"

let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase 环境变量未配置：NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  _supabase = createClient(url, key)
  return _supabase
}

// Supabase CRUD
const sbAdapter = {
  async loadRows(table: string, filters: Record<string, any> = {}): Promise<any[]> {
    const sb = getSupabase()
    let query = sb.from(table).select("*")
    for (const [k, v] of Object.entries(filters)) {
      if (v === undefined || v === null) continue
      query = query.eq(k, v)
    }
    const { data, error } = await query
    if (error) {
      // 表不存在时返回空数组
      if (error.code === "42P01") return []
      throw new Error(`[Supabase] loadRows ${table}: ${error.message}`)
    }
    return data || []
  },

  async insertRow(table: string, row: Record<string, any>): Promise<any> {
    const sb = getSupabase()
    const now = nowIso()
    const finalRow = { ...row, created_at: now, updated_at: now }
    const { data, error } = await sb.from(table).insert(finalRow).select().single()
    if (error) throw new Error(`[Supabase] insertRow ${table}: ${error.message}`)
    return data
  },

  async updateRow(table: string, filters: Record<string, any>, patch: Record<string, any>): Promise<any | null> {
    const sb = getSupabase()
    const finalPatch = { ...patch, updated_at: nowIso() }
    // 先查找记录
    let query = sb.from(table).select("*")
    for (const [k, v] of Object.entries(filters)) {
      if (v === undefined || v === null) continue
      query = query.eq(k, v)
    }
    const { data: rows } = await query.limit(1)
    if (!rows || rows.length === 0) return null

    const pkVal = rows[0].id || rows[0]._id
    const pkCol = rows[0].id !== undefined ? "id" : "_id"
    const { data, error } = await sb.from(table).update(finalPatch).eq(pkCol, pkVal).select().single()
    if (error) throw new Error(`[Supabase] updateRow ${table}: ${error.message}`)
    return data
  },

  async deleteRow(table: string, filters: Record<string, any>): Promise<boolean> {
    const sb = getSupabase()
    let query = sb.from(table).delete()
    for (const [k, v] of Object.entries(filters)) {
      if (v === undefined || v === null) continue
      query = query.eq(k, v)
    }
    const { error, count } = await query
    if (error) throw new Error(`[Supabase] deleteRow ${table}: ${error.message}`)
    return (count ?? 0) > 0
  },
}

// ══════════════════════════════════════════════════════
// 统一导出：根据区域自动路由
// ══════════════════════════════════════════════════════
export const dbAdapter = {
  async loadRows(table: string, filters: Record<string, any> = {}): Promise<any[]> {
    return isCN()
      ? cbAdapter.loadRows(table, filters)
      : sbAdapter.loadRows(table, filters)
  },

  async insertRow(table: string, row: Record<string, any>): Promise<any> {
    return isCN()
      ? cbAdapter.insertRow(table, row)
      : sbAdapter.insertRow(table, row)
  },

  async updateRow(table: string, filters: Record<string, any>, patch: Record<string, any>): Promise<any | null> {
    return isCN()
      ? cbAdapter.updateRow(table, filters, patch)
      : sbAdapter.updateRow(table, filters, patch)
  },

  async deleteRow(table: string, filters: Record<string, any>): Promise<boolean> {
    return isCN()
      ? cbAdapter.deleteRow(table, filters)
      : sbAdapter.deleteRow(table, filters)
  },

  async loadSingleRow(table: string, filters: Record<string, any> = {}): Promise<any | null> {
    const rows = await this.loadRows(table, filters)
    return rows.length > 0 ? rows[0] : null
  },

  /** 当前使用的数据库类型，方便调试 */
  get region(): "cn" | "intl" {
    return isCN() ? "cn" : "intl"
  },

  /** 上传文件（仅 CloudBase 支持，Supabase 用 Storage 另行实现） */
  async uploadFile(cloudPath: string, fileContent: Buffer): Promise<string> {
    if (!isCN()) {
      throw new Error("国际版文件上传请使用 Supabase Storage")
    }
    const app = cloudbase.init({
      env:       CLOUDBASE_CONFIG.envId,
      secretId:  CLOUDBASE_CONFIG.secretId,
      secretKey: CLOUDBASE_CONFIG.secretKey,
    })
    await app.uploadFile({ cloudPath, fileContent })
    const BUCKET = process.env.CLOUDBASE_BUCKET_ID || ""
    return `https://${BUCKET}.tcb.qcloud.la/${cloudPath}`
  },
}
