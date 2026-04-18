/**
 * 创建初始管理员账号（CloudBase 版本）
 * 运行: node scripts/create-admin.js
 */

const fs = require('fs')
const path = require('path')

// 手动解析 .env.local
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8')
envFile.split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
})

const bcrypt = require('bcryptjs')

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123456'

// 简单模拟 dbAdapter 的 CloudBase 连接
const cloudbase = require('@cloudbase/node-sdk')

const app = cloudbase.init({
  env: process.env.CLOUDBASE_ENV_ID,
  secretId: process.env.TENCENT_SECRET_ID,
  secretKey: process.env.TENCENT_SECRET_KEY
})

const db = app.database()

async function main() {
  console.log('正在创建管理员账号...')
  console.log('用户名:', ADMIN_USERNAME)

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  const now = new Date().toISOString()

  try {
    // 先检查是否已存在
    const { data: existingAdmins } = await db.collection('admins').where({
      username: ADMIN_USERNAME
    }).get()

    if (existingAdmins && existingAdmins.length > 0) {
      // 更新已存在的管理员
      const adminId = existingAdmins[0]._id || existingAdmins[0].id
      await db.collection('admins').doc(adminId).update({
        password_hash: hash,
        role: 'super_admin',
        status: 'active',
        updated_at: now
      })
      console.log('✅ 管理员账号已更新')
    } else {
      // 创建新管理员
      await db.collection('admins').add({
        username: ADMIN_USERNAME,
        password_hash: hash,
        role: 'super_admin',
        status: 'active',
        created_at: now,
        updated_at: now
      })
      console.log('✅ 管理员账号创建成功')
    }

    console.log('')
    console.log('登录地址: /admin/login')
    console.log('用户名:', ADMIN_USERNAME)
    console.log('密码:', ADMIN_PASSWORD)
    console.log('')
    console.log('⚠️  请尽快在后台修改默认密码！')

  } catch (error) {
    console.error('❌ 创建失败:', error.message)
    process.exit(1)
  }
}

main()
