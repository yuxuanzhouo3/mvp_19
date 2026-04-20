import { NextRequest, NextResponse } from "next/server"
import { createSign } from "crypto"
import { randomUUID } from "crypto"

function getPrivateKey() {
  let raw = process.env.WECHAT_PAY_PRIVATE_KEY || ""
  console.log("[WechatPay] 原始私钥长度:", raw.length)
  
  // 只处理转义字符，保留原始格式
  raw = raw.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\r/g, "")
  
  console.log("[WechatPay] 处理转义字符后长度:", raw.length)
  console.log("[WechatPay] 使用标准格式的私钥")
  
  return raw
}

function sign(message: string) {
  try {
    const privateKey = getPrivateKey()
    const s = createSign("RSA-SHA256")
    s.update(message)
    const signature = s.sign(privateKey, "base64")
    console.log("[WechatPay] 签名成功, 长度:", signature.length)
    return signature
  } catch (error) {
    console.error("[WechatPay] 签名错误:", error)
    throw error
  }
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
    console.log("[WechatPay Query] 查询订单:", outTradeNo)
    
    try {
      const authorization = buildAuthorization("GET", apiUrl, "")
      console.log("[WechatPay Query] 授权头长度:", authorization.length)
      
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
    } catch (authError) {
      console.error("[WechatPay Query] 授权错误:", authError)
      return NextResponse.json({ ok: false, message: "查询授权失败: " + (authError instanceof Error ? authError.message : "未知错误") }, { status: 500 })
    }
  } catch (e: any) {
    console.error("[WechatPay Query] 错误:", e)
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
