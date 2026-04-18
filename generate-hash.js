const bcrypt = require('bcryptjs')

const password = 'Admin123456'
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('密码:', password)
  console.log('哈希值:', hash)
  console.log('\nJSON 数据:')
  console.log(JSON.stringify({
    "username": "admin",
    "password_hash": hash,
    "role": "super_admin",
    "status": "active",
    "created_at": new Date().toISOString(),
    "updated_at": new Date().toISOString()
  }, null, 2))
})
