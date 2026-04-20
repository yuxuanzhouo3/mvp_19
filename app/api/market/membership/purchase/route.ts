import { NextRequest, NextResponse } from "next/server"
import { randomUUID, createSign } from "crypto"

function getUserId(req: NextRequest) {
  const cookie = req.headers.get("cookie") || ""
  const m = cookie.match(/(?:^|;\s*)market_user_id=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ""
}

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function grantQuota(userId: string, aiQuota: number) {
  const { isCN } = await import("@/lib/db-adapter")
  if (isCN()) {
    const cb = await import("@cloudbase/node-sdk")
    const app = cb.init({ env: process.env.CLOUDBASE_ENV_ID!, secretId: process.env.CLOUDBASE_SECRET_ID!, secretKey: process.env.CLOUDBASE_SECRET_KEY! })
    const db = app.database()
    const r = await db.collection("ai_search_quota").where({ user_id: userId }).get()
    const quota = r?.data?.[0]
    const newBalance = parseFloat(((quota?.balance || 0) + aiQuota).toFixed(4))
    if (quota?._id) {
      await db.collection("ai_search_quota").doc(quota._id).update({ balance: newBalance, updated_at: new Date().toISOString() })
    } else {
      await db.collection("ai_search_quota").add({ id: `quota-${randomUUID().slice(0,8)}`, user_id: userId, balance: newBalance, total_used: 0, call_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    }
    return newBalance
  }
  const sb = await getSupabase()
  const { data: quota } = await sb.from("ai_search_quota").select("*").eq("user_id", userId).maybeSingle()
  const newBalance = parseFloat(((quota?.balance || 0) + aiQuota).toFixed(4))
  await sb.from("ai_search_quota").upsert({
    id: quota?.id || `quota-${randomUUID().slice(0, 8)}`,
    user_id: userId, balance: newBalance,
    total_used: quota?.total_used || 0,
    call_count: quota?.call_count || 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" })
  return newBalance
}

function getPrivateKey() {
  let raw = process.env.WECHAT_PAY_PRIVATE_KEY || ""
  console.log("[WechatPay] 原始私钥长度:", raw.length)
  
  // 移除所有的反斜杠、多余的空格和换行符
  raw = raw.replace(/\\n/g, "\n").replace(/\\r/g, "\r").replace(/\r/g, "")
  
  console.log("[WechatPay] 处理转义字符后长度:", raw.length)
  
  // 确保有正确的格式标记
  let hasBeginMarker = raw.includes("-----BEGIN PRIVATE KEY-----")
  let hasEndMarker = raw.includes("-----END PRIVATE KEY-----")
  
  let keyContent = raw
  
  // 如果有格式标记，提取内容
  if (hasBeginMarker && hasEndMarker) {
    const beginIndex = raw.indexOf("-----BEGIN PRIVATE KEY-----") + "-----BEGIN PRIVATE KEY-----".length
    const endIndex = raw.indexOf("-----END PRIVATE KEY-----")
    keyContent = raw.substring(beginIndex, endIndex).trim()
  } else if (hasBeginMarker) {
    const beginIndex = raw.indexOf("-----BEGIN PRIVATE KEY-----") + "-----BEGIN PRIVATE KEY-----".length
    keyContent = raw.substring(beginIndex).trim()
  } else if (hasEndMarker) {
    const endIndex = raw.indexOf("-----END PRIVATE KEY-----")
    keyContent = raw.substring(0, endIndex).trim()
  }
  
  // 移除所有空白字符
  keyContent = keyContent.replace(/\s/g, "")
  
  console.log("[WechatPay] 纯私钥内容长度:", keyContent.length)
  
  // 重新构建正确的PEM格式
  const lines = []
  for (let i = 0; i < keyContent.length; i += 64) {
    lines.push(keyContent.slice(i, i + 64))
  }
  const formattedKey = "-----BEGIN PRIVATE KEY-----\n" + lines.join("\n") + "\n-----END PRIVATE KEY-----"
  
  console.log("[WechatPay] 处理后私钥长度:", formattedKey.length)
  return formattedKey
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
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })

  const { planId, discountCode, paymentMethod = "stripe" } = await req.json()
  if (!planId) return NextResponse.json({ ok: false, message: "请选择套餐" }, { status: 400 })

  try {
    const { isCN } = await import("@/lib/db-adapter")

    let plan: any = null
    if (isCN()) {
      const cb = await import("@cloudbase/node-sdk")
      const app = cb.init({ env: process.env.CLOUDBASE_ENV_ID!, secretId: process.env.CLOUDBASE_SECRET_ID!, secretKey: process.env.CLOUDBASE_SECRET_KEY! })
      const db = app.database()
      const r = await db.collection("membership_plans").where({ id: planId }).get()
      plan = r?.data?.[0] || null
    } else {
      const sb = await getSupabase()
      const { data, error: planErr } = await sb.from("membership_plans").select("*").eq("id", planId).single()
      if (!planErr) plan = data
    }
    if (!plan) return NextResponse.json({ ok: false, message: "套餐不存在" }, { status: 404 })

    let finalPrice = parseFloat(plan.final_price)
    let usedCode: string | null = null

    if (discountCode?.trim()) {
      const upperCode = discountCode.trim().toUpperCase()
      let dc: any = null
      if (isCN()) {
        const cb = await import("@cloudbase/node-sdk")
        const app = cb.init({ env: process.env.CLOUDBASE_ENV_ID!, secretId: process.env.CLOUDBASE_SECRET_ID!, secretKey: process.env.CLOUDBASE_SECRET_KEY! })
        const db = app.database()
        const r = await db.collection("discount_codes").where({ code: upperCode }).get()
        dc = r?.data?.[0] || null
        if (dc && (dc.used_count || 0) < (dc.max_uses || 1) && (!dc.expires_at || new Date(dc.expires_at) > new Date())) {
          finalPrice = parseFloat((finalPrice * dc.discount).toFixed(2))
          usedCode = dc.code
          await db.collection("discount_codes").where({ code: upperCode }).update({ used_count: (dc.used_count || 0) + 1 })
        }
      } else {
        const sb = await getSupabase()
        const { data } = await sb.from("discount_codes").select("*").eq("code", upperCode).maybeSingle()
        dc = data
        if (dc && dc.used_count < dc.max_uses && (!dc.expires_at || new Date(dc.expires_at) > new Date())) {
          finalPrice = parseFloat((finalPrice * dc.discount).toFixed(2))
          usedCode = dc.code
          await sb.from("discount_codes").update({ used_count: (dc.used_count || 0) + 1 }).eq("code", dc.code)
        }
      }
    }

    const membershipId = `mem-${randomUUID().slice(0, 8)}`
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + plan.months)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    if (paymentMethod === "wechat_pay") {
      const appId = process.env.WECHAT_PAY_APP_ID!
      const mchId = process.env.WECHAT_PAY_MCH_ID!
      const outTradeNo = `WX${Date.now()}${randomUUID().slice(0, 6).toUpperCase()}`
      let totalAmount = Math.round(finalPrice * 100)
      if (totalAmount < 1) totalAmount = 1
      const body = JSON.stringify({
        appid: appId,
        mchid: mchId,
        description: plan.name || "mornbusiness 会员",
        out_trade_no: outTradeNo,
        notify_url: `${baseUrl}/api/payment/wechat/notify`,
        amount: { total: totalAmount, currency: "CNY" },
        attach: JSON.stringify({ userId, planId }),
      })
      const apiUrl = "https://api.mch.weixin.qq.com/v3/pay/transactions/native"
      console.log("[WechatPay] 创建订单, outTradeNo:", outTradeNo)
      console.log("[WechatPay] 请求体长度:", body.length)
      
      try {
        const authorization = buildAuthorization("POST", apiUrl, body)
        console.log("[WechatPay] 授权头长度:", authorization.length)
        
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authorization,
            "Accept": "application/json",
          },
          body,
        })
        
        const data = await res.json()
        console.log("[WechatPay] 响应:", res.status, data)
        
        if (!res.ok || !data.code_url) {
          console.error("[WechatPay] 创建订单失败:", data)
          throw new Error(data.message || "创建微信支付订单失败")
        }
        
        return NextResponse.json({ ok: true, type: "wechat", codeUrl: data.code_url, outTradeNo })
      } catch (authError) {
        console.error("[WechatPay] 授权错误:", authError)
        throw new Error("微信支付授权失败: " + (authError instanceof Error ? authError.message : "未知错误"))
      }
    }

    if (paymentMethod === "alipay") {
      const res = await fetch(`${baseUrl}/api/payment/alipay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: `market_user_id=${userId}` },
        body: JSON.stringify({ amount: finalPrice, planId, planName: plan.name }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.message || "创建支付宝订单失败")
      return NextResponse.json({ ok: true, type: "alipay", url: data.url, outTradeNo: data.outTradeNo })
    }

    if (paymentMethod === "stripe") {
      const Stripe = (await import("stripe")).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-03-25.dahlia" as any })
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
          currency: "usd",
          product_data: { name: `mornbusiness ${plan.name}` },
          unit_amount: Math.round(finalPrice * 100),
        },
        quantity: 1,
        }],
        mode: "payment",
        success_url: `${baseUrl}/market/membership/success?session_id={CHECKOUT_SESSION_ID}&membership_id=${membershipId}`,
        cancel_url: `${baseUrl}/market/membership?cancelled=1`,
        metadata: {
          userId, planId, membershipId,
          discountCode: usedCode || "",
          aiQuota: String(plan.ai_quota),
          planName: plan.name,
          months: String(plan.months),
          expiresAt: expiresAt.toISOString(),
        },
      })
      return NextResponse.json({ ok: true, type: "stripe", url: session.url })
    }

    if (paymentMethod === "paypal") {
      const PAYPAL_BASE = process.env.PAYPAL_ENVIRONMENT === "production"
        ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

      const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: "grant_type=client_credentials",
      })
      const { access_token } = await tokenRes.json()
      const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${access_token}` },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{
            amount: { currency_code: "USD", value: finalPrice.toFixed(2) },
            description: `mornbusiness ${plan.name}`,
            custom_id: JSON.stringify({ userId, planId, membershipId, aiQuota: plan.ai_quota, expiresAt: expiresAt.toISOString() }),
          }],
        }),
      })
      const order = await orderRes.json()
      if (!orderRes.ok) throw new Error(order.message || "创建 PayPal 订单失败")
      return NextResponse.json({ ok: true, type: "paypal", orderId: order.id })
    }

    return NextResponse.json({ ok: false, message: "不支持的支付方式" }, { status: 400 })
  } catch (e: any) {
    console.error("[membership purchase]", e)
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 })
  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ ok: false, message: "orderId 缺失" }, { status: 400 })

  try {
    const PAYPAL_BASE = process.env.PAYPAL_ENVIRONMENT === "production"
      ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

    const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    })
    const { access_token } = await tokenRes.json()

    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${access_token}` },
    })
    const capture = await captureRes.json()
    if (!captureRes.ok || capture.status !== "COMPLETED") throw new Error("PayPal 支付未完成")

    const customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id || ""
    let meta: any = {}
    try { meta = JSON.parse(customId) } catch {}

    const { planId, membershipId, aiQuota, expiresAt } = meta
    if (!planId) return NextResponse.json({ ok: false, message: "订单信息缺失" }, { status: 400 })

    const sb = await getSupabase()
    const { data: plan } = await sb.from("membership_plans").select("*").eq("id", planId).single()

    await sb.from("user_memberships").insert({
      id: membershipId || `mem-${randomUUID().slice(0, 8)}`,
      user_id: userId, plan_id: planId, plan_name: plan?.name,
      region: plan?.region, duration: plan?.duration,
      amount_paid: capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value,
      currency: "usd",
      ai_quota_granted: aiQuota || plan?.ai_quota,
      expires_at: expiresAt,
      payment_method: "paypal",
      payment_id: orderId,
      status: "active",
      created_at: new Date().toISOString(),
    })

    const newBalance = await grantQuota(userId, parseFloat(aiQuota || plan?.ai_quota || "0"))
    const remainingCalls = Math.floor(newBalance / 0.0005)

    return NextResponse.json({
      ok: true,
      message: `购买成功！已增加约 ${Math.floor(parseFloat(aiQuota || "0") / 0.0005).toLocaleString()} 次 AI 搜索额度`,
      newBalance, remainingCalls,
    })
  } catch (e: any) {
    console.error("[membership paypal capture]", e)
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 })
  }
}
