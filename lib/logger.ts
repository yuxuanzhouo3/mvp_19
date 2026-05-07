/**
 * 日志工具类
 * 支持日志级别控制，生产环境关闭 debug 日志
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class Logger {
  private currentLevel: LogLevel

  constructor() {
    const env = process.env.NODE_ENV || 'development'
    this.currentLevel = env === 'production' ? 'info' : 'debug'
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.currentLevel]
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString()
    const levelPrefix = `[${level.toUpperCase()}]`
    
    if (meta && typeof meta === 'object') {
      return `${timestamp} ${levelPrefix} ${message}`
    }
    
    return `${timestamp} ${levelPrefix} ${message}`
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      this.logWithMeta('debug', message, meta)
    }
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      this.logWithMeta('info', message, meta)
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      this.logWithMeta('warn', message, meta)
    }
  }

  error(message: string, meta?: any): void {
    if (this.shouldLog('error')) {
      this.logWithMeta('error', message, meta)
    }
  }

  private logWithMeta(level: LogLevel, message: string, meta?: any): void {
    if (meta && typeof meta === 'object' && meta !== null) {
      // 安全处理对象，避免缓存大对象
      const safeMeta = this.safeMeta(meta)
      const logFunc = (level === 'debug' ? console.debug : 
                       level === 'info' ? console.info : 
                       level === 'warn' ? console.warn : console.error)
      logFunc(this.formatMessage(level, message), safeMeta)
    } else {
      const logFunc = (level === 'debug' ? console.debug : 
                       level === 'info' ? console.info : 
                       level === 'warn' ? console.warn : console.error)
      logFunc(this.formatMessage(level, message))
    }
  }

  private safeMeta(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj

    if (Array.isArray(obj)) {
      return `Array(${obj.length})`
    }

    // 只保留基本类型，避免大对象
    const result: any = {}
    const keys = Object.keys(obj)
    for (let i = 0; i < Math.min(keys.length, 5); i++) {
      const key = keys[i]
      const value = obj[key]
      if (typeof value === 'string' && value.length > 100) {
        result[key] = `${value.slice(0, 100)}... (${value.length} chars)`
      } else if (typeof value === 'object') {
        result[key] = `[${Array.isArray(value) ? 'Array' : 'Object'}]`
      } else {
        result[key] = value
      }
    }
    if (keys.length > 5) {
      result['...'] = `${keys.length - 5} more keys`
    }
    return result
  }

  /**
   * 安全打印对象，只打印关键信息，不打印整个对象
   */
  safeLog(message: string, obj?: any): void {
    if (!this.shouldLog('debug')) return
    
    if (!obj) {
      console.debug(this.formatMessage('debug', message))
      return
    }

    // 处理不同类型的对象
    if (Array.isArray(obj)) {
      console.debug(this.formatMessage('debug', `${message} (数组长度: ${obj.length})`))
    } else if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj).slice(0, 5) // 只显示前5个键
      const hasMore = Object.keys(obj).length > 5
      console.debug(this.formatMessage('debug', `${message} (键: ${keys.join(', ')}${hasMore ? ', ...' : ''})`))
    } else {
      console.debug(this.formatMessage('debug', `${message}: ${String(obj)}`))
    }
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level
  }

  /**
   * 获取当前日志级别
   */
  getLevel(): LogLevel {
    return this.currentLevel
  }
}

export const logger = new Logger()

// 导出简写方法
export const log = logger.debug.bind(logger)
export const info = logger.info.bind(logger)
export const warn = logger.warn.bind(logger)
export const error = logger.error.bind(logger)
export const safeLog = logger.safeLog.bind(logger)
