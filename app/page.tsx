"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UserAvatarDropdown } from "@/components/market/user-avatar-dropdown"
import { LoginPrompt } from "@/components/market/login-prompt"
import {
  Globe,
  Moon,
  Sun,
  ArrowRight,
  Users,
  TrendingUp,
  DollarSign,
  Network,
  Sparkles,
  Building2,
  Target,
  Zap,
  Play,
  ChevronRight,
} from "lucide-react"

interface UserProfile {
  userId: string
  email: string
  nickname: string
  avatar?: string
}

export default function HomePage() {
  const router = useRouter()
  const [isDark, setIsDark] = useState(false)
  const [lang, setLang] = useState<"en" | "zh">("zh")
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/market/admin/acquisition", {
          credentials: "include",
        })
        const json = await response.json()
        if (json.data?.profile) {
          setUser({
            userId: json.data.profile.id,
            email: json.data.profile.email || "",
            nickname: json.data.profile.nickname || json.data.profile.fullName || "User",
            avatar: json.data.profile.avatar,
          })
        }
      } catch (err) {
        console.error("Auth check failed:", err)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" })
      localStorage.removeItem("market_user")
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleProtectedClick = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault()
      setShowLoginPrompt(true)
    }
  }

  const content = {
    en: {
      nav: {
        blogger: "Blogger Connector",
        task: "Task Connector",
        capital: "Business Capital Connector",
      },
      hero: {
        title: "Build, Scale, Fund",
        subtitle: "All in One AI Business OS",
        description: "mornbusiness is the AI operating system for founders, CEOs, and investors. From idea to unicorn — powered by artificial intelligence.",
        cta1: "Start Building",
        cta2: "View Demo",
      },
      systems: {
        title: "Core Business Infrastructure",
        subtitle: "Three mandatory systems powering your growth",
        task: {
          title: "Ad-to-Earn Task Rewards",
          subtitle: "Global User Ad Interaction & Earnings Platform",
          description: "Participate in ad viewing and interaction, complete simple tasks to earn cash rewards, real-time settlement, flexible withdrawal.",
          features: ["Ad Task Marketplace", "Real-time Reward Settlement", "Flexible Withdrawal", "Anti-fraud System"],
        },
        merchant: {
          title: "VC / Government / Donation Connector",
          subtitle: "Global Capital Network (Merchant & Funding Mode)",
          description: "Connect with VC funds, government grants and donation foundations. Build your funding highway.",
          features: ["CEO Matching Engine", "Financial Modeling AI", "Business Strategy AI", "Deal Room", "Investor Matching", "Grant & Policy Database", "Pitch Deck AI", "Roadshow Assistant"],
        },
        blogger: {
          title: "1000w Blogger Connector",
          subtitle: "Global Creator Growth Engine",
          description: "Connect with 10M+ bloggers, influencers and media channels. Build your content matrix, traffic system and brand army.",
          features: ["Content Matrix Builder", "Viral Topic Generator", "Influencer CRM", "SEO & Distribution Engine"],
        },
      },
      optional: {
        title: "Optional Expansion Modules",
        subtitle: "Extend your business OS capabilities",
      },
      cta: {
        title: "Start Your AI Business Empire Today",
        button: "Launch Project",
      },
      footer: {
        tagline: "AI Business Operating System",
        subtitle: "From startup to unicorn.",
      },
    },
    zh: {
      nav: {
        blogger: "博主连接器",
        task: "任务连接器",
        capital: "商业资本连接器",
      },
      hero: {
        title: "用 AI 搭建、增长、融资",
        subtitle: "你的商业帝国",
        description: "mornbusiness 是全球创业者、CEO 与投资人的 AI 商业操作系统。从创意到独角兽，一站式智能中枢。",
        cta1: "立即开始",
        cta2: "查看演示",
      },
      systems: {
        title: "核心商业基础设施",
        subtitle: "三大核心系统驱动你的增长",
        task: {
          title: "Ad-to-Earn 广告任务赚收益",
          subtitle: "全球用户广告互动与收益平台",
          description: "参与广告观看与互动，完成简单任务即可获得现金奖励，实时到账，灵活提现。",
          features: ["广告任务广场", "实时奖励结算", "灵活提现通道", "防刷风控系统"],
        },
        merchant: {
          title: "B2B 商业与资本对接器",
          subtitle: "连接企业、机构与资本的高速通道（商家 & 融资模式）",
          description: "对接CEO、CFO、企业与机构，连接VC、政府项目、公益基金。构建商业合作与融资高速通道。",
          features: ["CEO智能匹配", "财务建模系统", "商业战略AI", "交易室", "投资人匹配", "政策与补贴数据库", "BP生成AI", "路演助手"],
        },
        blogger: {
          title: "1000万博主增长引擎",
          subtitle: "全球内容创作者网络",
          description: "连接全球博主、媒体与内容创作者。构建你的内容矩阵与流量帝国。",
          features: ["内容矩阵系统", "爆款选题引擎", "博主CRM", "SEO分发系统"],
        },
      },
      optional: {
        title: "可选扩展模块",
        subtitle: "扩展你的商业操作系统能力",
      },
      cta: {
        title: "今天就启动你的 AI 商业帝国",
        button: "启动项目",
      },
      footer: {
        tagline: "AI 商业操作系统",
        subtitle: "从创业到独角兽",
      },
    },
  }

  const t = content[lang]

  const productLinks = [
    { icon: Zap, name: "sitehub", cn: "https://site.mornscience.top/", intl: "https://www.mornhub.help/" },
    { icon: Users, name: "personalink", cn: "https://personalink.mornscience.top", intl: "https://www.mornhub.lat" },
    { icon: Building2, name: "mornspeaker", cn: "https://mornspeaker.mornscience.top/", intl: "https://www.mornscience.onl/" },
    { icon: Target, name: "mornclient", cn: "https://mornclient.mornscience.top/", intl: "https://www.mornscience.biz" },
    { icon: TrendingUp, name: "morncoach", cn: "http://morncoach.mornscience.top", intl: "https://mornhub.biz" },
    { icon: Globe, name: "morntool", cn: "http://morntool.mornscience.top", intl: "https://www.mornhub.lol/" },
    { icon: Network, name: "mornfront", cn: "https://mornfront.mornscience.top/", intl: "https://www.mornscience.dev/" },
    { icon: Sparkles, name: "multigpt", cn: "https://multigpt.mornscience.top/", intl: "https://morn.work/" },
    { icon: DollarSign, name: "OrbitChat", cn: "https://orbital.mornscience.top/", intl: "http://mornscience.work/" },
    { icon: Moon, name: "mornxyz", cn: "https://mornxyz.mornscience.top/", intl: "https://www.mornhub.xyz/" },
    { icon: Sun, name: "morngpt", cn: "https://morngpt.mornscience.top/", intl: "https://www.morn.work/" },
    { icon: ArrowRight, name: "mornfake", cn: "https://mornfake.mornscience.top", intl: "https://www.mornhub.pics" },
    { icon: Users, name: "mornhome", cn: "https://mornhome.mornscience.top", intl: "https://mornhub.homes/" },
  ]
  const isCnRegion = lang === "zh"

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-gradient-hero text-foreground transition-colors overflow-x-hidden">
        {/* Decorative background elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <header className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/20 dark:border-white/10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                mornbusiness
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-2">
              <Link 
                href="/market/acquisition?mode=influencer" 
                className="group relative px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-full transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500"
              >
                <span className="relative z-10 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-cyan-500 transition-all duration-300">
                  {t.nav.blogger}
                </span>
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-cyan-500/0 opacity-0 group-hover:opacity-100 group-hover:from-blue-500/10 group-hover:via-blue-500/5 group-hover:to-cyan-500/10 transition-all duration-300" />
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full group-hover:w-1/2 transition-all duration-300" />
              </Link>
              <Link 
                href="/market/acquisition?mode=merchant" 
                className="group relative px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-full transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500"
              >
                <span className="relative z-10 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500 transition-all duration-300">
                  {t.nav.task}
                </span>
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-pink-500/0 opacity-0 group-hover:opacity-100 group-hover:from-purple-500/10 group-hover:via-purple-500/5 group-hover:to-pink-500/10 transition-all duration-300" />
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full group-hover:w-1/2 transition-all duration-300" />
              </Link>
              <Link 
                href="/market/leads-pool" 
                className="group relative px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-full transition-all duration-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500"
              >
                <span className="relative z-10 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300">
                  {t.nav.capital}
                </span>
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-teal-500/0 opacity-0 group-hover:opacity-100 group-hover:from-emerald-500/10 group-hover:via-emerald-500/5 group-hover:to-teal-500/10 transition-all duration-300" />
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full group-hover:w-1/2 transition-all duration-300" />
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/50 dark:hover:bg-white/10" onClick={() => setLang(lang === "en" ? "zh" : "en")}>
                <Globe className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/50 dark:hover:bg-white/10" onClick={toggleTheme}>
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </Button>
              {!loading && (
                <>
                  {user ? (
                    <UserAvatarDropdown user={user} onLogout={handleLogout} />
                  ) : (
                    <Button className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5" size="sm" asChild>
                      <Link href="/login">{lang === "en" ? "Log in" : "登录"}</Link>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative pt-36 pb-24 px-4">
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-full border border-blue-200/50 dark:border-blue-500/20 shadow-lg shadow-blue-500/10">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {lang === "en" ? "AI for Enterprise" : "企业级 AI 平台"}
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
                <span className="text-slate-800 dark:text-white">{t.hero.title}</span>
                <br />
                <span className="text-gradient-animated">{t.hero.subtitle}</span>
              </h1>

              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-pretty leading-relaxed">
                {t.hero.description}
              </p>

              {/* Primary CTAs */}
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="gap-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:-translate-y-1 px-8 py-6 text-lg font-semibold" 
                  onClick={(e) => !user && handleProtectedClick(e as any, "/launch")}
                  asChild
                >
                  <Link href="/launch">
                    {t.hero.cta1}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white/80 dark:hover:bg-slate-800/80 backdrop-blur-sm transition-all hover:-translate-y-1 px-8 py-6 text-lg font-semibold" asChild>
                  <Link href="/demo">{t.hero.cta2}</Link>
                </Button>
              </div>

              {/* Secondary CTAs */}
              <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
                {[
                  { href: "/ide", label: "在线 IDE", protected: true, gradient: "from-blue-500 to-cyan-500" },
                  { href: "/project/studio", label: "项目生成/部署", protected: true, gradient: "from-purple-500 to-pink-500" },
                  { href: "/ai-coder", label: "AI 程序员", protected: true, gradient: "from-emerald-500 to-teal-500" },
                  { href: "/scaffold", label: "脚手架生成", protected: true, gradient: "from-orange-500 to-amber-500" },
                ].map((item) => (
                  <Button 
                    key={item.href} 
                    size="sm" 
                    variant="outline" 
                    className="group relative rounded-full px-5 py-2 border-slate-300/70 dark:border-slate-600/70 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-transparent hover:shadow-lg hover:-translate-y-0.5"
                    onClick={(e) => item.protected && !user && handleProtectedClick(e as any, item.href)}
                    asChild
                  >
                    <Link href={item.href}>
                      <span className="relative z-10 group-hover:text-white transition-colors duration-300">{item.label}</span>
                      <span className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Core Systems Section */}
        <section className="relative py-24 px-4 section-gradient">
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">{t.systems.title}</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">{t.systems.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Task Mode - Ad-to-Earn */}
              <Card className="group relative p-8 glass-card rounded-3xl border-0 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-white" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{t.systems.task.title}</h3>
                    <p className="text-sm font-semibold text-orange-500">{t.systems.task.subtitle}</p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t.systems.task.description}</p>
                  </div>
                  <ul className="space-y-3">
                    {t.systems.task.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full rounded-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all hover:-translate-y-0.5"
                    onClick={(e) => !user && handleProtectedClick(e as any, "/market/acquisition?mode=task")}
                    asChild
                  >
                    <Link href="/market/acquisition?mode=task">
                      {lang === "en" ? "Explore" : "了解更多"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </Card>

              {/* Merchant Mode - B2B + VC */}
              <Card className="group relative p-8 glass-card rounded-3xl border-0 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{t.systems.merchant.title}</h3>
                    <p className="text-sm font-semibold text-emerald-500">{t.systems.merchant.subtitle}</p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t.systems.merchant.description}</p>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-2 gap-y-2">
                    {t.systems.merchant.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 flex-shrink-0" />
                        <span className="truncate">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
                    onClick={(e) => !user && handleProtectedClick(e as any, "/market/acquisition?mode=merchant")}
                    asChild
                  >
                    <Link href="/market/acquisition?mode=merchant">
                      {lang === "en" ? "Explore" : "了解更多"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </Card>

              {/* Blogger Connector */}
              <Card className="group relative p-8 glass-card rounded-3xl border-0 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{t.systems.blogger.title}</h3>
                    <p className="text-sm font-semibold text-blue-500">{t.systems.blogger.subtitle}</p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t.systems.blogger.description}</p>
                  </div>
                  <ul className="space-y-3">
                    {t.systems.blogger.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:-translate-y-0.5"
                    onClick={(e) => !user && handleProtectedClick(e as any, "/market/acquisition?mode=influencer")}
                    asChild
                  >
                    <Link href="/market/acquisition?mode=influencer">
                      {lang === "en" ? "Explore" : "了解更多"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Optional Modules Section */}
        <section className="relative py-24 px-4">
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">{t.optional.title}</h2>
              <p className="text-slate-600 dark:text-slate-400">{t.optional.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-4 gap-5">
              {productLinks.slice(0, 8).map((product, i) => {
                const Icon = product.icon
                const href = isCnRegion ? product.cn : product.intl
                return (
                  <a key={i} href={href} target="_blank" rel="noreferrer" className="block group">
                    <Card className="p-6 glass-card rounded-2xl border-0 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 h-full">
                      <div className="space-y-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-colors">
                          <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white mb-1">{product.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{isCnRegion ? "中国节点" : "Global Node"}</p>
                        </div>
                      </div>
                    </Card>
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section className="relative py-24 px-4 section-gradient">
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-white">
                {lang === "en" ? "Your AI Business Infrastructure" : "你的 AI 商业基础设施"}
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {lang === "en" ? "One OS. Infinite Possibilities." : "一个系统，无限可能"}
              </p>
            </div>

            <div className="grid md:grid-cols-5 gap-4">
              {productLinks.slice(8).map((product, i) => {
                const href = isCnRegion ? product.cn : product.intl
                return (
                  <a key={i} href={href} target="_blank" rel="noreferrer" className="block group">
                    <Card className="p-5 glass-card rounded-2xl border-0 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1 text-center h-full">
                      <div className="space-y-4">
                        <div className="w-full h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-purple-500/30 transition-shadow">
                          <Network className="w-8 h-8 text-white" />
                        </div>
                        <p className="font-semibold text-sm text-slate-800 dark:text-white">{product.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{isCnRegion ? "中国节点" : "Global"}</p>
                      </div>
                    </Card>
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-32 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/50 to-blue-100/30 dark:from-transparent dark:via-blue-900/10 dark:to-blue-800/20" />
          <div className="container mx-auto max-w-4xl text-center space-y-10 relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold text-slate-800 dark:text-white text-balance">
              {t.cta.title}
            </h2>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button 
                size="lg" 
                className="gap-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 hover:from-blue-600 hover:via-purple-600 hover:to-cyan-600 text-white shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover:-translate-y-1 px-10 py-7 text-lg font-semibold"
                onClick={(e) => !user && handleProtectedClick(e as any, "/launch")}
                asChild
              >
                <Link href="/launch">
                  {t.cta.button}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-white/80 dark:hover:bg-slate-800/80 backdrop-blur-sm transition-all hover:-translate-y-1 px-8 py-7 text-lg font-semibold"
                onClick={(e) => !user && handleProtectedClick(e as any, "/market/leads-pool")}
                asChild
              >
                <Link href="/market/leads-pool">
                  {lang === "en" ? "Browse Leads Pool" : "浏览线索池"}
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-white/80 dark:hover:bg-slate-800/80 backdrop-blur-sm transition-all hover:-translate-y-1 px-8 py-7 text-lg font-semibold"
                onClick={(e) => !user && handleProtectedClick(e as any, "/connect-capital")}
                asChild
              >
                <Link href="/connect-capital">{lang === "en" ? "Connect Capital" : "对接资本"}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative py-16 px-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="container mx-auto max-w-6xl text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                mornbusiness
              </span>
            </div>
            <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">{t.footer.tagline}</p>
            <p className="text-slate-500 dark:text-slate-400">{t.footer.subtitle}</p>
          </div>
        </footer>

        {/* Login Prompt Dialog */}
        <LoginPrompt isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} />
      </div>
    </div>
  )
}
