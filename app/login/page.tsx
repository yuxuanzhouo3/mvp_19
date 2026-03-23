"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto max-w-md px-4 py-24">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>Use your email and password to access your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const email = String(formData.get("email") ?? "")
                const password = String(formData.get("password") ?? "")

                if (!email || !password) {
                  toast({ title: "Missing fields", description: "Please fill in email and password.", variant: "destructive" })
                  return
                }

                try {
                  setLoading(true)
                  const res = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                  })
                  const data = (await res.json()) as { message?: string }

                  if (!res.ok) {
                    throw new Error(data.message ?? "Login failed.")
                  }

                  toast({ title: "Success", description: data.message ?? "Logged in successfully." })
                } catch (error) {
                  toast({
                    title: "Request failed",
                    description: error instanceof Error ? error.message : "Unexpected error.",
                    variant: "destructive",
                  })
                } finally {
                  setLoading(false)
                }
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="you@company.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="Enter password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Sign in"}
              </Button>
            </form>
            <Link href="/" className="mt-5 inline-block text-sm text-primary underline-offset-4 hover:underline">
              Back to home
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
