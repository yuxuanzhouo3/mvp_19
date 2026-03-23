"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
} from "lucide-react"

export default function HomePage() {
  const [isDark, setIsDark] = useState(false)
  const [lang, setLang] = useState<"en" | "zh">("en")

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle("dark")
  }

  const content = {
    en: {
      nav: {
        blogger: "Blogger Connector",
        ceo: "B2B Demand 财务/CEO Connector",
        investor: "Investor Connector",
      },
      hero: {
        title: "Build, Scale, Fund",
        subtitle: "All in One AI Business OS",
        description:
          "mornbusiness is the AI operating system for founders, CEOs, and investors. From idea to unicorn — powered by artificial intelligence.",
        cta1: "Start Building",
        cta2: "View Demo",
      },
      systems: {
        title: "Core Business Infrastructure",
        subtitle: "Three mandatory systems powering your growth",
        blogger: {
          title: "1000w Blogger Connector",
          subtitle: "Global Creator Growth Engine",
          description:
            "Connect with 10M+ bloggers, influencers and media channels. Build your content matrix, traffic system and brand army.",
          features: ["Content Matrix Builder", "Viral Topic Generator", "Influencer CRM", "SEO & Distribution Engine"],
        },
        ceo: {
          title: "B2B Demand 财务/CEO Connector",
          subtitle: "Enterprise Business & Financial Intelligence Hub",
          description:
            "Match with CEOs, CFOs, enterprises and institutions worldwide. Build your business partnership network.",
          features: ["CEO Matching Engine", "Financial Modeling AI", "Business Strategy AI", "Deal Room"],
        },
        investor: {
          title: "VC / Government / Donation Connector",
          subtitle: "Global Capital Network",
          description: "Connect with VC funds, government grants and donation foundations. Build your funding highway.",
          features: ["Investor Matching", "Grant & Policy Database", "Pitch Deck AI", "Roadshow Assistant"],
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
        ceo: "B2B需求财务/CEO连接器",
        investor: "投资人连接器",
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
        blogger: {
          title: "1000万博主增长引擎",
          subtitle: "全球内容创作者网络",
          description: "连接全球博主、媒体与内容创作者。构建你的内容矩阵与流量帝国。",
          features: ["内容矩阵系统", "爆款选题引擎", "博主CRM", "SEO分发系统"],
        },
        ceo: {
          title: "B2B需求财务/CEO连接器",
          subtitle: "全球B2B商业与财务中枢",
          description: "对接CEO、CFO、企业与机构。构建商业合作网络。",
          features: ["CEO智能匹配", "财务建模系统", "商业战略AI", "交易室"],
        },
        investor: {
          title: "VC / 政府 / 公益连接器",
          subtitle: "全球资本连接器",
          description: "对接VC、政府项目、公益基金。构建融资高速通道。",
          features: ["投资人匹配", "政策与补贴数据库", "BP生成AI", "路演助手"],
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
      <div className="min-h-screen bg-background text-foreground transition-colors">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo - leftmost */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">mornbusiness</span>
            </div>

            {/* Navigation - center */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#blogger" className="text-sm font-medium hover:text-blue-600 transition-colors">
                {t.nav.blogger}
              </a>
              <a href="#ceo" className="text-sm font-medium hover:text-purple-600 transition-colors">
                {t.nav.ceo}
              </a>
              <a href="#investor" className="text-sm font-medium hover:text-green-600 transition-colors">
                {t.nav.investor}
              </a>
            </nav>

            {/* Controls - rightmost */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setLang(lang === "en" ? "zh" : "en")}>
                <Globe className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">{lang === "en" ? "Log in" : "登录"}</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-6">
              <div className="inline-block px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium border border-blue-500/20">
                {lang === "en" ? "AI for Enterprise" : "企业级 AI 平台"}
              </div>

              <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-balance">
                {t.hero.title}
                <br />
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  {t.hero.subtitle}
                </span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
                {t.hero.description}
              </p>

              <div className="flex items-center justify-center gap-4 pt-4">
                <Button size="lg" className="gap-2" asChild>
                  <Link href="/launch">
                    {t.hero.cta1}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/demo">{t.hero.cta2}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Core Systems Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl font-bold text-balance">{t.systems.title}</h2>
              <p className="text-lg text-muted-foreground">{t.systems.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Blogger Connector */}
              <Card
                id="blogger"
                className="p-8 space-y-6 border-2 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/10 scroll-mt-20"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">{t.systems.blogger.title}</h3>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t.systems.blogger.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed">{t.systems.blogger.description}</p>
                </div>
                <ul className="space-y-2">
                  {t.systems.blogger.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/demo">
                    {lang === "en" ? "Explore" : "了解更多"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </Card>

              {/* CEO Connector */}
              <Card
                id="ceo"
                className="p-8 space-y-6 border-2 hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/10 scroll-mt-20"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">{t.systems.ceo.title}</h3>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{t.systems.ceo.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed">{t.systems.ceo.description}</p>
                </div>
                <ul className="space-y-2">
                  {t.systems.ceo.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/demo">
                    {lang === "en" ? "Explore" : "了解更多"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </Card>

              {/* Investor Connector */}
              <Card
                id="investor"
                className="p-8 space-y-6 border-2 hover:border-green-500/50 transition-all hover:shadow-xl hover:shadow-green-500/10 scroll-mt-20"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">{t.systems.investor.title}</h3>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {t.systems.investor.subtitle}
                  </p>
                  <p className="text-muted-foreground leading-relaxed">{t.systems.investor.description}</p>
                </div>
                <ul className="space-y-2">
                  {t.systems.investor.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/demo">
                    {lang === "en" ? "Explore" : "了解更多"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </Card>
            </div>
          </div>
        </section>

        {/* Optional Modules Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold">{t.optional.title}</h2>
              <p className="text-muted-foreground">{t.optional.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {productLinks.slice(0, 8).map((product, i) => {
                const Icon = product.icon
                const href = isCnRegion ? product.cn : product.intl
                return (
                  <a key={i} href={href} target="_blank" rel="noreferrer" className="block">
                    <Card className="p-6 hover:border-primary transition-colors cursor-pointer h-full">
                      <div className="space-y-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{isCnRegion ? "CN" : "INTL"}</p>
                      </div>
                    </Card>
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section id="architecture" className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl font-bold">
                {lang === "en" ? "Your AI Business Infrastructure" : "你的 AI 商业基础设施"}
              </h2>
              <p className="text-xl text-muted-foreground">
                {lang === "en" ? "One OS. Infinite Possibilities." : "一个系统，无限可能"}
              </p>
            </div>

            <div className="relative">
              <div className="grid md:grid-cols-5 gap-4">
                {productLinks.slice(8).map((product, i) => {
                  const href = isCnRegion ? product.cn : product.intl
                  return (
                    <a key={i} href={href} target="_blank" rel="noreferrer" className="block">
                      <Card className="p-6 text-center space-y-3 hover:scale-105 transition-transform h-full">
                        <div className="w-full h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Network className="w-8 h-8 text-white" />
                        </div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{isCnRegion ? "CN" : "INTL"}</p>
                      </Card>
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="py-32 px-4">
          <div className="container mx-auto max-w-4xl text-center space-y-8">
            <h2 className="text-5xl font-bold text-balance">{t.cta.title}</h2>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/launch">
                  {t.cta.button}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/connect-capital">{lang === "en" ? "Connect Capital" : "对接资本"}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-12 px-4">
          <div className="container mx-auto max-w-6xl text-center space-y-2">
            <p className="text-xl font-bold">mornbusiness — {t.footer.tagline}</p>
            <p className="text-muted-foreground">{t.footer.subtitle}</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
