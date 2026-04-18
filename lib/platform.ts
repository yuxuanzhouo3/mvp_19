// 平台判断工具

// 平台类型
export type PlatformType = 'web' | 'miniprogram'

// 获取当前平台类型
export function getPlatform(): PlatformType {
  // 检测是否在微信小程序 web-view 中
  if (typeof window !== 'undefined' && window.__wxjs_environment === 'miniprogram') {
    return 'miniprogram'
  }

  // 默认为 web 平台
  return 'web'
}

// 判断是否为小程序环境
export function isMiniProgram(): boolean {
  return getPlatform() === 'miniprogram'
}

// 判断是否为 web 环境
export function isWeb(): boolean {
  return getPlatform() === 'web'
}

// 获取平台特定配置
export function getPlatformConfig() {
  const platform = getPlatform()
  
  return {
    platform,
    isMiniProgram: platform === 'miniprogram',
    isWeb: platform === 'web',
    // 平台特定配置
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    // 小程序特定配置
    miniProgram: {
      appId: process.env.NEXT_PUBLIC_WECHAT_APP_ID || '',
    },
    // Web 特定配置
    web: {
      wechatRedirectUri: process.env.NEXT_PUBLIC_WECHAT_REDIRECT_URI || '',
    },
  }
}
