'use client'

import { useMemo } from 'react'
import { getPlatformConfig, PlatformType } from '../platform'

// 平台信息类型
export interface PlatformInfo {
  platform: PlatformType
  isMiniProgram: boolean
  isWeb: boolean
  apiBaseUrl: string
  miniProgram: {
    appId: string
  }
  web: {
    wechatRedirectUri: string
  }
}

// 平台判断 Hook
export function usePlatform(): PlatformInfo {
  const platformInfo = useMemo(() => {
    return getPlatformConfig()
  }, [])

  return platformInfo
}
