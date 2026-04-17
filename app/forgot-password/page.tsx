"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowLeft, Mail, Lock, ShieldCheck, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"

// 根据环境变量确定地域
const isCN = (process.env.NEXT_PUBLIC_SITE_REGION || "cn").toLowerCase() === "cn"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<"email" | "code" | "done">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(timer); return 0 } return prev - 1 })
    }, 1000)
  }

  const handleSendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "请输入正确的邮箱地址", variant: "destructive" }); return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/email/send-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "reset" }),
      })
      const data = await res.json()
      if (data.ok) {
        setStep("code")
        startCountdown()
        toast({ title: "验证码已发送", description: "请查收邮件，10分钟内有效" })
      } else {
        toast({ title: "发送失败", description: data.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "发送失败，请重试", variant: "destructive" })
    } finally { setLoading(false) }
  }

  const handleReset = async () => {
    if (!code || !newPassword) {
      toast({ title: "请填写验证码和新密码", variant: "destructive" }); return
    }
    if (newPassword.length < 6) {
      toast({ title: "密码长度至少6位", variant: "destructive" }); return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/email/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      })
      const data = await res.json()
      if (data.ok) {
        setStep("done")
        toast({ title: "密码重置成功" })
      } else {
        toast({ title: "重置失败", description: data.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "重置失败，请重试", variant: "destructive" })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
      </div>
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/20">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-3">
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
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6 group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {isCN ? "返回登录" : "Back to login"}
              </Link>

              {step === "done" ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={32} className="text-emerald-500" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">密码重置成功</h2>
                  <p className="text-slate-500 text-sm">请使用新密码登录</p>
                  <Button onClick={() => router.push("/login")} className="w-full h-11 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                    去登录
                  </Button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                      {isCN ? "找回密码" : "Reset Password"}
                    </h1>
                    <p className="text-slate-500 text-sm">
                      {step === "email" ? "输入注册邮箱，获取验证码" : "输入验证码和新密码"}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* 邮箱 */}
                    <div className="space-y-1.5">
                      <Label className="text-slate-700 font-medium text-sm">邮箱</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
                          disabled={step === "code"}
                          className="pl-10 h-11 rounded-xl border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 disabled:opacity-60" />
                      </div>
                    </div>

                    {step === "email" && (
                      <Button onClick={handleSendCode} disabled={loading} className="w-full h-11 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-70">
                        {loading ? <><Loader2 className="animate-spin w-4 h-4 mr-2" />发送中...</> : "发送验证码"}
                      </Button>
                    )}

                    {step === "code" && (
                      <>
                        {/* 验证码 */}
                        <div className="space-y-1.5">
                          <Label className="text-slate-700 font-medium text-sm">验证码</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input value={code} onChange={e => setCode(e.target.value)} placeholder="6位验证码" maxLength={6}
                                className="pl-10 h-11 rounded-xl border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" />
                            </div>
                            <Button type="button" variant="outline" onClick={handleSendCode} disabled={loading || countdown > 0}
                              className="h-11 px-4 rounded-xl whitespace-nowrap text-sm flex-shrink-0">
                              {countdown > 0 ? `${countdown}s` : "重新发送"}
                            </Button>
                          </div>
                        </div>

                        {/* 新密码 */}
                        <div className="space-y-1.5">
                          <Label className="text-slate-700 font-medium text-sm">新密码</Label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input value={newPassword} onChange={e => setNewPassword(e.target.value)}
                              type={showPassword ? "text" : "password"} placeholder="至少6位"
                              className="pl-10 pr-10 h-11 rounded-xl border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500">
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <Button onClick={handleReset} disabled={loading} className="w-full h-11 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-70">
                          {loading ? <><Loader2 className="animate-spin w-4 h-4 mr-2" />重置中...</> : "确认重置密码"}
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="mt-5 pt-5 border-t border-slate-200/60 text-center text-sm text-slate-500">
                    <span>想起密码了？</span>
                    <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 ml-1">去登录</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
