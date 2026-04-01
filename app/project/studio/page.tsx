'use client'

import React, { useRef, useState } from "react"
import Link from "next/link"
import { LoginPrompt } from "@/components/market/login-prompt"
import { Sparkles, ArrowLeft, Server, Folder, Layers, Play, Terminal } from "lucide-react"

export default function ProjectStudioPage() {
  const [projectName, setProjectName] = useState("my-spring-api")
  const [logs, setLogs] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const append = (s: string) => setLogs((p) => (p ? p + "\n" + s : s))

  function startSpinner(prefix = "等待服务器响应") {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    let i = 0
    timerRef.current = setInterval(() => {
      const f = frames[i % frames.length]
      i += 1
      const lines = logs.split("\n")
      const updated = [...lines.slice(0, -1), `${prefix} ${f}`].filter(Boolean).join("\n")
      setLogs(updated)
    }, 120)
  }
  function stopSpinner() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  async function generate() {
    if (!projectName.trim()) {
      alert("请输入项目名称")
      return
    }

    // 未登录时：弹窗提示前往登录；取消则保持在当前页面
    try {
      const meResp = await fetch("/api/me", { credentials: "same-origin" })
      const me = await meResp.json()
      if (!me?.ok) {
        setIsLoginPromptOpen(true)
        return
      }
    } catch {
      setIsLoginPromptOpen(true)
      return
    }

    setLoading(true)
    setLogs("")
    append("🚀 一键生成 SpringBoot 后端接口脚手架")
    append("🌐 服务器: http://localhost:3001")
    append(`📁 项目名称: ${projectName}`)
    append("📦 模板类型: springboot-api")
    append("")
    append("请求已发送，等待服务器生成中 ...")
    startSpinner("等待服务器响应")

    try {
      const resp = await fetch("/api/spring-genera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName }),
      })
      stopSpinner()
      if (!resp.ok) {
        append(`❌ 请求失败: ${resp.status} ${resp.statusText}`)
        append(await resp.text())
        setLoading(false)
        return
      }
      const data = (await resp.json()) as { success?: boolean; downloadUrl?: string; message?: string }
      if (!data?.success || !data?.downloadUrl) {
        append(`❌ 生成失败: ${data?.message || "未返回 downloadUrl"}`)
        setLoading(false)
        return
      }
      append("✅ 生成成功")
      append(`下载链接: ${data.downloadUrl}`)
      append("正在开始下载...")
      const a = document.createElement("a")
      a.href = data.downloadUrl
      a.download = ""
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      append("若未自动下载，请复制到浏览器打开上方链接。")
    } catch (err) {
      stopSpinner()
      append(`❌ 网络或跨域错误：${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

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
      <main className="relative z-10 container mx-auto max-w-4xl px-4 pt-24 pb-12">
        {/* Back button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          返回首页
        </Link>

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent mb-3">
            SpringBoot 后端接口 · 一键脚手架
          </h1>
          <p className="text-slate-600 text-base">
            快速生成企业级 SpringBoot 后端项目脚手架，包含完整的 API 接口结构
          </p>
        </div>

        {/* Main Card */}
        <div className="relative">
          {/* Glass Card Background */}
          <div 
            className="absolute inset-0 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,246,255,0.9) 50%, rgba(243,232,255,0.95) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(255,255,255,0.5) inset'
            }}
          />
          
          <div className="relative p-6 md:p-8 space-y-6">
            {/* Form Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Folder className="w-4 h-4 text-blue-500" />
                  项目名称
                </label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm px-4 text-sm
                    focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 
                    placeholder:text-slate-400 transition-all duration-300
                    hover:border-blue-300 outline-none"
                  placeholder="my-spring-api"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Layers className="w-4 h-4 text-purple-500" />
                  模板类型
                </label>
                <div className="w-full h-12 rounded-xl border border-slate-200 bg-slate-100/70 px-4 flex items-center text-sm text-slate-600">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs mr-2">SpringBoot</span>
                  后端接口脚手架
                </div>
              </div>
            </div>

            {/* Server Info */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50/70 border border-blue-100">
              <Server className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">服务器地址</p>
                <p className="text-xs text-slate-500">http://localhost:3001</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Generate Button */}
            <button
              onClick={generate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full 
                bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 
                hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 
                text-white font-semibold text-base
                shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 
                transition-all duration-300 hover:-translate-y-0.5 
                disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  生成中...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  一键生成项目
                </>
              )}
            </button>

            {/* Logs Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Terminal className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-slate-800">生成日志</span>
                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full">Console</span>
              </div>
              
              <div className="relative">
                <div 
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                  }}
                />
                <pre 
                  className="relative min-h-[240px] whitespace-pre-wrap p-4 text-sm font-mono leading-relaxed overflow-auto"
                  style={{ color: '#6ee7b7' }}
                >
                  {logs || <span className="text-slate-500 italic">// 点击"一键生成项目"开始生成...</span>}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>

      <LoginPrompt
        isOpen={isLoginPromptOpen}
        onClose={() => {
          setIsLoginPromptOpen(false)
        }}
      />
    </div>
  )
}

