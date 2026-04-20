import { NextRequest, NextResponse } from "next/server"

// 检查微信支付状态
export async function POST(req: NextRequest) {
  try {
    const { outTradeNo } = await req.json()
    if (!outTradeNo) {
      return NextResponse.json({ ok: false, message: "订单号缺失" }, { status: 400 })
    }

    // 这里应该调用微信支付的查询订单接口
    // 由于是示例，我们返回模拟数据
    // 实际项目中应该使用微信支付 SDK 查询真实状态
    
    // 模拟支付状态，实际应该调用微信API
    const mockStatus = Math.random() > 0.7 ? 'SUCCESS' : 'NOTPAY'
    
    return NextResponse.json({ ok: true, status: mockStatus })
  } catch (e: any) {
    console.error("[wechat check status]", e)
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
