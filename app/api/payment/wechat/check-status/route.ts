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

    const mchId = process.env.WECHAT_PAY_MCH_ID!
    const apiUrl = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${outTradeNo}?mchid=${mchId}`
    const authorization = buildAuthorization("GET", apiUrl, "")

    console.log("[WechatPay Query] 查询订单:", outTradeNo)

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": authorization,
        "Accept": "application/json",
      },
    })

    const data = await res.json()
    console.log("[WechatPay Query] 响应:", res.status, data)

    if (!res.ok) {
      return NextResponse.json({ ok: false, message: data.message || "查询失败", status: res.status, detail: data }, { status: 200 })
    }

    let status = data.trade_state
    if (status === 'SUCCESS') {
      status = 'paid'
    } else if (['NOTPAY', 'USERPAYING', 'REFUND', 'PAYERROR'].includes(status)) {
      status = 'unpaid'
    }
    
    return NextResponse.json({ ok: true, status, originalStatus: data.trade_state })
  } catch (e: any) {
    console.error("[WechatPay Query] 错误:", e)
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
