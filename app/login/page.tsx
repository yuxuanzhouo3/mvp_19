"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Sparkles, ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              mornbusiness
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          {/* Glass Card */}
          <div className="relative">
            {/* Card background with glassmorphism */}
            <div 
              className="absolute inset-0 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(239,246,255,0.85) 50%, rgba(243,232,255,0.9) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(255,255,255,0.5) inset'
              }}
            />
            
            <div className="relative p-8 md:p-10">
              {/* Back button */}
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6 group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                返回首页
              </Link>

              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
                  登录
                </h1>
                <p className="text-slate-500 text-sm">
                  使用邮箱和密码登录您的账户
                </p>
              </div>

              {/* Form */}
              <form
                className="space-y-5"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const email = String(formData.get("email") ?? "")
                  const password = String(formData.get("password") ?? "")

                  if (!email || !password) {
                    toast({ title: "缺少字段", description: "请填写邮箱和密码", variant: "destructive" })
                    return
                  }

                  try {
                    setLoading(true)
                    const res = await fetch("/api/auth/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, password }),
                    })
                    const data = (await res.json()) as { message?: string; user?: { userId: string; email: string; nickname?: string } }

                    if (!res.ok) {
                      throw new Error(data.message ?? "登录失败")
                    }

                    // 保存用户信息到 localStorage
                    if (data.user) {
                      localStorage.setItem('market_user', JSON.stringify({
                        userId: data.user.userId,
                        email: data.user.email,
                        nickname: data.user.nickname || data.user.email.split('@')[0]
                      }))
                    }

                    toast({ title: "登录成功", description: "正在跳转到首页..." })

                    // 登录成功后跳转到首页
                    setTimeout(() => {
                      router.push("/")
                      router.refresh()
                    }, 1000)
                  } catch (error) {
                    toast({
                      title: "请求失败",
                      description: error instanceof Error ? error.message : "未知错误",
                      variant: "destructive",
                    })
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                    邮箱
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="your@email.com" 
                      required 
                      className="pl-12 h-12 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm
                        focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 
                        placeholder:text-slate-400 transition-all duration-300
                        hover:border-blue-300"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium text-sm">
                    密码
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      id="password" 
                      name="password" 
                      type={showPassword ? "text" : "password"}
                      placeholder="输入密码" 
                      required 
                      className="pl-12 pr-12 h-12 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm
                        focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 
                        placeholder:text-slate-400 transition-all duration-300
                        hover:border-blue-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 hover:text-blue-500 transition-colors focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 
                    hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 
                    text-white font-semibold text-base
                    shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 
                    transition-all duration-300 hover:-translate-y-0.5
                    disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      登录中...
                    </span>
                  ) : (
                    "登录"
                  )}
                </Button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 pt-6 border-t border-slate-200/60">
                <div className="flex items-center justify-between text-sm">
                  <Link 
                    href="/" 
                    className="text-slate-500 hover:text-blue-600 transition-colors relative group"
                  >
                    返回首页
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300" />
                  </Link>
                  <div className="flex items-center gap-1 text-slate-500">
                    <span>还没有账号？</span>
                    <Link 
                      href="/register" 
                      className="text-blue-600 font-semibold hover:text-blue-700 transition-colors relative group"
                    >
                      立即注册
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
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
