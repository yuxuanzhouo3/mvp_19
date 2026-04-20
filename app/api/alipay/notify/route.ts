import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// 验证签名
function verifySign(data: any, publicKey: string) {
  const sign = data.sign
  delete data.sign
  delete data.sign_type
  
  const sorted = Object.keys(data).filter(k => data[k]).sort()
  const str = sorted.map(k => `${k}=${data[k]}`).join("&")
  
  const verifier = crypto.createVerify("RSA-SHA256")
  verifier.update(str, "utf8")
  return verifier.verify(publicKey, sign, "base64")
}

// 处理支付宝异步通知
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const data: any = {}
    formData.forEach((value, key) => {
      data[key] = value
    })

    let publicKey = process.env.ALIPAY_PUBLIC_KEY
    if (!publicKey) {
      return new Response("fail", { status: 200 })
    }

    // 确保公钥是正确的 PEM 格式
    if (publicKey) {
      // 如果已经包含 PEM 头，则直接使用
      if (!publicKey.includes("-----BEGIN")) {
        // 移除所有空格和换行符，然后重新格式化
        publicKey = publicKey.replace(/\s+/g, '')
        // 添加正确的 PEM 格式
        publicKey = `-----BEGIN PUBLIC KEY-----
${publicKey.match(/.{1,64}/g)?.join('\n') || publicKey}
-----END PUBLIC KEY-----`
      }
    }

    const isValid = verifySign(data, publicKey)
    if (!isValid) {
      return new Response("fail", { status: 200 })
    }

    const tradeStatus = data.trade_status
    if (tradeStatus === "TRADE_SUCCESS" || tradeStatus === "TRADE_FINISHED") {
      // 处理支付成功逻辑
      const outTradeNo = data.out_trade_no
      const totalAmount = data.total_amount
      const tradeNo = data.trade_no
      const passbackParams = data.passback_params

      try {
        const passback = JSON.parse(passbackParams)
        const { userId, planId } = passback

        // 这里可以添加处理订单的逻辑
        console.log("Alipay payment success:", {
          outTradeNo,
          tradeNo,
          totalAmount,
          userId,
          planId
        })

        // 增加用户额度等操作
        const { grantQuota } = await import("@/lib/db-adapter")
        const { isCN } = await import("@/lib/db-adapter")

        if (isCN()) {
          const cb = await import("@cloudbase/node-sdk")
          const app = cb.init({
            env: process.env.CLOUDBASE_ENV_ID!,
            secretId: process.env.CLOUDBASE_SECRET_ID!,
            secretKey: process.env.CLOUDBASE_SECRET_KEY!
          })
          const db = app.database()
          const r = await db.collection("membership_plans").where({ id: planId }).get()
          const plan = r?.data?.[0]

          if (plan) {
            await grantQuota(userId, plan.ai_quota)
            
            // 记录会员信息
            await db.collection("user_memberships").add({
              id: `mem-${Date.now()}`,
              user_id: userId,
              plan_id: planId,
              plan_name: plan.name,
              amount_paid: totalAmount,
              currency: "CNY",
              ai_quota_granted: plan.ai_quota,
              expires_at: new Date(Date.now() + plan.months * 30 * 24 * 60 * 60 * 1000).toISOString(),
              payment_method: "alipay",
              payment_id: tradeNo,
              status: "active",
              created_at: new Date().toISOString()
            })
          }
        }

      } catch (e) {
        console.error("Alipay notify processing error:", e)
      }

      return new Response("success", { status: 200 })
    }

    return new Response("fail", { status: 200 })
  } catch (e) {
    console.error("Alipay notify error:", e)
    return new Response("fail", { status: 200 })
  }
}
