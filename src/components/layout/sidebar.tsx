"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Users,
  Ticket,
  Settings,
  BarChart3,
  LogOut,
  BookOpen,
  ShieldCheck
} from "lucide-react"
import { logoutUser } from "@/app/auth/actions"

const userNavigation = [
  { name: 'Khách hàng & Thầu', href: '/customers', icon: Users },
  { name: 'Lên Đơn (Phơi Số)', href: '/tickets/new', icon: Ticket },
  { name: 'Thống Kê 3 Miền', href: '/statistics', icon: BarChart3 },
  { name: 'Từ điển tên miền', href: '/dictionary', icon: BookOpen },
  { name: 'Cài Đặt', href: '/settings', icon: Settings },
]

const adminNavigation = [
  { name: 'Quản lý tài khoản', href: '/admin', icon: ShieldCheck }
]

export function Sidebar({ user }: { user?: { id: string, username: string, role?: string } }) {
  const pathname = usePathname()
  const isAdmin = user?.role === "admin"
  const navigation = isAdmin ? adminNavigation : userNavigation

  // Hide navigation on public authentication pages.
  if (pathname === "/login" || pathname === "/register" || pathname === "/auth/logout") {
    return null
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen flex-col justify-between border-e border-border/80 bg-sidebar-bg/95 backdrop-blur-xl min-w-64 max-w-64 transition-colors shadow-[8px_0_30px_var(--shadow-color)] z-20">
        <div className="px-4 py-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 mb-8 px-2 cursor-pointer group">
            <div className="relative flex shrink-0 items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary via-accent to-sky-500 text-white shadow-[0_8px_24px_var(--primary-glow)] border border-white/20 transition-transform group-hover:scale-105 group-hover:rotate-3 duration-300">
              <Ticket className="w-6 h-6 -rotate-12 drop-shadow-md" />
              <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-sidebar-bg"></span>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-xl font-black tracking-tighter leading-none text-foreground drop-shadow-sm flex items-center gap-1">
                XSKT <span className="bg-gradient-to-r from-primary to-rose-500 rounded px-1.5 py-0.5 text-[10px] text-white uppercase tracking-wider ml-1 mt-0.5">Pro</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mt-1.5">
                Quản lý
              </span>
            </div>
          </div>

          <ul className="mt-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-300 ease-in-out ${isActive
                      ? 'bg-gradient-to-r from-primary/15 via-primary/8 to-transparent text-primary border border-primary-border shadow-[0_8px_20px_var(--primary-glow)] scale-[1.01]'
                      : 'text-muted-foreground hover:bg-primary-surface hover:text-foreground hover:translate-x-1'
                      }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary drop-shadow-[0_0_5px_rgba(254,78,0,0.5)]' : ''}`} />
                    {item.name}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-6 bg-gradient-to-b from-primary to-accent rounded-full shadow-[0_0_10px_rgba(254,78,0,0.5)]" />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="px-4 py-6 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3 px-2 mb-4 group cursor-pointer glass-morphic p-3 rounded-2xl hvr-glow transition-all">
            <div className="relative flex shrink-0 items-center justify-center w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-primary/30 to-sky-500/30 border border-border shadow-lg group-hover:scale-105 transition-transform duration-300">
              <div className="relative w-full h-full rounded-full overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/avatar.png"
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Status Indicator */}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-sidebar-bg rounded-full shadow-sm"></div>
              {/* Glow ring */}
              <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-blue-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors">{user?.username || 'Người dùng'}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{isAdmin ? "Quản trị viên" : "Thành viên Pro"}</span>
            </div>
          </div>
          <button
            onClick={() => logoutUser()}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-500/20 active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 border-b border-border/80 bg-sidebar-bg/90 backdrop-blur-xl z-50 px-4 h-14 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent text-white shadow-sm">
            <Ticket className="w-4 h-4 -rotate-12" />
          </div>
          <span className="font-black text-foreground">
            XSKT <span className="bg-gradient-to-r from-primary to-rose-500 rounded px-1 py-0.5 text-[8px] text-white uppercase ml-0.5">Pro</span>
          </span>
        </div>
        <button
          onClick={() => logoutUser()}
          className="text-rose-500 p-2 hover:bg-rose-500/10 rounded-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border/80 bg-sidebar-bg/90 backdrop-blur-xl z-50 px-2 py-2 flex justify-around items-center h-16 shadow-[0_-8px_28px_var(--shadow-color)] pb-[env(safe-area-inset-bottom)]">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 gap-1 font-semibold ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(254,78,0,0.5)]' : ''}`} />
              <span className="text-[10px] leading-tight truncate w-full text-center">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
