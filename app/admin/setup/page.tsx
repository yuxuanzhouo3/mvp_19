"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2 } from "lucide-react"
import bcrypt from "bcryptjs"
import { dbAdapter } from "@/lib/db-adapter"

export default function AdminSetupPage() {
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("Admin123456")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) return

    setLoading(true)
    setResult(null)

    try {
      const hash = await bcrypt.hash(password, 10)
      const now = new Date().toISOString()

      // 检查是否已存在
      const existingAdmins = await dbAdapter.loadRows("admins", { username })

      if (existingAdmins && existingAdmins.length > 0) {
        // 更新
        const adminId = existingAdmins[0]._id || existingAdmins[0].id
        await dbAdapter.updateRow("admins", { _id: adminId }, {
          password_hash: hash,
          role: 'super_admin',
          status: 'active',
          updated_at: now
        })
        setResult({ ok: true, message: "管理员账号已更新！" })
      } else {
        // 创建
        await dbAdapter.insertRow("admins", {
          username,
          password_hash: hash,
          role: 'super_admin',
          status: 'active',
          created_at: now,
          updated_at: now
        })
        setResult({ ok: true, message: "管理员账号创建成功！" })
      }
    } catch (error: any) {
      console.error("Setup error:", error)
      setResult({ ok: false, error: error.message || "创建失败" })
    } finally {
      setLoading(false)
    }
  }

  if (result?.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto w-12 h-12 text-green-500 mb-4" />
            <CardTitle className="text-2xl font-bold text-green-600">{result.message}</CardTitle>
            <CardDescription className="mt-4">
              <p className="mb-2"><strong>用户名：</strong>{username}</p>
              <p className="mb-4"><strong>密码：</strong>{password}</p>
              <p className="text-sm text-muted-foreground">请记录以上信息，然后点击下方按钮登录</p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/admin/login">前往登录</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">设置管理员账号</CardTitle>
          <CardDescription>输入管理员账号和密码</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {result?.error && (
              <Alert variant="destructive">
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />处理中...</> : "设置管理员账号"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
