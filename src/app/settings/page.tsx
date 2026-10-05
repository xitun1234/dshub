"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Database, LogOut, User, Settings as SettingsIcon, ShieldCheck, Sun, Moon, Monitor, Trash2 } from "lucide-react"
import { logoutUser } from "@/app/auth/actions"
import { deleteAllBills } from "./actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { useTheme } from "next-themes"
import { useEffect, useState, useTransition } from "react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  const handleDeleteAllBills = () => {
    if (isDeleting) return

    setDeleteMessage(null)
    startDeleteTransition(async () => {
      const result = await deleteAllBills()
      if (!result.success) {
        setDeleteMessage({ type: "error", text: result.error })
        return
      }

      setDeleteDialogOpen(false)
      setDeleteMessage({
        type: "success",
        text: result.count === 0
          ? "Tài khoản hiện không có phơi nào để xoá."
          : `Đã xoá vĩnh viễn ${result.count} phơi và toàn bộ chi tiết liên quan.`
      })
    })
  }

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
        <Card className="bg-card/90 border-border shadow-xl overflow-hidden backdrop-blur-sm">
          <CardHeader className="bg-foreground/[0.03] border-b border-border/40">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Sun className="w-5 h-5 text-orange-500" />
              Giao Diện
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center gap-2 p-6 rounded-2xl border-2 transition-all hvr-lift ${
                  theme === "light" 
                    ? "border-primary bg-primary/10 text-primary shadow-[0_8px_25px_rgba(254,78,0,0.2)]" 
                    : "border-border hover:border-primary-border bg-card backdrop-blur-sm hover:bg-primary-surface"
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
                    : "border-border hover:border-primary-border bg-card backdrop-blur-sm hover:bg-primary-surface"
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
                    : "border-border hover:border-primary-border bg-card backdrop-blur-sm hover:bg-primary-surface"
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
        <Card className="bg-card/90 border-border shadow-xl overflow-hidden backdrop-blur-sm">
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

        {/* Data Section */}
        <Card className="overflow-hidden border-rose-500/30 bg-card/90 shadow-xl backdrop-blur-sm">
          <CardHeader className="border-b border-rose-500/20 bg-rose-500/[0.06]">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Database className="h-5 w-5 text-rose-500" />
              Dữ Liệu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl space-y-1.5">
                <p className="text-sm font-bold text-foreground">Xoá toàn bộ dữ liệu phơi</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Xoá vĩnh viễn toàn bộ phơi và chi tiết phơi của các khách hàng thuộc tài khoản này.
                  Danh sách khách hàng, tỷ lệ và cấu hình hệ thống vẫn được giữ nguyên.
                </p>
              </div>

              <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !isDeleting && setDeleteDialogOpen(open)}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="h-11 shrink-0 gap-2 px-5 font-bold shadow-lg shadow-rose-500/20"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    XOÁ TOÀN BỘ DỮ LIỆU
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-border bg-card-bg text-foreground">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold text-rose-500">
                      <AlertCircle className="h-6 w-6" />
                      Xác nhận xoá toàn bộ phơi?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      Toàn bộ phơi và chi tiết phơi của các khách hàng thuộc tài khoản này sẽ bị xoá
                      vĩnh viễn. Khách hàng và cấu hình vẫn được giữ lại. Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                    {deleteMessage?.type === "error" && (
                      <div
                        role="alert"
                        className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400"
                      >
                        {deleteMessage.text}
                      </div>
                    )}
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border" disabled={isDeleting}>
                      Hủy bỏ
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(event) => {
                        event.preventDefault()
                        handleDeleteAllBills()
                      }}
                      disabled={isDeleting}
                      className="bg-rose-600 font-bold text-white hover:bg-rose-700"
                    >
                      {isDeleting ? "Đang xoá..." : "Xoá vĩnh viễn"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {deleteMessage?.type === "success" && (
              <div
                role="status"
                aria-live="polite"
                className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400"
              >
                {deleteMessage.text}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Version Info */}
        <div className="text-center py-8">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                XSKT Manager v1.0.4 • 2026
            </p>
        </div>
      </div>
    </div>
  )
}
