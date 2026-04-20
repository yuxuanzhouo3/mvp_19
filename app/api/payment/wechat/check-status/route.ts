import { NextRequest, NextResponse } from "next/server"
import { createSign } from "crypto"
import { randomUUID } from "crypto"

function getPrivateKey() {
  let raw = process.env.WECHAT_PAY_PRIVATE_KEY || ""
  console.log("[WechatPay] 原始私钥长度:", raw.length)
  
  raw = raw.replace(/\\n/g, "\n").replace(/\r/g, "").trim()
  
  if (raw.startsWith("-----BEGIN PRIVATE KEY-----") && raw.endsWith("-----END PRIVATE KEY-----")) {
    const content = raw.slice(27, -25).trim()
    const lines = []
    for (let i = 0; i < content.length; i += 64) {
      lines.push(content.slice(i, i + 64))
    }
    raw = "-----BEGIN PRIVATE KEY-----\n" + lines.join("\n") + "\n-----END PRIVATE KEY-----"
  } else if (!raw.includes("-----BEGIN PRIVATE KEY-----")) {
    const lines = []
    for (let i = 0; i < raw.length; i += 64) {
      lines.push(raw.slice(i, i + 64))
    }
    raw = "-----BEGIN PRIVATE KEY-----\n" + lines.join("\n") + "\n-----END PRIVATE KEY-----"
  }
  
  console.log("[WechatPay] 处理后私钥长度:", raw.length)
  return raw
}

function sign(message: string) {
  const s = createSign("RSA-SHA256")
  s.update(message)
  return s.sign(getPrivateKey(), "base64")
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
