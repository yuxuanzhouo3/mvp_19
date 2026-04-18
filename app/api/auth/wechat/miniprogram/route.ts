import { NextResponse } from "next/server"
import { dbAdapter } from "@/lib/db-adapter"

// 小程序登录 API
export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({ ok: false, message: "缺少登录凭证" }, { status: 400 })
    }

    // 1. 调用微信接口获取 openid 和 session_key
    const appId = process.env.NEXT_PUBLIC_WECHAT_APP_ID
    const appSecret = process.env.WECHAT_APP_SECRET
    
    if (!appId || !appSecret) {
      return NextResponse.json({ ok: false, message: "微信配置不完整" }, { status: 500 })
    }

    const wechatResponse = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
    )
    
    const wechatData = await wechatResponse.json()
    
    if (!wechatData.openid) {
      return NextResponse.json({ ok: false, message: "微信登录失败: " + (wechatData.errmsg || "未知错误") }, { status: 401 })
    }

    const { openid, session_key } = wechatData

    // 2. 查找或创建用户
    let user = null
    const existingUsers = await dbAdapter.loadRows("users", { wechat_openid: openid })
    
    if (existingUsers && existingUsers.length > 0) {
      user = existingUsers[0]
    } else {
      // 创建新用户
      user = await dbAdapter.insertRow("users", {
        wechat_openid: openid,
        nickname: "微信用户",
        avatar: "",
        email: `wx_${openid}@example.com`,
        created_at: new Date().toISOString()
      })
      
      // 创建用户市场资料
      await dbAdapter.insertRow("user_market_profiles", {
        user_id: user._id,
        balance: 0,
        points: 0,
        level: 1,
        created_at: new Date().toISOString()
      })
    }

    // 3. 生成用户信息
    const userInfo = {
      userId: user._id,
      nickname: user.nickname || "微信用户",
      avatar: user.avatar || "",
      email: user.email
    }

    return NextResponse.json({ ok: true, user: userInfo })

  } catch (error: any) {
    console.error("小程序登录失败:", error)
    return NextResponse.json({ ok: false, message: "登录失败: " + error.message }, { status: 500 })
  }
}
