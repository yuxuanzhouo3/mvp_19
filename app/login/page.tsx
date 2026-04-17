"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Sparkles, ArrowLeft, Mail, Lock, Eye, EyeOff, Phone, MessageSquare, Loader2 } from "lucide-react"

declare global { interface Window { google?: any } }

// 根据环境变量确定地域
const isCN = (process.env.NEXT_PUBLIC_SITE_REGION || "cn").toLowerCase() === "cn"
const isIntl = !isCN

const t = {
  back:           isIntl ? "Back to home"              : "返回首页",
  title:          isIntl ? "Sign in"                   : "登录",
  subtitle:       isIntl ? "Sign in with your email"   : "登录您的账户",
  email:          isIntl ? "Email"                     : "邮箱",
  password:       isIntl ? "Password"                  : "密码",
  pwdPlaceholder: isIntl ? "Enter password"            : "输入密码",
  submit:         isIntl ? "Sign in"                   : "登录",
  submitting:     isIntl ? "Signing in..."             : "登录中...",
  noAccount:      isIntl ? "Don't have an account?"    : "还没有账号？",
  register:       isIntl ? "Sign up"                   : "立即注册",
  orThirdParty:   isIntl ? "Or continue with"          : "或使用第三方登录",
  googleBtn:      isIntl ? "Continue with Google"      : "Google 登录",
  missingFields:  isIntl ? "Please fill in all fields" : "请填写邮箱和密码",
  loginSuccess:   isIntl ? "Signed in successfully"    : "登录成功",
  loginFailed:    isIntl ? "Sign in failed"            : "登录失败",
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginTab, setLoginTab] = useState<"email" | "sms">("email")
  const [phone, setPhone] = useState("")
  const [smsCode, setSmsCode] = useState("")
  const [smsSending, setSmsSending] = useState(false)
  const [smsCountdown, setSmsCountdown] = useState(0)
  const router = useRouter()

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const wechatAppId    = process.env.NEXT_PUBLIC_WECHAT_APP_ID

  useEffect(() => {
    if (smsCountdown <= 0) return
    const t = setTimeout(() => setSmsCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [smsCountdown])

  const handleGoogleClick = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/google/callback`)
    const scope = encodeURIComponent("openid email profile")
    const state = Math.random().toString(36).slice(2)
    sessionStorage.setItem("google_oauth_state", state)
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}&access_type=offline`
  }

  const sendSms = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      toast({ title: "请输入正确的手机号", variant: "destructive" }); return
    }
    setSmsSending(true)
    try {
      const res = await fetch("/api/auth/sms/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (data.ok) { toast({ title: "验证码已发送，5分钟内有效" }); setSmsCountdown(60) }
      else toast({ title: data.message || "发送失败", variant: "destructive" })
    } catch { toast({ title: "发送失败，请重试", variant: "destructive" }) }
    finally { setSmsSending(false) }
  }

  const handleSmsLogin = async () => {
    if (!phone || !smsCode) { toast({ title: "请填写手机号和验证码", variant: "destructive" }); return }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/sms/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: smsCode }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.message || "登录失败")
      localStorage.setItem("market_user", JSON.stringify({
        userId: data.user.userId, phone: data.user.phone,
        nickname: `用户${phone.slice(-4)}`,
      }))
      toast({ title: data.message || "登录成功" })
      setTimeout(() => { router.push("/"); router.refresh() }, 800)
    } catch (e: any) {
      toast({ title: e.message || t.loginFailed, variant: "destructive" })
    } finally { setLoading(false) }
  }

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email    = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")
    if (!email || !password) { toast({ title: t.missingFields, variant: "destructive" }); return }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.message || t.loginFailed)
      localStorage.setItem("market_user", JSON.stringify({
        userId: data.user.userId, email: data.user.email,
        nickname: data.user.profile?.nickname || data.user.email.split("@")[0],
        avatar: data.user.profile?.avatar || "",
      }))
      toast({ title: t.loginSuccess })
      setTimeout(() => { router.push("/"); router.refresh() }, 800)
    } catch (e: any) {
      toast({ title: e.message || t.loginFailed, variant: "destructive" })
    } finally { setLoading(false) }
  }

  // Google 回调处理
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code  = params.get("code")
    const state = params.get("state")
    if (code && state === "google_callback") {
      sessionStorage.setItem("google_code", code)
      window.location.href = "/?"
    }
    const savedCode = sessionStorage.getItem("google_code")
    if (savedCode && !localStorage.getItem("market_user")) {
      sessionStorage.removeItem("google_code")
      fetch("/api/auth/google/callback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: savedCode }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.ok) {
            localStorage.setItem("market_user", JSON.stringify({
              userId: data.user.userId, email: data.user.email,
              nickname: data.user.profile?.nickname || data.user.email.split("@")[0],
              avatar: data.user.profile?.avatar || "",
            }))
            toast({ title: t.loginSuccess })
            setTimeout(() => { router.push("/"); router.refresh() }, 500)
          }
        })
        .catch(() => toast({ title: t.loginFailed, variant: "destructive" }))
    }
    // 微信登录回调处理
    const wechatCode = params.get("code")
    const wechatState = params.get("state")
    if (wechatCode && wechatState?.startsWith("wx_")) {
      fetch("/api/auth/wechat/callback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: wechatCode }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.ok) {
            localStorage.setItem("market_user", JSON.stringify({
              userId: data.user.userId, email: data.user.email,
              nickname: data.user.profile?.nickname || data.user.nickname || "微信用户",
              avatar: data.user.profile?.avatar || "",
            }))
            toast({ title: "微信登录成功" })
            window.location.href = "/"
          } else {
            toast({ title: data.message || "微信登录失败", variant: "destructive" })
          }
        })
        .catch(() => toast({ title: "微信登录失败", variant: "destructive" }))
    }
  }, [])

  const showThirdParty = (isIntl && !!googleClientId) || (isCN && !!wechatAppId)

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl" />
      </div>
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/20">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">mornbusiness</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(239,246,255,0.85) 50%, rgba(243,232,255,0.9) 100%)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 25px 50px -12px rgba(59,130,246,0.2)' }} />
            <div className="relative p-8">
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {t.back}
              </Link>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">{t.title}</h1>
                <p className="text-slate-500 text-sm">{t.subtitle}</p>
              </div>

              {/* 登录方式切换 - 仅国内版显示手机号登录 */}
              {isCN && (
                <div className="flex gap-2 mb-6 p-1.5 rounded-2xl" style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(203,213,225,0.4)' }}>
                  <button type="button" onClick={() => setLoginTab("email")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${loginTab === "email" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>
                    邮箱登录
                  </button>
                  <button type="button" onClick={() => setLoginTab("sms")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${loginTab === "sms" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>
                    短信登录
                  </button>
                </div>
              )}

              {loginTab === "email" ? (
                <form className="space-y-4" onSubmit={handleEmailLogin}>
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-medium text-sm">{t.email}</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input name="email" type="email" placeholder={t.pwdPlaceholder} required
                        className="pl-10 h-11 rounded-xl border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-medium text-sm">{t.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input name="password" type={showPassword ? "text" : "password"} placeholder={t.pwdPlaceholder} required
                        className="pl-10 pr-10 h-11 rounded-xl border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-70">
                    {loading ? <><Loader2 className="animate-spin w-4 h-4 mr-2" />{t.submitting}</> : t.submit}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-medium text-sm">手机号</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="请输入手机号" maxLength={11}
                        className="pl-10 h-11 rounded-xl border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-medium text-sm">验证码</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input value={smsCode} onChange={e => setSmsCode(e.target.value)} placeholder="6位验证码" maxLength={6}
                          className="pl-10 h-11 rounded-xl border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" />
                      </div>
                      <Button type="button" variant="outline" onClick={sendSms} disabled={smsSending || smsCountdown > 0}
                        className="h-11 px-4 rounded-xl whitespace-nowrap text-sm flex-shrink-0">
                        {smsSending ? <Loader2 size={14} className="animate-spin" /> : smsCountdown > 0 ? `${smsCountdown}s` : "获取验证码"}
                      </Button>
                    </div>
                  </div>
                  <Button onClick={handleSmsLogin} disabled={loading} className="w-full h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-70">
                    {loading ? <><Loader2 className="animate-spin w-4 h-4 mr-2" />{t.submitting}</> : t.submit}
                  </Button>
                </div>
              )}

              {/* 第三方登录 */}
              {showThirdParty && (
                <>
                  <div className="mt-6 pt-6 border-t border-slate-200/60">
                    <p className="text-center text-sm text-slate-400 mb-4">{t.orThirdParty}</p>
                    <div className="flex flex-col gap-3">
                      {isIntl && googleClientId && (
                        <button type="button" onClick={handleGoogleClick} disabled={loading}
                          className="w-full h-12 rounded-full border border-slate-200 bg-white/70 hover:bg-white text-slate-700 text-sm font-medium flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 disabled:opacity-50 shadow-sm">
                          <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          {t.googleBtn}
                        </button>
                      )}
                      {isCN && wechatAppId && <WechatLoginButton />}
                    </div>
                  </div>
                </>
              )}

              <div className="mt-6 pt-6 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-sm">
                  {isCN ? (
                    <Link href="/forgot-password" className="text-slate-400 hover:text-blue-600 transition-colors">
                      忘记密码？
                    </Link>
                  ) : <span />}
                  <div className="flex items-center gap-1 text-slate-500">
                    <span>{t.noAccount}</span>
                    <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                      {t.register}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── 微信登录按钮（仅国内版）────────────────────────────
function WechatLoginButton() {
  const [loading, setLoading] = useState(false)
  const [qrcodeUrl, setQrcodeUrl] = useState("")
  const [showQr, setShowQr] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/wechat/qrcode")
      const json = await res.json()
      if (json.ok && json.data?.qrcodeUrl) {
        setQrcodeUrl(json.data.qrcodeUrl)
        setShowQr(true)
      } else {
        alert(json.message || "获取微信登录二维码失败")
      }
    } catch {
      alert("获取微信登录二维码失败，请重试")
    }
    finally { setLoading(false) }
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={loading}
        className="w-full h-12 rounded-full border border-slate-200 bg-white/70 hover:bg-white text-slate-700 text-sm font-medium flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 disabled:opacity-50 shadow-sm mt-3">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#07C160]">
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-3.74 2.632c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm5.4 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
        </svg>
        {loading ? "获取二维码中..." : "微信扫码登录"}
      </button>

      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-xs rounded-3xl p-6 text-center" style={{
            background: "linear-gradient(135deg,rgba(255,255,255,0.96) 0%,rgba(239,246,255,0.92) 100%)",
            backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 25px 50px rgba(7,193,96,0.2)",
          }}>
            <h3 className="font-bold text-slate-800 mb-1">微信扫码登录</h3>
            <p className="text-xs text-slate-400 mb-4">使用微信扫描下方二维码</p>
            <div className="flex justify-center mb-4">
              <iframe src={qrcodeUrl} className="w-[200px] h-[200px] border-0 rounded-xl" scrolling="no" title="微信登录二维码" />
            </div>
            <button onClick={() => setShowQr(false)}
              className="w-full h-10 rounded-full border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition-colors">
              取消
            </button>
          </div>
        </div>
      )}
    </>
  )
}
