// 全局单例，确保多个 route 共享同一个 Map
const g = globalThis as any
if (!g.__emailCodeStore) {
  g.__emailCodeStore = new Map<string, { code: string; expires: number; type: string }>()
}
export const emailCodeStore: Map<string, { code: string; expires: number; type: string }> = g.__emailCodeStore
