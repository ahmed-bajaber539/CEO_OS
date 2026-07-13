import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Mode = "login" | "signup"

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const resetForm = () => { setEmail(""); setPassword(""); setName("") }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        : error.message)
      setLoading(false)
    } else {
      toast.success("تم تسجيل الدخول بنجاح")
      navigate("/")
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() || undefined } },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success("تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.")
      setMode("login")
      resetForm()
      setLoading(false)
    }
  }

  const isLogin = mode === "login"

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">CEO OS</CardTitle>
          <CardDescription>{isLogin ? "سجل دخولك للمتابعة" : "أنشئ حسابًا جديدًا"}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="flex rounded-lg border bg-muted p-0.5 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); resetForm() }}
              className={cn(
                "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
                isLogin ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              دخول
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); resetForm() }}
              className={cn(
                "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
                !isLogin ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              حساب جديد
            </button>
          </div>

          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="grid gap-4">
            {!isLogin && (
              <div className="grid gap-2">
                <Label>الاسم</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسمك الكامل"
                  autoFocus
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
                autoFocus={isLogin}
              />
            </div>
            <div className="grid gap-2">
              <Label>كلمة المرور</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
            <Button type="submit" disabled={loading || !email.trim() || !password.trim()}>
              {loading ? "جاري المعالجة..." : isLogin ? "دخول" : "إنشاء حساب"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
