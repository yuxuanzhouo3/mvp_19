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

    // 调用微信支付查询订单接口
    const apiUrl = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${outTradeNo}`
    const authorization = buildAuthorization("GET", apiUrl, "")

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": authorization,
        "Accept": "application/json",
      },
    })

    const data = await res.json()
    if (!res.ok) {
      console.error("[WechatPay Query] 查询订单失败:", data)
      return NextResponse.json({ ok: false, message: data.message || "查询微信支付订单失败" }, { status: 500 })
    }

    // 转换微信支付状态为前端期望的格式
    let status = data.trade_state
    if (status === 'SUCCESS') {
      status = 'paid'
    } else if (['NOTPAY', 'USERPAYING'].includes(status)) {
      status = 'unpaid'
    }
    return NextResponse.json({ ok: true, status })
  } catch (e: any) {
    console.error("[wechat check status]", e)
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
