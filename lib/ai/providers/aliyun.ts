import type { AIRequest, AIResponse } from "../types"
import { priceOf } from "../pricing"
import { fetchWithTimeout, FetchTimeoutError } from "../../fetch-timeout"

const AI_TIMEOUT_MS = 60000 // AI 调用超时 60 秒

// Use DashScope "compatible-mode" OpenAI-style endpoint to simplify
export async function callAliyun(req: AIRequest): Promise<AIResponse> {
  const apiKey = process.env.ALIYUN_DASHSCOPE_API_KEY
  if (!apiKey) throw new Error("ALIYUN_DASHSCOPE_API_KEY not configured")

  const model = req.model || "qwen-coder-turbo"
  const defaultSystem =
    "You are a helpful coding assistant. Respond in the language preferred by the user. If the user asks for a specific language (e.g., '用中文回答', 'answer in English', '中文回复', '英文回答'), use that language. If no language preference is specified, use the same language as the user's question."
  const messages = [
    { role: "system", content: req.system ?? defaultSystem },
    { role: "user", content: req.input },
  ]

  let resp: Response
  try {
    resp = await fetchWithTimeout(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: req.temperature ?? 0.2,
          max_tokens: req.maxTokens ?? 400,
          messages,
        }),
      },
      AI_TIMEOUT_MS
    )
  } catch (err) {
    if (err instanceof FetchTimeoutError) {
      throw new Error("阿里云通义千问请求超时，请稍后重试")
    }
    throw err
  }

  if (!resp.ok) {
    throw new Error(await resp.text())
  }
  const data = await resp.json()
  const text = data?.choices?.[0]?.message?.content ?? ""
  const usage = data?.usage ?? { prompt_tokens: 600, completion_tokens: 300 }
  const cny = priceOf("aliyun", model, usage.prompt_tokens, usage.completion_tokens)
  return {
    text,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
    cnyCost: cny,
    provider: "aliyun",
  }
}

