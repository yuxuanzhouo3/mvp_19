/**
 * 带超时的 fetch 工具函数
 * 防止请求一直挂着不释放内存
 */

export class FetchTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`请求超时: ${url} (${timeoutMs}ms)`)
    this.name = 'FetchTimeoutError'
  }
}

/**
 * 带超时的 fetch
 * @param url 请求URL
 * @param options fetch 选项
 * @param timeoutMs 超时毫秒，默认 30000ms (30秒)
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } catch (error: any) {
    // 确保信号被清理
    if (!controller.signal.aborted) {
      controller.abort()
    }
    if (error.name === 'AbortError') {
      throw new FetchTimeoutError(url, timeoutMs)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 带超时和自动重试的 fetch
 * @param url 请求URL
 * @param options fetch 选项
 * @param timeoutMs 超时毫秒，默认 30000ms
 * @param retries 重试次数，默认 1
 */
export async function fetchWithTimeoutAndRetry(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000,
  retries: number = 1
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs)
      return response
    } catch (error: any) {
      lastError = error

      // 如果是超时错误，并且还有重试机会，则重试
      if (error instanceof FetchTimeoutError && attempt < retries) {
        console.warn(`[fetchWithRetry] 超时，准备重试 (${attempt + 1}/${retries}):`, url)
        continue
      }

      // 其他错误，直接抛出
      throw error
    }
  }

  throw lastError
}
