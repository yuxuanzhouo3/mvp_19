import { dbAdapter } from "@/lib/db-adapter"

// 表名常量
const USERS_TABLE = "users"
const USER_PROFILES_TABLE = "user_profiles"
const USER_MARKET_PROFILES_TABLE = "user_market_profiles"

// 用户注册
export async function registerUser(email: string, password: string): Promise<{ ok: boolean; message: string; userId?: string }> {
  try {
    // 输入验证
    if (!email || !email.includes("@")) {
      return { ok: false, message: "请输入有效的邮箱地址" }
    }

    if (!password || password.length < 6) {
      return { ok: false, message: "密码长度至少6位" }
    }

    // 检查邮箱是否已存在
    const existingUsers = await dbAdapter.loadRows(USERS_TABLE, { email })
    if (existingUsers.length > 0) {
      return { ok: false, message: "该邮箱已被注册" }
    }

    // 准备时间戳（dbAdapter会自动添加，但这里需要用于其他表）
    const now = new Date().toISOString()

    // 1. 创建用户账号
    const userRow = await dbAdapter.insertRow(USERS_TABLE, {
      email,
      password, // 明文存储
      role: "user",
      created_at: now,
      updated_at: now
    })

    const userId = userRow._id // CloudBase 生成的 _id

    // 2. 创建基础资料
    const nickname = email.split("@")[0]
    await dbAdapter.insertRow(USER_PROFILES_TABLE, {
      id: userId,
      userId,
      nickname,
      avatar: "",
      phone: "",
      created_at: now
    })

    // 3. 创建市场资料
    await dbAdapter.insertRow(USER_MARKET_PROFILES_TABLE, {
      id: userId,
      userId,
      nickname,
      // 达人字段 - 初始未认证
      isInfluencerVerified: false,
      platform: "",
      platformAccount: "",
      platformHomeUrl: "",
      followers: "",
      cost: "",
      commission: "",
      // 商家字段 - 初始未认证
      isMerchantVerified: false,
      companyName: "",
      creditCode: "",
      businessLicenseUrl: "",
      brandName: "",
      contactPerson: "",
      contactPhone: "",
      industry: "",
      // 资产字段
      balance: 0,
      totalEarnings: 0,
      // 兼容字段（用于现有系统）
      avatar: "",
      fullName: "",
      idNumber: "",
      isRealNameVerified: false,
      isRealInfluencer: false,
      isRealMerchant: false,
      adViewsCount: 0,
      created_at: now,
      updated_at: now
    })

    console.log(`[Auth Service] 用户注册成功: ${email}, userId: ${userId}`)

    return { ok: true, message: "注册成功", userId }
  } catch (error: any) {
    console.error("[Auth Service] 注册错误:", error)

    // 处理数据库环境错误
    const errorMsg = error.message || "注册失败"
    if (errorMsg.includes("env not exists") || error.code === "INVALID_ENV") {
      return { ok: false, message: "数据库环境配置异常，请检查环境 ID 或联系管理员" }
    }

    return { ok: false, message: errorMsg }
  }
}

// 用户登录
export async function loginUser(email: string, password: string): Promise<{ ok: boolean; message: string; user?: any }> {
  try {
    // 输入验证
    if (!email || !email.includes("@")) {
      return { ok: false, message: "请输入有效的邮箱地址" }
    }

    if (!password) {
      return { ok: false, message: "请输入密码" }
    }

    // 查找用户
    const users = await dbAdapter.loadRows(USERS_TABLE, { email })
    if (users.length === 0) {
      return { ok: false, message: "用户不存在或密码错误" }
    }

    const user = users[0]

    // 明文密码比对
    if (user.password !== password) {
      return { ok: false, message: "用户不存在或密码错误" }
    }

    // 获取用户资料
    const [profile, marketProfile] = await Promise.all([
      dbAdapter.loadSingleRow(USER_PROFILES_TABLE, { userId: user._id }),
      dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { userId: user._id })
    ])

    const userData = {
      userId: user._id,
      email: user.email,
      role: user.role,
      profile: profile || {},
      marketProfile: marketProfile || {}
    }

    return { ok: true, message: "登录成功", user: userData }
  } catch (error: any) {
    console.error("[Auth Service] 登录错误:", error)

    // 处理数据库环境错误
    const errorMsg = error.message || "登录失败"
    if (errorMsg.includes("env not exists") || error.code === "INVALID_ENV") {
      return { ok: false, message: "数据库环境配置异常，请检查环境 ID 或联系管理员" }
    }

    return { ok: false, message: errorMsg }
  }
}

// 获取当前用户信息
export async function getCurrentUser(userId: string): Promise<{ ok: boolean; message: string; user?: any; profile?: any; marketProfile?: any }> {
  try {
    if (!userId) {
      return { ok: false, message: "用户未登录" }
    }

    const [user, profile, marketProfile] = await Promise.all([
      dbAdapter.loadSingleRow(USERS_TABLE, { _id: userId }),
      dbAdapter.loadSingleRow(USER_PROFILES_TABLE, { userId }),
      dbAdapter.loadSingleRow(USER_MARKET_PROFILES_TABLE, { userId })
    ])

    if (!user) {
      return { ok: false, message: "用户不存在" }
    }

    // 移除敏感信息
    const { password, ...safeUser } = user

    return {
      ok: true,
      message: "获取成功",
      user: safeUser,
      profile: profile || {},
      marketProfile: marketProfile || {}
    }
  } catch (error: any) {
    console.error("[Auth Service] 获取用户信息错误:", error)
    return { ok: false, message: error.message || "获取用户信息失败" }
  }
}

