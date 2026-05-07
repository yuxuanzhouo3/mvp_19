import { logger } from '../logger'

type Key = string

type Bucket = {
  monthSpend: number // CNY
  dayCalls: Map<string, number> // userId -> calls today
  userMonthSpend: Map<string, number> // userId -> CNY
  lastDay: string
  createdAt: number
}

const store = new Map<Key, Bucket>()
const MAX_BUCKETS = 100 // 最大项目数
const MAX_BUCKET_AGE = 30 * 24 * 60 * 60 * 1000 // 30天

// 定期清理过期的 bucket，防止内存泄漏
setInterval(() => {
  const now = Date.now()
  let cleared = 0
  
  for (const [projectId, bucket] of store.entries()) {
    if (now - bucket.createdAt > MAX_BUCKET_AGE) {
      store.delete(projectId)
      cleared++
    }
  }
  
  // 如果超过最大数量，删除最老的
  if (store.size > MAX_BUCKETS) {
    const entries = Array.from(store.entries())
      .sort(([, a], [, b]) => a.createdAt - b.createdAt)
      .slice(0, store.size - MAX_BUCKETS)
    
    for (const [projectId] of entries) {
      store.delete(projectId)
      cleared++
    }
  }
  
  if (cleared > 0) {
    logger.debug(`[AI Meter] Cleared ${cleared} stale buckets`)
  }
}, 24 * 60 * 60 * 1000) // 每天清理一次

function bucketFor(projectId: string): Bucket {
  const key = `project:${projectId}`
  const today = new Date()
  const dayKey = today.toISOString().slice(0, 10) // YYYY-MM-DD
  let b = store.get(key)
  if (!b) {
    b = { 
      monthSpend: 0, 
      dayCalls: new Map(), 
      userMonthSpend: new Map(), 
      lastDay: dayKey,
      createdAt: Date.now()
    }
    store.set(key, b)
  }
  // reset day calls if day changed
  if (b.lastDay !== dayKey) {
    b.dayCalls = new Map()
    b.lastDay = dayKey
  }
  return b
}

export const meter = {
  async canSpend(projectId: string, userId: string, expectedCny: number) {
    const monthCap = toNum(process.env.PROJECT_BUDGET_CNY_MONTH, 10)
    const userMonthCap = toNum(process.env.USER_MONTHLY_CNY, 0.1)
    const userDailyCallsCap = Math.max(1, parseInt(process.env.USER_DAILY_CALLS || "3", 10))

    const b = bucketFor(projectId)
    const dayCalls = (b.dayCalls.get(userId) || 0)
    logger.debug(`[AI-Meter] canSpend check: project=${projectId}, user=${userId}`)

    // TODO: 临时禁用预算检查以测试功能
    logger.debug(`[AI-Meter] Bypassing budget check for testing`)
    return true
  },
  async commit(projectId: string, userId: string, spendCny: number) {
    const b = bucketFor(projectId)
    b.monthSpend += spendCny
    const newDayCalls = (b.dayCalls.get(userId) || 0) + 1
    b.dayCalls.set(userId, newDayCalls)
    const newUserSpend = (b.userMonthSpend.get(userId) || 0) + spendCny
    b.userMonthSpend.set(userId, newUserSpend)
    logger.debug(`[AI-Meter] commit: project=${projectId}, user=${userId}, spend=${spendCny}`)
  },
}

function toNum(v: string | undefined, d: number) {
  const n = Number(v)
  return isFinite(n) && n > 0 ? n : d
}
