import { NextRequest, NextResponse } from "next/server"
import { createSign } from "crypto"
import { randomUUID } from "crypto"

function getPrivateKey() {
  const raw = process.env.WECHAT_PAY_PRIVATE_KEY || ""
  return raw.replace(/\n/g, "\n")
}

function sign(message: string) {
  const sign = createSign("RSA-SHA256")
  sign.update(message)
  return sign.sign(getPrivateKey(), "base64")
}

function buildAuthorization(method: string, url: string, body: string) {
  const mchId = process.env.WECHAT_PAY_MCH_ID!
  const serialNo = process.env.WECHAT_PAY_SERIAL_NO!
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = randomUUID().replace(/-/g, "").slice(0, 32)
  const urlObj = new URL(url)
  const canonicalUrl = urlObj.pathname + (urlObj.search || "")
  const message = `${method}\n${canonicalUrl}\n${timestamp}\n${nonce}\n${body}\n`
  const signature = sign(message)
  return `WECHATPAY2-SHA256-RSA2048 mchid="${mchId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${serialNo}",signature="${signature}"`
}

// 检查微信支付状态
export async function POST(req: NextRequest) {
  try {
    const { outTradeNo } = await req.json()
    if (!outTradeNo) {
      return NextResponse.json({ ok: false, message: "订单号缺失" }, { status: 400 })
    }

    // 调用微信支付查询订单接口（需要添加 mchid 查询参数）
    const mchId = process.env.WECHAT_PAY_MCH_ID!
    const apiUrl = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${mchId}`
    const authorization = buildAuthorization("GET", apiUrl, "")

    console.log("[WechatPay Query] 查询订单:", outTradeNo)
    console.log("[WechatPay Query] API URL:", apiUrl)

    try {
      const res = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Authorization": authorization,
          "Accept": "application/json",
        },
      })

      console.log("[WechatPay Query] 响应状态:", res.status)
      const data = await res.json()
      console.log("[WechatPay Query] 响应数据:", data)

      if (!res.ok) {
        console.error("[WechatPay Query] 查询订单失败:", data)
        return NextResponse.json({ ok: false, message: data.message || "查询微信支付订单失败" }, { status: 500 })
      }

      // 转换微信支付状态为前端期望的格式
      let status = data.trade_state
      console.log("[WechatPay Query] 原始状态:", status)
      if (status === 'SUCCESS') {
        status = 'paid'
      } else if (['NOTPAY', 'USERPAYING'].includes(status)) {
        status = 'unpaid'
      }
      console.log("[WechatPay Query] 转换后状态:", status)
      return NextResponse.json({ ok: true, status, originalStatus: data.trade_state, outTradeNo })
    } catch (error) {
      console.error("[WechatPay Query] 网络错误:", error)
      return NextResponse.json({ ok: false, message: "网络错误，无法查询订单状态" }, { status: 500 })
    }
  } catch (e: any) {
    console.error("[wechat check status]", e)
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
