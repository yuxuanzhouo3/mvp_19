'use client'

import { usePlatform } from '@/lib/hooks/usePlatform'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useState } from 'react'

export default function PlatformTestPage() {
  const { platform, isMiniProgram, isWeb, miniProgram, web } = usePlatform()
  const [wxReady, setWxReady] = useState(false)

  // 测试微信小程序 API
  const testWechatAPI = () => {
    if (isMiniProgram && window.wx) {
      window.wx.getSystemInfo({
        success: (res: any) => {
          alert('微信小程序 API 测试成功:\n' + JSON.stringify(res, null, 2))
        },
        fail: (err: any) => {
          alert('微信小程序 API 测试失败:\n' + err.errMsg)
        }
      })
    } else {
      alert('当前不在小程序环境中')
    }
  }

  // 检查微信 SDK 是否加载
  if (isMiniProgram && window.wx) {
    setWxReady(true)
  }

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">平台环境测试</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 平台信息 */}
            <Alert>
              <AlertTitle>当前平台</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>平台类型:</strong> {platform}</p>
                  <p><strong>是否小程序:</strong> {isMiniProgram ? '是' : '否'}</p>
                  <p><strong>是否网页:</strong> {isWeb ? '是' : '否'}</p>
                  <p><strong>微信 AppID:</strong> {miniProgram.appId || '未配置'}</p>
                  <p><strong>微信回调地址:</strong> {web.wechatRedirectUri || '未配置'}</p>
                </div>
              </AlertDescription>
            </Alert>

            {/* 小程序测试 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">小程序功能测试</h3>
              <Card>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">
                      {isMiniProgram ? '当前在小程序环境中' : '当前不在小程序环境中'}
                    </p>
                    <p className="text-sm text-slate-500">
                      微信 SDK 加载状态: {wxReady ? '已加载' : '未加载'}
                    </p>
                    <Button 
                      onClick={testWechatAPI} 
                      disabled={!isMiniProgram || !window.wx}
                    >
                      测试微信小程序 API
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 环境检测测试 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">环境检测测试</h3>
              <Card>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>自动检测结果:</strong> {platform}</p>
                    <p><strong>window.__wxjs_environment:</strong> {typeof window !== 'undefined' ? window.__wxjs_environment || '未定义' : '服务端'}</p>
                    <p><strong>NEXT_PUBLIC_SITE_REGION:</strong> {process.env.NEXT_PUBLIC_SITE_REGION || '未设置'}</p>
                    <p><strong>NEXT_PUBLIC_APP_URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || '未设置'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 登录方式建议 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">推荐登录方式</h3>
              <Card>
                <CardContent>
                  <div className="space-y-2">
                    {isMiniProgram ? (
                      <Alert variant="default">
                        <AlertTitle>小程序登录</AlertTitle>
                        <AlertDescription>
                          建议使用微信小程序登录（wx.login）
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="default">
                        <AlertTitle>网页登录</AlertTitle>
                        <AlertDescription>
                          建议使用邮箱/手机号登录，或微信扫码登录
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 平台特定功能 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">平台特定功能</h3>
              <Card>
                <CardContent>
                  <div className="space-y-3">
                    {isMiniProgram ? (
                      <div className="space-y-2">
                        <p className="text-sm">小程序特有功能：</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                          <li>微信登录 (wx.login)</li>
                          <li>微信支付 (wx.requestPayment)</li>
                          <li>获取用户信息 (wx.getUserProfile)</li>
                          <li>分享到朋友圈 (wx.shareTimeline)</li>
                        </ul>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm">网页特有功能：</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                          <li>邮箱/手机号登录</li>
                          <li>Google 登录</li>
                          <li>微信扫码登录</li>
                          <li>浏览器通知</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
