import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { dbAdapter } from "@/lib/db-adapter"

export async function GET(req: NextRequest) {
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123456'

  try {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10)
    const now = new Date().toISOString()

    // 检查是否已存在
    const existingAdmins = await dbAdapter.loadRows("admins", { username: ADMIN_USERNAME })
    
    if (existingAdmins && existingAdmins.length > 0) {
      // 更新已存在的
      const adminId = existingAdmins[0]._id || existingAdmins[0].id
      await dbAdapter.updateRow("admins", { _id: adminId }, {
        password_hash: hash,
        role: 'super_admin',
        status: 'active',
        updated_at: now
      })
    } else {
      // 创建新的
      await dbAdapter.insertRow("admins", {
        username: ADMIN_USERNAME,
        password_hash: hash,
        role: 'super_admin',
        status: 'active',
        created_at: now,
        updated_at: now
      })
    }

    return NextResponse.json({
      ok: true,
      message: "管理员账号设置成功",
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      loginUrl: "/admin/login"
    })
  } catch (error: any) {
    console.error("Setup admin error:", error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
