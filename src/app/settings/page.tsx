"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, User, Settings as SettingsIcon, ShieldCheck, Sun, Moon, Monitor } from "lucide-react"
import { logoutUser } from "@/app/auth/actions"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          Cài Đặt Hệ Thống
        </h1>
        <p className="text-muted-foreground mt-2 font-medium">
          Quản lý tài khoản và các thiết lập cá nhân của bạn.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Appearance Section */}
        <Card className="bg-card-bg border-border/40 shadow-xl overflow-hidden backdrop-blur-sm border-none">
          <CardHeader className="bg-foreground/[0.03] border-b border-border/40">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Sun className="w-5 h-5 text-orange-500" />
              Giao Diện
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all hvr-lift ${
                  theme === "light" 
                    ? "border-primary bg-primary/10 text-primary shadow-[0_8px_25px_rgba(254,78,0,0.2)]" 
                    : "border-border/40 hover:border-border/60 bg-card-bg/50 backdrop-blur-sm"
                }`}
              >
                <div className={`p-3 rounded-xl ${theme === "light" ? "bg-primary text-white" : "bg-foreground/5"}`}>
                  <Sun className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em]">Sáng</span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all hvr-lift ${
                  theme === "dark" 
                    ? "border-primary bg-primary/10 text-primary shadow-[0_8px_25px_rgba(254,78,0,0.2)]" 
                    : "border-border/40 hover:border-border/60 bg-card-bg/50 backdrop-blur-sm"
                }`}
              >
                <div className={`p-3 rounded-xl ${theme === "dark" ? "bg-primary text-white" : "bg-foreground/5"}`}>
                  <Moon className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em]">Tối</span>
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all hvr-lift ${
                  theme === "system" 
                    ? "border-primary bg-primary/10 text-primary shadow-[0_8px_25px_rgba(254,78,0,0.2)]" 
                    : "border-border/40 hover:border-border/60 bg-card-bg/50 backdrop-blur-sm"
                }`}
              >
                <div className={`p-3 rounded-xl ${theme === "system" ? "bg-primary text-white" : "bg-foreground/5"}`}>
                  <Monitor className="w-6 h-6" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em]">Hệ Thống</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card className="bg-card-bg border-border/40 shadow-xl overflow-hidden backdrop-blur-sm border-none">
          <CardHeader className="bg-foreground/[0.03] border-b border-border/40">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <User className="w-5 h-5 text-blue-500" />
              Tài Khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Tư cách thành viên</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Bạn đang sử dụng phiên bản <strong>XSKT Pro</strong>
                </p>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                Đang hoạt động
              </div>
            </div>

            <div className="pt-4 border-t border-border/40">
              <p className="text-sm text-muted-foreground mb-4">
                Đăng xuất khỏi thiết bị này để bảo mật thông tin của bạn.
              </p>
              <Button 
                onClick={() => logoutUser()}
                variant="destructive"
                className="w-full sm:w-auto h-11 px-8 font-bold flex items-center gap-2 shadow-lg shadow-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                ĐĂNG XUẤT NGAY
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Version Info */}
        <div className="text-center py-8">
            <p className="text-[10px] font-bold text-foreground/20 uppercase tracking-[0.3em]">
                XSKT Manager v1.0.4 • 2026
            </p>
        </div>
      </div>
    </div>
  )
}
