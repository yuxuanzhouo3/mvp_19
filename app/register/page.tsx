"use client"

import Link from "next/link"
import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { Sparkles, ArrowLeft, Mail, Lock, Eye, EyeOff, UserPlus, ShieldCheck, Loader2 } from "lucide-react"

// 根据环境变量确定地域
const isCN = (process.env.NEXT_PUBLIC_SITE_REGION || "cn").toLowerCase() === "cn"

function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailCode, setEmailCode] = useState("")
  const [sendingCode, setSendingCode] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [email, setEmail] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get("ref") || ""

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown(prev => { if (prev <= 1) { clearInterval(timer); return 0 } return prev - 1 })
    }, 1000)
  }

  const handleSendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "请先输入正确的邮箱地址", variant: "destructive" }); return
    }
    setSendingCode(true)
    try {
      const res = await fetch("/api/auth/email/send-code", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "register" }),
      })
      const data = await res.json()
      if (data.ok) {
        setCodeSent(true)
        startCountdown()
        toast({ title: "验证码已发送", description: "请查收邮件，10分钟内有效" })
      } else {
        toast({ title: "发送失败", description: data.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "发送失败，请重试", variant: "destructive" })
    } finally { setSendingCode(false) }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const password = String(formData.get("password") ?? "")
    const confirmPassword = String(formData.get("confirmPassword") ?? "")

    if (!email || !password || !confirmPassword) {
      toast({ title: "请填写所有必填项", variant: "destructive" }); return
    }
    if (isCN && !emailCode) {
      toast({ title: "请输入邮箱验证码", variant: "destructive" }); return
    }
    if (password !== confirmPassword) {
      toast({ title: "两次密码不一致", variant: "destructive" }); return
    }
    if (password.length < 6) {
      toast({ title: "密码长度至少6位", variant: "destructive" }); return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, emailCode: isCN ? emailCode : undefined, referralCode: refCode || undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.message ?? "注册失败")
      toast({ title: "注册成功", description: "账号已创建，请登录" })
      setTimeout(() => router.push("/login"), 1500)
    } catch (error) {
      toast({ title: "注册失败", description: error instanceof Error ? error.message : "未知错误", variant: "destructive" })
    } finally { setLoading(false) }
  }

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
                {isCN ? "返回首页" : "Back to home"}
              </Link>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                  {isCN ? "注册账号" : "Create an account"}
                </h1>
                <p className="text-slate-500 text-sm">{isCN ? "填写信息创建新账号" : "Enter your details to register"}</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* 邮箱 */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-medium text-sm">{isCN ? "邮箱" : "Email"}</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@company.com" required
                      className="pl-10 h-11 rounded-xl border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" />
                  </div>
                </div>

                {/* 国内版：邮箱验证码 */}
                {isCN && (
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-medium text-sm">邮箱验证码</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input value={emailCode} onChange={e => setEmailCode(e.target.value)} placeholder="6位验证码" maxLength={6}
                          className="pl-10 h-11 rounded-xl border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" />
                      </div>
                      <Button type="button" variant="outline" onClick={handleSendCode}
                        disabled={sendingCode || countdown > 0}
                        className="h-11 px-4 rounded-xl whitespace-nowrap text-sm flex-shrink-0">
                        {sendingCode ? <Loader2 size={14} className="animate-spin" /> : countdown > 0 ? `${countdown}s` : codeSent ? "重新发送" : "发送验证码"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* 密码 */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-medium text-sm">{isCN ? "密码" : "Password"}</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="password" type={showPassword ? "text" : "password"} placeholder={isCN ? "至少6位" : "Min 6 characters"} required
                      className="pl-10 pr-10 h-11 rounded-xl border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* 确认密码 */}
                <div className="space-y-1.5">
                  <Label className="text-slate-700 font-medium text-sm">{isCN ? "确认密码" : "Confirm Password"}</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder={isCN ? "再次输入密码" : "Confirm password"} required
                      className="pl-10 pr-10 h-11 rounded-xl border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-70">
                  {loading ? <><Loader2 className="animate-spin w-4 h-4 mr-2" />{isCN ? "注册中..." : "Registering..."}</> : <><UserPlus className="w-4 h-4 mr-2" />{isCN ? "立即注册" : "Register"}</>}
                </Button>
              </form>

              <div className="mt-5 pt-5 border-t border-slate-200/60 flex items-center justify-end text-sm">
                <div className="flex items-center gap-1 text-slate-500">
                  <span>{isCN ? "已有账号？" : "Have an account?"}</span>
                  <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">{isCN ? "立即登录" : "Login"}</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-hero flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  )
}
