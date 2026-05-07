import { logger } from './logger'

// 全局单例，确保 send 和 verify 共享同一个 Map
const g = globalThis as any
if (!g.__smsCodeStore) {
  g.__smsCodeStore = new Map<string, { code: string; expires: number }>()
  // 定期清理过期验证码，防止内存泄漏
  setInterval(() => {
    const now = Date.now()
    let cleared = 0
    for (const [phone, entry] of g.__smsCodeStore.entries()) {
      if (entry.expires < now) {
        g.__smsCodeStore.delete(phone)
        cleared++
      }
    }
    if (cleared > 0) {
      logger.debug(`[SMS Store] Cleared ${cleared} expired codes`)
    }
  }, 5 * 60 * 1000) // 每5分钟清理一次
}
export const codeStore: Map<string, { code: string; expires: number }> = g.__smsCodeStore
