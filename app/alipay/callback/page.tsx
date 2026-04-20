"use client"
import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Loader2, AlertCircle } from "lucide-react"

function AlipayCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const outTradeNo = searchParams.get("out_trade_no")
  const tradeNo = searchParams.get("trade_no")
  const totalAmount = searchParams.get("total_amount")
  const tradeStatus = searchParams.get("trade_status")

  useEffect(() => {
    // 检查支付状态
    if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
      // 支付成功，重定向到成功页面
      setTimeout(() => {
        router.push("/market/membership/success?payment=alipay")
      }, 2000)
    } else {
      // 支付失败，重定向到会员页面
      setTimeout(() => {
        router.push("/market/membership?cancelled=1")
      }, 2000)
    }
  }, [tradeStatus, router])

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
          <Loader2 size={24} className="text-blue-600 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">处理支付结果</h2>
        <p className="text-slate-500">正在验证支付状态，请稍候...</p>
        {tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED" ? (
          <div className="mt-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <Check size={20} className="text-emerald-600" />
            </div>
            <p className="text-emerald-600 font-semibold">支付成功！</p>
            <p className="text-sm text-slate-500 mt-2">订单号：{outTradeNo}</p>
            <p className="text-sm text-slate-500">交易号：{tradeNo}</p>
            <p className="text-sm text-slate-500">金额：¥{totalAmount}</p>
          </div>
        ) : (
          <div className="mt-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-3">
              <AlertCircle size={20} className="text-red-600" />
            </div>
            <p className="text-red-600 font-semibold">支付失败或已取消</p>
            <p className="text-sm text-slate-500 mt-2">请重新尝试或选择其他支付方式</p>
          </div>
        )}
        <div className="mt-6 text-xs text-slate-400">
          页面将自动跳转...
        </div>
      </div>
    </div>
  )
}

export default function AlipayCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <AlipayCallbackContent />
    </Suspense>
  )
}
