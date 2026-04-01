import { createClient } from "@supabase/supabase-js"
import * as cloudbase from "@cloudbase/node-sdk"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import * as path from "node:path"

// ==========================================
// Types
// ==========================================
type RawRow = Record<string, any>
export type DeploymentRegion = "CN" | "INTL"

// ==========================================
// Config & Helpers
// ==========================================
// 强制所有接口使用国内 CloudBase 数据库
const REGION: DeploymentRegion = "CN"
const DATA_DIR = path.join(process.cwd(), "data", "acquisition")

function nowIso() {
  return new Date().toISOString()
}

// ==========================================
// Supabase (INTL)
// ==========================================
let supabaseInstance: any = null
function getSupabase() {
  if (supabaseInstance) return supabaseInstance
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  if (!url || !key) return null
  supabaseInstance = createClient(url, key)
  return supabaseInstance
}

// ==========================================
// CloudBase (CN)
// ==========================================
let cloudbaseInstance: any = null
function getCloudBase() {
  if (cloudbaseInstance) return cloudbaseInstance
  
  // ============================================================
  // ⚠️ 强制锁定：必须且只能连接到指定的腾讯云数据库环境
  // ============================================================
  const envId     = process.env.CLOUDBASE_ENV_ID     || ""
  const secretId  = process.env.CLOUDBASE_SECRET_ID  || ""
  const secretKey = process.env.CLOUDBASE_SECRET_KEY || ""
  
  try {
    console.log(`[Database] 强制连接腾讯云环境: ${envId}`)
    const app = cloudbase.init({
      env: envId,
      secretId,
      secretKey,
    })
    cloudbaseInstance = app.database()
    return cloudbaseInstance
  } catch (error) {
    console.error("[Database] CloudBase 强制连接失败:", error)
    return null
  }
}

// ==========================================
// Local File (Fallback)
// ==========================================
async function ensureLocalDir() {
  await mkdir(DATA_DIR, { recursive: true })
}

async function readLocalRows(table: string): Promise<RawRow[]> {
  await ensureLocalDir()
  const filePath = path.join(DATA_DIR, `${table}.json`)
  try {
    const raw = await readFile(filePath, "utf8")
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function writeLocalRows(table: string, rows: RawRow[]) {
  await ensureLocalDir()
  const filePath = path.join(DATA_DIR, `${table}.json`)
  await writeFile(filePath, JSON.stringify(rows, null, 2), "utf8")
}

// ==========================================
// Unified Adapter
// ==========================================
export const dbAdapter = {
  async loadRows(table: string, filters: RawRow = {}): Promise<RawRow[]> {
    // 1. Try Supabase if in INTL region
    if (REGION === ("INTL" as any)) {
      const supabase = getSupabase()
      if (supabase) {
        let query = supabase.from(table).select("*").order("created_at", { ascending: false })
        for (const [k, v] of Object.entries(filters)) query = query.eq(k, v)
        const { data, error } = await query
        if (!error && data) return data
      }
    }

    // 2. Try CloudBase if in CN region
    if (REGION === "CN") {
      const db = getCloudBase()
      if (db) {
        try {
          const res = await db.collection(table).where(filters).get()
          if (Array.isArray(res.data)) return res.data
        } catch (err) {
          // If collection doesn't exist, it will be handled by insert
        }
      }
    }

    // 3. Fallback to Local File
    const rows = await readLocalRows(table)
    return rows.filter(r => Object.entries(filters).every(([k, v]) => r[k] === v))
  },

  async insertRow(table: string, row: RawRow): Promise<RawRow> {
    const now = nowIso()
    const finalRow = { ...row, created_at: now, updated_at: now }

    if (REGION === ("INTL" as any)) {
      const supabase = getSupabase()
      if (supabase) {
        const { data, error } = await supabase.from(table).insert(finalRow).select("*").maybeSingle()
        if (!error && data) return data
      }
    }

    if (REGION === "CN") {
      const db = getCloudBase()
      if (db) {
        try {
          await db.collection(table).add(finalRow)
          return finalRow
        } catch (err: any) {
          // 仅当是集合不存在错误时才尝试创建集合
          const isNotExist = err.message?.includes("not exist") || err.code?.includes("NOT_EXIST")
          // 排除掉环境不存在的情况 (100003 是 CloudBase 环境不存在的错误码)
          const isEnvError = err.message?.includes("env not exists") || err.code === "INVALID_ENV" || err.message?.includes("100003")
          
          if (isNotExist && !isEnvError) {
            try {
              await db.createCollection(table)
              await db.collection(table).add(finalRow)
              return finalRow
            } catch (createErr) {
              console.error(`CloudBase createCollection error for ${table}:`, createErr)
            }
          } else {
            console.error(`CloudBase insertRow error for ${table}:`, err)
          }
        }
      }
    }

    // Local fallback
    const rows = await readLocalRows(table)
    rows.unshift(finalRow)
    await writeLocalRows(table, rows)
    return finalRow
  },

  async updateRow(table: string, filters: RawRow, patch: RawRow): Promise<RawRow | null> {
    const now = nowIso()
    const finalPatch = { ...patch, updated_at: now }

    if (REGION === ("INTL" as any)) {
      const supabase = getSupabase()
      if (supabase) {
        let query = supabase.from(table).update(finalPatch).select("*")
        for (const [k, v] of Object.entries(filters)) query = query.eq(k, v)
        const { data, error } = await query.maybeSingle()
        if (!error && data) return data
      }
    }

    if (REGION === "CN") {
      const db = getCloudBase()
      if (db) {
        try {
          const collection = db.collection(table)
          const res = await collection.where(filters).get()
          if (res.data?.[0]?._id) {
            await collection.doc(res.data[0]._id).update(finalPatch)
            return { ...res.data[0], ...finalPatch }
          }
        } catch (err) {
          console.error(`CloudBase updateRow error for ${table}:`, err)
        }
      }
    }

    // Local fallback
    const rows = await readLocalRows(table)
    const index = rows.findIndex(r => Object.entries(filters).every(([k, v]) => r[k] === v))
    if (index === -1) return null
    rows[index] = { ...rows[index], ...finalPatch }
    await writeLocalRows(table, rows)
    return rows[index]
  },

  async deleteRow(table: string, filters: RawRow): Promise<boolean> {
    if (REGION === ("INTL" as any)) {
      const supabase = getSupabase()
      if (supabase) {
        let query = supabase.from(table).delete()
        for (const [k, v] of Object.entries(filters)) query = query.eq(k, v)
        const { error } = await query
        return !error
      }
    }

    if (REGION === "CN") {
      const db = getCloudBase()
      if (db) {
        try {
          const collection = db.collection(table)
          const res = await collection.where(filters).remove()
          return res.deleted > 0
        } catch (err) {
          console.error(`CloudBase deleteRow error for ${table}:`, err)
        }
      }
    }

    // Local fallback
    const rows = await readLocalRows(table)
    const initialLen = rows.length
    const filtered = rows.filter(r => !Object.entries(filters).every(([k, v]) => r[k] === v))
    if (filtered.length === initialLen) return false
    await writeLocalRows(table, filtered)
    return true
  }
}
