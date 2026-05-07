import { NextRequest, NextResponse } from "next/server"

// 内存存储验证码（生产环境应用 Redis）
import { codeStore } from "@/lib/sms-store"
import { logger } from "@/lib/logger"

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js")
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST /api/auth/sms/send  { phone }
export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ ok: false, message: "请输入正确的手机号" }, { status: 400 })
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expires = Date.now() + 5 * 60 * 1000 // 5分钟有效
  codeStore.set(phone, { code, expires })

  // 实际发送短信（腾讯云 SMS）
  const secretId = process.env.TENCENT_SMS_SECRET_ID
  const secretKey = process.env.TENCENT_SMS_SECRET_KEY
  const sdkAppId = process.env.TENCENT_SMS_APP_ID
  const templateId = process.env.TENCENT_SMS_TEMPLATE_ID || "your_template_id"
  const signName = process.env.TENCENT_SMS_SIGN_NAME || process.env.TENCENT_SMS_SIGN || "mornbusiness"

  if (secretId && secretKey && sdkAppId) {
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const bodyObj = {
        SmsSdkAppId: sdkAppId,
        SignName: signName,
        TemplateId: templateId,
        TemplateParamSet: [code],
        PhoneNumberSet: [`+86${phone}`],
      }
      const bodyStr = JSON.stringify(bodyObj)
      const res = await fetch("https://sms.tencentcloudapi.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-TC-Action": "SendSms",
          "X-TC-Version": "2021-01-11",
          "X-TC-Timestamp": String(timestamp),
          "X-TC-Region": "ap-guangzhou",
          "Authorization": buildTencentAuth(secretId, secretKey, timestamp, bodyStr),
        },
        body: bodyStr,
      })
      const data = await res.json()
      logger.debug("[SMS response]", { code: data?.Response?.SendStatusSet?.[0]?.Code })
      const result = data?.Response
      if (result?.Error) {
        logger.error("[SMS error]", { code: result.Error.Code, message: result.Error.Message })
      } else {
        const sendStatus = result?.SendStatusSet?.[0]
        logger.debug("[SMS status]", { code: sendStatus?.Code, message: sendStatus?.Message })
      }
    } catch (e) {
      logger.error("[SMS send error]", e)
      // 发送失败不影响开发调试，继续返回成功（开发环境）
    }
  } else {
    // 开发环境：打印验证码到控制台
    logger.debug(`[SMS DEV] 手机号 ${phone} 验证码: ${code}`)
  }

  return NextResponse.json({ ok: true, message: "验证码已发送，5分钟内有效" })
}

function buildTencentAuth(secretId: string, secretKey: string, timestamp: number, body: string): string {
  const crypto = require("crypto")
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10)
  const service = "sms"
  const host = "sms.tencentcloudapi.com"

  // Step 1: canonical request
  const httpMethod = "POST"
  const canonicalUri = "/"
  const canonicalQueryString = ""
  const canonicalHeaders = `content-type:application/json\nhost:${host}\n`
  const signedHeaders = "content-type;host"
  const hashedPayload = crypto.createHash("sha256").update(body).digest("hex")
  const canonicalRequest = [httpMethod, canonicalUri, canonicalQueryString, canonicalHeaders, signedHeaders, hashedPayload].join("\n")

  // Step 2: string to sign
  const algorithm = "TC3-HMAC-SHA256"
  const credentialScope = `${date}/${service}/tc3_request`
  const hashedCanonicalRequest = crypto.createHash("sha256").update(canonicalRequest).digest("hex")
  const stringToSign = [algorithm, timestamp, credentialScope, hashedCanonicalRequest].join("\n")

  // Step 3: signing key
  const hmac = (key: Buffer | string, msg: string) => crypto.createHmac("sha256", key).update(msg).digest()
  const secretDate = hmac(`TC3${secretKey}`, date)
  const secretService = hmac(secretDate, service)
  const secretSigning = hmac(secretService, "tc3_request")
  const signature = hmac(secretSigning, stringToSign).toString("hex")

  return `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
}

// 导出供登录接口使用（已迁移到 @/lib/sms-store）
