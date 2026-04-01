'use client'

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { LoginPrompt } from "@/components/market/login-prompt"
import { Sparkles, Play, FilePlus, Code2, Terminal, ArrowLeft } from "lucide-react"

export default function OnlineIDEPage() {
  const [checkingLogin, setCheckingLogin] = useState(true)
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false)
  const [code, setCode] = useState<string>(`// JavaScript 运行示例\nfunction add(a, b) {\n  return a + b\n}\n\nconsole.log('add(2,3)=', add(2,3))`)
  const [output, setOutput] = useState<string>("")

  const runJs = () => {
    if (checkingLogin || isLoginPromptOpen) return
    const logs: string[] = []
    const originalLog = console.log
    try {
      ;(console as any).log = (...args: any[]) => {
        logs.push(args.map(String).join(" "))
      }
      // 安全起见，这只是浏览器端 demo，不接收外部代码写文件/网络
      // eslint-disable-next-line no-new-func
      const fn = new Function(code)
      fn()
      setOutput(logs.join("\n"))
    } catch (e) {
      setOutput(String(e))
    } finally {
      console.log = originalLog
    }
  }

  useEffect(() => {
    let cancelled = false
    async function check() {
      try {
        const res = await fetch("/api/me")
        const data = await res.json()
        if (cancelled) return
        if (!data?.ok) setIsLoginPromptOpen(true)
      } catch {
        if (!cancelled) setIsLoginPromptOpen(true)
      } finally {
        if (!cancelled) setCheckingLogin(false)
      }
    }
    void check()
    return () => {
      cancelled = true
    }
  }, [])

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
      <main className="relative z-10 container mx-auto max-w-6xl px-4 pt-24 pb-12">
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
            在线可运行 IDE
          </h1>
          <p className="text-slate-600 text-base">
            浏览器端 JavaScript 代码编辑器，支持实时运行与调试
          </p>
        </div>

        {/* IDE Container */}
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
          
          <div className="relative p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Code Editor Area */}
              <div className="space-y-3">
                {/* Code Header */}
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Code2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-800">代码编辑器</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">JavaScript</span>
                </div>
                
                {/* Code Editor */}
                <div className="relative">
                  <div 
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                    }}
                  />
                  <textarea
                    className="relative w-full h-[400px] font-mono text-sm rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                    style={{
                      background: 'transparent',
                      color: '#e2e8f0',
                      lineHeight: '1.6'
                    }}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 
                      hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white font-medium
                      shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 
                      transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                    onClick={runJs}
                    disabled={checkingLogin}
                  >
                    <Play className="w-4 h-4" />
                    运行代码
                  </button>
                  <button
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full
                      bg-gradient-to-r from-slate-100 to-blue-50 hover:from-slate-200 hover:to-blue-100
                      text-slate-700 font-medium border border-slate-200
                      shadow-md shadow-slate-200/50 hover:shadow-lg
                      transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
                    onClick={() => setCode("// 新文件\nconsole.log('Hello, World!')")}
                    disabled={checkingLogin}
                  >
                    <FilePlus className="w-4 h-4" />
                    新建文件
                  </button>
                </div>
              </div>

              {/* Output Console Area */}
              <div className="space-y-3">
                {/* Output Header */}
                <div className="flex items-center gap-2 text-slate-700">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Terminal className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-slate-800">输出控制台</span>
                  <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full">Console</span>
                </div>
                
                {/* Output Console */}
                <div className="relative">
                  <div 
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}
                  />
                  <div className="relative h-[400px] rounded-2xl p-4 overflow-auto">
                    <pre 
                      className="font-mono text-sm whitespace-pre-wrap leading-relaxed"
                      style={{ color: '#e2e8f0' }}
                    >
                      {output ? (
                        <span style={{ color: '#6ee7b7' }}>{output}</span>
                      ) : (
                        <span className="text-slate-500 italic">// 点击"运行代码"查看输出结果...</span>
                      )}
                    </pre>
                  </div>
                </div>

                {/* Console Info */}
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  浏览器端 JavaScript 运行环境
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-8 pt-6 border-t border-slate-200/60">
              <p className="text-sm text-slate-500 leading-relaxed">
                <span className="font-medium text-slate-700">说明：</span>
                这是一个轻量级前端演示环境，适合 JavaScript/TypeScript 代码片段的快速运行与调试。
                服务端 Runner（支持 Java、Python、Go 等多种语言）可按需接入后端沙箱执行。
              </p>
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

