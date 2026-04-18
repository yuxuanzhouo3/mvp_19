import bcrypt from "bcryptjs"
import { dbAdapter } from "@/lib/db-adapter"
import { createAdminSession, setAdminSessionCookie, clearAdminSessionCookie } from "./session"
import type { LoginResult } from "./types"

export async function adminLogin(username: string, password: string): Promise<LoginResult> {
  try {
    const admins = await dbAdapter.loadRows("admins", { username })
    const data = admins[0]
    
    if (!data) return { success: false, error: "用户名或密码错误" }
    if (data.status !== "active") return { success: false, error: "账户已被禁用" }

    const valid = await bcrypt.compare(password, data.password_hash)
    if (!valid) return { success: false, error: "用户名或密码错误" }

    await dbAdapter.updateRow("admins", { _id: data._id }, { last_login_at: new Date().toISOString() })

    const session = createAdminSession(data._id || data.id, data.username, data.role)
    await setAdminSessionCookie(session)

    return { success: true, admin: data }
  } catch (e: any) {
    console.error("[adminLogin]", e)
    return { success: false, error: "登录失败，请稍后重试" }
  }
}

export async function adminLogout(): Promise<void> {
  await clearAdminSessionCookie()
}