// 更新基础资料
export async function updateUserProfile(userId: string, data: { nickname?: string; avatar?: string; phone?: string }): Promise<{ ok: boolean; message: string }> {
  try {
    if (!userId) {
      return { ok: false, message: "用户未登录" }
    }

    const updateData: any = {}
    if (data.nickname !== undefined) updateData.nickname = data.nickname
    if (data.avatar !== undefined) updateData.avatar = data.avatar
    if (data.phone !== undefined) updateData.phone = data.phone

    if (Object.keys(updateData).length === 0) {
      return { ok: false, message: "没有需要更新的字段" }
    }

    console.log("[DEBUG updateUserProfile] userId:", userId, "updateData:", updateData)

    // 先查询看看记录是否存在
    const existingRows = await dbAdapter.loadRows(USER_PROFILES_TABLE, { userId })
    console.log("[DEBUG updateUserProfile] existing rows:", existingRows.length, existingRows)

    const result = await dbAdapter.updateRow(USER_PROFILES_TABLE, { userId }, updateData)
    console.log("[DEBUG updateUserProfile] update result:", result)

    if (!result) {
      return { ok: false, message: "用户资料不存在" }
    }

    return { ok: true, message: "资料更新成功" }
  } catch (error: any) {
    console.error("[Auth Service] 更新资料错误:", error)
    return { ok: false, message: error.message || "更新资料失败" }
  }
}

// 达人认证（自动通过）
export async function applyInfluencerVerification(userId: string, data: {
  platform: string
  platformAccount: string
  platformHomeUrl: string
  followers: string
  cost: string
  commission: string
}): Promise<{ ok: boolean; message: string }> {
  try {
    if (!userId) {
      return { ok: false, message: "用户未登录" }
    }

    const updateData = {
      isInfluencerVerified: true,
      platform: data.platform,
      platformAccount: data.platformAccount,
      platformHomeUrl: data.platformHomeUrl,
      followers: data.followers,
      cost: data.cost,
      commission: data.commission,
      updated_at: new Date().toISOString()
    }

    const result = await dbAdapter.updateRow(USER_MARKET_PROFILES_TABLE, { userId }, updateData)

    if (!result) {
      return { ok: false, message: "用户市场资料不存在" }
    }

    return { ok: true, message: "达人认证成功" }
  } catch (error: any) {
    console.error("[Auth Service] 达人认证错误:", error)
    return { ok: false, message: error.message || "达人认证失败" }
  }
}

// 商家认证（自动通过）
export async function applyMerchantVerification(userId: string, data: {
  companyName: string
  creditCode: string
  businessLicenseUrl: string
  brandName: string
  contactPerson: string
  contactPhone: string
  industry: string
}): Promise<{ ok: boolean; message: string }> {
  try {
    if (!userId) {
      return { ok: false, message: "用户未登录" }
    }

    const updateData = {
      isMerchantVerified: true,
      companyName: data.companyName,
      creditCode: data.creditCode,
      businessLicenseUrl: data.businessLicenseUrl,
      brandName: data.brandName,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      industry: data.industry,
      updated_at: new Date().toISOString()
    }

    const result = await dbAdapter.updateRow(USER_MARKET_PROFILES_TABLE, { userId }, updateData)

    if (!result) {
      return { ok: false, message: "用户市场资料不存在" }
    }

    return { ok: true, message: "商家认证成功" }
  } catch (error: any) {
    console.error("[Auth Service] 商家认证错误:", error)
    return { ok: false, message: error.message || "商家认证失败" }
  }
}

// 更新用户密码
export async function updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
  try {
    if (!userId) {
      return { ok: false, message: "用户未登录" }
    }

    if (!oldPassword || !newPassword) {
      return { ok: false, message: "请输入旧密码和新密码" }
    }

    if (newPassword.length < 6) {
      return { ok: false, message: "新密码长度至少6位" }
    }

    // 查找用户
    const user = await dbAdapter.loadSingleRow(USERS_TABLE, { _id: userId })
    if (!user) {
      return { ok: false, message: "用户不存在" }
    }

    // 验证旧密码（明文比对）
    if (user.password !== oldPassword) {
      return { ok: false, message: "旧密码错误" }
    }

    // 更新密码
    const result = await dbAdapter.updateRow(USERS_TABLE, { _id: userId }, {
      password: newPassword,
      updated_at: new Date().toISOString()
    })

    if (!result) {
      return { ok: false, message: "密码更新失败" }
    }

    return { ok: true, message: "密码更新成功" }
  } catch (error: any) {
    console.error("[Auth Service] 更新密码错误:", error)
    return { ok: false, message: error.message || "密码更新失败" }
  }
}