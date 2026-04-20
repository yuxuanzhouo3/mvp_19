import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

function getUserId(req: NextRequest) {
  const cookie = req.headers.get("cookie") || ""
  const m = cookie.match(/(?:^|;\s*)market_user_id=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ""
}

// 生成签名
function sign(data: any, privateKey: string) {
  // 排除 sign 参数，但包含 sign_type
  const sorted = Object.keys(data)
    .filter(k => data[k] && k !== "sign")
    .sort()
  const str = sorted.map(k => `${k}=${data[k]}`).join("&")
  const signer = crypto.createSign("RSA-SHA256")
  signer.update(str, "utf8")
  try {
    return signer.sign(privateKey, "base64")
  } catch (e: any) {
    console.error("Sign error:", e.message)
    console.error("Private key first 100 chars:", privateKey.substring(0, 100))
    console.error("Private key format check:", privateKey.includes("-----BEGIN"))
    throw e
  }
}

// 构建支付宝请求参数
function buildAlipayParams(data: any, appId: string, privateKey: string) {
  const notifyUrl = process.env.ALIPAY_NOTIFY_URL
  const returnUrl = process.env.ALIPAY_RETURN_URL

  if (!notifyUrl || !returnUrl) {
    throw new Error("支付宝通知URL或返回URL未配置")
  }

  const params: Record<string, string> = {
    app_id: appId,
    method: "alipay.trade.page.pay",
    format: "JSON",
    charset: "utf-8",
    sign_type: "RSA2",
    timestamp: new Date().toISOString().substring(0, 19).replace("T", " "),
    version: "1.0",
    notify_url: notifyUrl!,
    return_url: returnUrl!,
    biz_content: JSON.stringify(data),
  }
  params.sign = sign(params, privateKey)
  return params
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })

  const { amount, planId, planName } = await req.json()
  if (!amount || !planId) return NextResponse.json({ ok: false, message: "参数缺失" }, { status: 400 })

  try {
    const appId = process.env.ALIPAY_APP_ID
    let privateKey = process.env.ALIPAY_PRIVATE_KEY
    const gateway = process.env.ALIPAY_GATEWAY

    // 确保私钥是正确的 PEM 格式
    if (privateKey) {
      // 如果已经包含 PEM 头，则直接使用
      if (!privateKey.includes("-----BEGIN")) {
        // 移除所有空格和换行符，然后重新格式化
        privateKey = privateKey.replace(/\s+/g, '')
        // 添加正确的 PEM 格式 - 支付宝通常使用 RSA 私钥格式
        privateKey = `-----BEGIN RSA PRIVATE KEY-----
${privateKey.match(/.{1,64}/g)?.join('\n') || privateKey}
-----END RSA PRIVATE KEY-----`
      }
    }

    if (!appId || !privateKey || !gateway) {
      return NextResponse.json({ ok: false, message: "支付宝配置缺失" }, { status: 500 })
    }

    const outTradeNo = `ALIPAY_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    const totalAmount = amount.toFixed(2)

    const bizContent = {
      out_trade_no: outTradeNo,
      product_code: "FAST_INSTANT_TRADE_PAY",
      total_amount: totalAmount,
      subject: `mornbusiness ${planName || ""}`,
      body: `会员套餐购买`,
      timeout_express: "30m",
      passback_params: JSON.stringify({ userId, planId, totalAmount }),
    }

    const params = buildAlipayParams(bizContent, appId, privateKey)
    const queryString = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&")

    const paymentUrl = `${gateway}?${queryString}`

    return NextResponse.json({ ok: true, url: paymentUrl, outTradeNo })
  } catch (e: any) {
    console.error("[alipay create order]", e)
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
