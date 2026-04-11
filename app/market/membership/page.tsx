"use client"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Check, Zap, Crown, Loader2, Tag, AlertCircle, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"

const isCN = (process.env.NEXT_PUBLIC_SITE_REGION || "cn").toLowerCase() === "cn"

type Plan = {
  id: string; name: string; region: string; duration: string
  months: number; base_price: number; discount: number; final_price: number; ai_quota: number
}
const DURATION_LABEL: Record<string, string> = { monthly: "月度", quarterly: "季度", biannual: "半年", annual: "年度" }
const DISCOUNT_BADGE: Record<string, string | null> = { monthly: null, quarterly: "九折", biannual: "八折", annual: "七折" }

function MembershipContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromQuota = searchParams.get("from") === "quota"
  const [plans, setPlans] = useState<Plan[]>([])
  const [selected, setSelected] = useState<Plan | null>(null)
  const [discountCode, setDiscountCode] = useState("")
  const [discountRate, setDiscountRate] = useState<number | null>(null)
  const [discountChecking, setDiscountChecking] = useState(false)
  const [discountMsg, setDiscountMsg] = useState("")
  const [purchasing, setPurchasing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe")
  const [error, setError] = useState("")
  const region = isCN ? "cn" : "intl"
  const currency = isCN ? "¥" : "$"

  useEffect(() => {
    fetch(`/api/market/membership/plans?region=${region}`)
      .then(r => r.json())
      .then(j => { if (j.ok) { setPlans(j.data); setSelected(j.data.find((p: Plan) => p.duration === "monthly") || j.data[0]) } })
  }, [region])

  const checkDiscount = async () => {
    if (!discountCode.trim()) return
    setDiscountChecking(true); setDiscountMsg("")
    try {
      const res = await fetch("/api/market/membership/discount", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode.trim() }), credentials: "include",
      })
      const json = await res.json()
      if (json.ok) { setDiscountRate(json.discount); setDiscountMsg(`折扣码有效，额外 ${Math.round((1 - json.discount) * 100)}% 折扣`) }
      else { setDiscountRate(null); setDiscountMsg(json.message || "折扣码无效") }
    } catch { setDiscountMsg("验证失败") }
    finally { setDiscountChecking(false) }
  }

  const getFinalPrice = (plan: Plan) => {
    let price = plan.final_price
    if (discountRate) price = parseFloat((price * discountRate).toFixed(2))
    return price
  }

  const handlePurchase = async () => {
    if (!selected) return
    setPurchasing(true); setError("")
    try {
      const res = await fetch("/api/market/membership/purchase", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ planId: selected.id, discountCode: discountCode.trim() || undefined, paymentMethod }),
      })
      const json = await res.json()
      if (!json.ok) { setError(json.message || "购买失败"); return }
      if (json.type === "stripe" && json.url) { window.location.href = json.url }
      else if (json.type === "paypal" && json.orderId) {
        window.location.href = `https://www.sandbox.paypal.com/checkoutnow?token=${json.orderId}`
      }
    } catch { setError("购买失败，请重试") }
    finally { setPurchasing(false) }
  }

  const remainingCalls = selected ? Math.floor(selected.ai_quota / 0.0005) : 0

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-300/25 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-purple-300/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-cyan-300/15 rounded-full blur-3xl" />
      </div>
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={16} /> 返回
          </button>
          <Crown size={16} className="text-amber-500" />
          <span className="font-semibold text-slate-800">升级会员</span>
        </div>
      </header>
      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8 space-y-6">
        {fromQuota && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle size={16} className="text-orange-500" />
            <AlertDescription className="text-orange-700 ml-2">AI 搜索额度已用完，购买会员即可获得更多搜索次数</AlertDescription>
          </Alert>
        )}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">选择会员套餐</h1>
          <p className="text-slate-500 text-sm">购买后立即增加 AI 搜索额度，每次搜索约 0.0005 元</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {plans.map(plan => {
            const badge = DISCOUNT_BADGE[plan.duration]
            const isSelected = selected?.id === plan.id
            return (
              <button key={plan.id} onClick={() => setSelected(plan)}
                className={`relative rounded-2xl border-2 p-4 text-left transition-all ${isSelected ? "border-blue-500 bg-blue-50 shadow-md" : "border-slate-200 bg-white/80 backdrop-blur hover:border-blue-300"}`}>
                {badge && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-400 to-red-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>
                )}
                <div className="font-semibold text-slate-800 text-sm">{DURATION_LABEL[plan.duration] || plan.name}</div>
                <div className="mt-1">
                  <span className="text-xl font-bold text-blue-600">{currency}{getFinalPrice(plan)}</span>
                  {plan.discount < 1 && <span className="text-xs text-slate-400 line-through ml-1">{currency}{plan.base_price * plan.months}</span>}
                </div>
                <div className="text-xs text-slate-400 mt-1">约 {Math.floor(plan.ai_quota / 0.0005).toLocaleString()} 次搜索</div>
              </button>
            )
          })}
        </div>
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag size={15} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-700">折扣码（选填）</span>
          </div>
          <div className="flex gap-2">
            <Input value={discountCode} onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountRate(null); setDiscountMsg("") }}
              placeholder="输入折扣码" className="flex-1 rounded-xl h-10 text-sm uppercase bg-white/70" />
            <Button variant="outline" size="sm" onClick={checkDiscount} disabled={discountChecking || !discountCode.trim()} className="h-10 px-4 rounded-xl">
              {discountChecking ? <Loader2 size={14} className="animate-spin" /> : "验证"}
            </Button>
          </div>
          {discountMsg && <p className={`text-xs mt-2 ${discountRate ? "text-emerald-600" : "text-red-500"}`}>{discountMsg}</p>}
        </div>
        {selected && (
          <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 shadow-sm p-5 space-y-3">
            <h3 className="font-semibold text-slate-800">订单确认</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{DURATION_LABEL[selected.duration]}会员 x 1</span>
                <span>{currency}{selected.final_price}</span>
              </div>
              {discountRate && (
                <div className="flex justify-between text-emerald-600">
                  <span>折扣码优惠</span>
                  <span>-{currency}{(selected.final_price - getFinalPrice(selected)).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-800 pt-2 border-t border-slate-100">
                <span>实付金额</span>
                <span className="text-blue-600 text-lg">{currency}{getFinalPrice(selected)}</span>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-700">
              <Zap size={14} className="text-blue-500 flex-shrink-0" />
              购买后立即增加约 <span className="font-bold mx-1">{remainingCalls.toLocaleString()}</span> 次 AI 搜索额度
            </div>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">支付方式</p>
              <div className="flex gap-2">
                <button onClick={() => setPaymentMethod("stripe")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${paymentMethod === "stripe" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white/70 text-slate-500 hover:border-slate-300"}`}>
                  <CreditCard size={14} /> 信用卡 (Stripe)
                </button>
                <button onClick={() => setPaymentMethod("paypal")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${paymentMethod === "paypal" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white/70 text-slate-500 hover:border-slate-300"}`}>
                  PayPal
                </button>
              </div>
            </div>
            <Button onClick={handlePurchase} disabled={purchasing} className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-base font-semibold">
              {purchasing ? "处理中..." : `立即购买 ${currency}${getFinalPrice(selected)}`}
            </Button>
          </div>
        )}
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-3">会员权益</h3>
          <ul className="space-y-2">
            {["AI 智能搜索博主/企业/VC 联系方式", "联网实时抓取，突破平台封锁", "自动提取邮箱，一键发送合作邀约", "搜索结果保存 7 天", "额度永久有效，不过期"].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <Check size={14} className="text-emerald-500 flex-shrink-0" />{item}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}

export default function MembershipPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-hero flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <MembershipContent />
    </Suspense>
  )
}