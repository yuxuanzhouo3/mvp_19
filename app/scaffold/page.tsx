'use client'

import React, { useMemo, useRef, useState, useEffect } from "react"
import Link from "next/link"
import { LoginPrompt } from "@/components/market/login-prompt"
import { Sparkles, ArrowLeft, Folder, Layers, Server, Play, Terminal, Code2, FileCode, Cpu, ChevronDown, Check } from "lucide-react"

type Template = "react-admin" | "vue-project" | "next-project" | "springboot-api"

const DEFAULT_BASE = process.env.NEXT_PUBLIC_SCAFFOLD_BASE || "http://localhost:3001"

export default function ScaffoldPage() {
  const [projectName, setProjectName] = useState("my-app")
  const [template, setTemplate] = useState<Template>("react-admin")
  const [logs, setLogs] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 检查登录状态
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/market/admin/acquisition")
        const json = await response.json()
        setIsLoggedIn(!!json.data.profile)
      } catch (err) {
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const append = (line: string) => setLogs((prev) => (prev ? prev + "\n" + line : line))

  const templates = useMemo(
    () => [
      { value: "react-admin", label: "React Admin" },
      { value: "vue-project", label: "Vue Project" },
      { value: "next-project", label: "Next.js Project" },
      { value: "springboot-api", label: "SpringBoot API" },
    ],
    [],
  )

  function startSpinner(prefix = "等待服务器响应") {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    let i = 0
    timerRef.current = setInterval(() => {
      const f = frames[i % frames.length]
      i += 1
      const lines = logs.split("\n")
      // 更新最后一行
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

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      setIsLoginPromptOpen(true)
      return
    }
    if (!projectName.trim()) {
      alert("请输入项目名称")
      return
    }
    setLoading(true)
    setLogs("")
    append(`🚀 一键生成脚手架`)
    append(`🌐 服务器: ${baseUrl}`)
    append(`📁 项目名称: ${projectName}`)
    append(`📦 模板类型: ${template}`)
    append(``)
    append(`请求已发送，等待服务器生成中 ...`)
    startSpinner("等待服务器响应")

    try {
      const resp = await fetch(`${baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, templateType: template }),
      })

      stopSpinner()

      if (!resp.ok) {
        const text = await resp.text()
        append(`❌ 请求失败: ${resp.status} ${resp.statusText}`)
        append(text)
        setLoading(false)
        return
      }
      const data = (await resp.json()) as { success?: boolean; downloadUrl?: string; message?: string }
      if (!data?.success || !data?.downloadUrl) {
        append(`❌ 生成失败: ${data?.message || "未返回 downloadUrl"}`)
        setLoading(false)
        return
      }

      append(`✅ 生成成功`)
      append(`下载链接: ${data.downloadUrl}`)
      append(`正在开始下载...`)

      // 触发下载
      const a = document.createElement("a")
      a.href = data.downloadUrl
      a.download = ""
      a.target = "_blank"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      append(`若未自动下载，请复制到浏览器打开上方链接。`)
    } catch (err) {
      stopSpinner()
      append(`❌ 网络或跨域错误：${err instanceof Error ? err.message : String(err)}`)
      append(`若为 CORS 问题，请在 E:\\scaffold-server 开启跨域 (Access-Control-Allow-Origin)。`)
    } finally {
      setLoading(false)
    }
  }

  const getTemplateIcon = (templateValue: string) => {
    switch (templateValue) {
      case "react-admin": return <Code2 className="w-4 h-4" />
      case "vue-project": return <FileCode className="w-4 h-4" />
      case "next-project": return <Cpu className="w-4 h-4" />
      case "springboot-api": return <Server className="w-4 h-4" />
      default: return <Code2 className="w-4 h-4" />
    }
  }

  const getTemplateColor = (templateValue: string) => {
    switch (templateValue) {
      case "react-admin": return "from-blue-500 to-cyan-500"
      case "vue-project": return "from-emerald-500 to-teal-500"
      case "next-project": return "from-slate-700 to-slate-900"
      case "springboot-api": return "from-green-600 to-emerald-600"
      default: return "from-blue-500 to-cyan-500"
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
            一键生成项目脚手架
          </h1>
          <p className="text-slate-600 text-base">
            快速生成各类前端、后端项目脚手架，包含完整的项目结构和最佳实践配置
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
                  placeholder="my-app"
                />
              </div>
              <div className="space-y-2" ref={dropdownRef}>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Layers className="w-4 h-4 text-purple-500" />
                  模板类型
                </label>
                {/* Custom Dropdown */}
                <div className="relative">
                  {/* Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm px-4 text-sm
                      focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 
                      transition-all duration-300 hover:border-blue-300 hover:shadow-md
                      outline-none cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${getTemplateColor(template)} flex items-center justify-center`}>
                        <span className="text-white scale-75">{getTemplateIcon(template)}</span>
                      </div>
                      <span className="text-slate-700 font-medium">
                        {templates.find(t => t.value === template)?.label}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-slate-200/80 
                        bg-white/95 backdrop-blur-xl shadow-xl shadow-slate-200/50 overflow-hidden z-50"
                      style={{
                        animation: 'dropdownSlideIn 0.2s ease-out'
                      }}
                    >
                      {templates.map((t, index) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => {
                            setTemplate(t.value as Template)
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200
                            hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50
                            ${template === t.value ? 'bg-gradient-to-r from-blue-50 to-purple-50' : ''}
                            ${index !== templates.length - 1 ? 'border-b border-slate-100' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getTemplateColor(t.value)} flex items-center justify-center shadow-md`}>
                            <span className="text-white scale-75">{getTemplateIcon(t.value)}</span>
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${template === t.value ? 'text-blue-600' : 'text-slate-700'}`}>
                              {t.label}
                            </p>
                          </div>
                          {template === t.value && (
                            <Check className="w-4 h-4 text-blue-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Template Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200/60">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTemplateColor(template)} flex items-center justify-center shadow-lg`}>
                {getTemplateIcon(template)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {templates.find(t => t.value === template)?.label}
                </p>
                <p className="text-xs text-slate-500">
                  包含完整的项目结构、配置文件和最佳实践
                </p>
              </div>
            </div>

            {/* Server Info */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Server className="w-4 h-4 text-cyan-500" />
                脚手架服务地址
              </label>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full h-12 rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm px-4 text-sm
                  focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 
                  placeholder:text-slate-400 transition-all duration-300
                  hover:border-blue-300 outline-none"
                placeholder="http://localhost:3001"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
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
                <span className="font-semibold text-slate-800">实时日志</span>
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

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 mt-8">
          <p>© 2026 mornbusiness 版权所有</p>
        </div>
      </main>

      <LoginPrompt isOpen={isLoginPromptOpen} onClose={() => setIsLoginPromptOpen(false)} />
    </div>
  )
}

