/**
 * 分页工具函数
 * 用于限制查询数据量，避免内存过载
 */

// 默认分页配置
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100 // 最大单次查询数量

/**
 * 解析分页参数
 */
export function parsePagination(query: Record<string, any>): { page: number; pageSize: number; offset: number } {
  const page = Math.max(1, Number(query.page) || 1)
  let pageSize = Number(query.pageSize) || DEFAULT_PAGE_SIZE

  // 限制最大单次查询数量
  pageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE)

  const offset = (page - 1) * pageSize

  return { page, pageSize, offset }
}

/**
 * 分页结果类型
 */
export interface PaginatedResult<T> {
  rows: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 对数组进行内存分页（当数据库不支持分页时使用）
 */
export function paginateArray<T>(data: T[], offset: number, limit: number): T[] {
  return data.slice(offset, offset + limit)
}

/**
 * 构建分页响应
 */
export function buildPaginatedResponse<T>(rows: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}
