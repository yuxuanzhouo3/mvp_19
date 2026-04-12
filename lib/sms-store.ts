// 全局单例，确保 send 和 verify 共享同一个 Map
const g = globalThis as any
if (!g.__smsCodeStore) {
  g.__smsCodeStore = new Map<string, { code: string; expires: number }>()
}
export const codeStore: Map<string, { code: string; expires: number }> = g.__smsCodeStore
