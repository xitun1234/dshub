"use client"

import { useId, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronUp, KeyRound, Pencil, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CUSTOMER_DEFAULTS } from "@/lib/customer-defaults"
import {
  createManagedCustomer,
  createManagedUser,
  deleteManagedCustomer,
  deleteManagedUser,
  resetManagedUserPassword,
  updateManagedCustomer,
  updateManagedUser
} from "../actions"

type Customer = {
  id: string
  name: string
  phone: string | null
  role: string
  isActive: boolean
  ratePay: number
  ratePay3: number
  ratePay4: number
  rateWin: number
  rateWin3: number
  rateWin4: number
  rateWinDaMNMT: number
  rateWinDaMB: number
  billCount: number
}

type ManagedUser = {
  id: string
  username: string
  name: string | null
  createdAt: string
  billCount: number
  customers: Customer[]
}

type ActionResult = { success: true; message: string } | { success: false; error: string }

function ActionForm({
  action,
  children,
  submitLabel,
  onDone
}: {
  action: (formData: FormData) => Promise<ActionResult>
  children: React.ReactNode
  submitLabel: string
  onDone: (message: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await action(formData)
        if (!result.success) return setError(result.error)
        onDone(result.message)
      } catch {
        setError("Không thể kết nối tới máy chủ. Vui lòng thử lại.")
      }
    })
  }

  return (
    <form action={submit} className="space-y-4">
      {children}
      {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      <Button type="submit" disabled={isPending} className="h-11 w-full sm:w-auto">
        {isPending ? "Đang lưu..." : submitLabel}
      </Button>
    </form>
  )
}

function UserDialog({ user, onSuccess }: { user?: ManagedUser; onSuccess: (message: string) => void }) {
  const [open, setOpen] = useState(false)
  const done = (message: string) => {
    setOpen(false)
    onSuccess(message)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {user ? (
          <Button variant="outline" size="icon" className="h-11 w-11" aria-label={`Sửa tài khoản ${user.username}`}><Pencil className="h-4 w-4" /></Button>
        ) : (
          <Button className="h-11 gap-2"><Plus className="h-4 w-4" />Tạo tài khoản</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Sửa tài khoản" : "Tạo tài khoản mới"}</DialogTitle>
          <DialogDescription>Mật khẩu được mã hóa và không thể xem lại sau khi lưu.</DialogDescription>
        </DialogHeader>
        <ActionForm action={user ? updateManagedUser.bind(null, user.id) : createManagedUser} submitLabel={user ? "Lưu thay đổi" : "Tạo tài khoản"} onDone={done}>
          <div className="space-y-2"><Label htmlFor={`name-${user?.id ?? "new"}`}>Tên hiển thị</Label><Input id={`name-${user?.id ?? "new"}`} name="name" defaultValue={user?.name ?? ""} required className="h-11" /></div>
          <div className="space-y-2"><Label htmlFor={`username-${user?.id ?? "new"}`}>Tên đăng nhập</Label><Input id={`username-${user?.id ?? "new"}`} name="username" defaultValue={user?.username ?? ""} autoComplete="off" required className="h-11" /></div>
          {!user && <div className="space-y-2"><Label htmlFor="new-password">Mật khẩu</Label><Input id="new-password" name="password" type="password" minLength={6} autoComplete="new-password" required className="h-11" /></div>}
        </ActionForm>
      </DialogContent>
    </Dialog>
  )
}

function PasswordDialog({ user, onSuccess }: { user: ManagedUser; onSuccess: (message: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="icon" className="h-11 w-11" aria-label={`Đặt lại mật khẩu ${user.username}`}><KeyRound className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Đặt lại mật khẩu</DialogTitle><DialogDescription>Tạo mật khẩu mới cho tài khoản {user.username}. Mật khẩu cũ sẽ ngừng hoạt động.</DialogDescription></DialogHeader>
        <ActionForm action={resetManagedUserPassword.bind(null, user.id)} submitLabel="Đặt lại mật khẩu" onDone={(message) => { setOpen(false); onSuccess(message) }}>
          <div className="space-y-2"><Label htmlFor={`password-${user.id}`}>Mật khẩu mới</Label><Input id={`password-${user.id}`} name="password" type="password" minLength={6} autoComplete="new-password" required className="h-11" /></div>
        </ActionForm>
      </DialogContent>
    </Dialog>
  )
}

function CustomerFields({ customer }: { customer?: Customer }) {
  const generatedId = useId()
  const fieldSuffix = customer?.id ?? generatedId.replaceAll(":", "")
  const fields = [
    ["ratePay", "Xác 2 số", customer?.ratePay ?? CUSTOMER_DEFAULTS.ratePay, "0.01"],
    ["rateWin", "Trúng 2 số", customer?.rateWin ?? CUSTOMER_DEFAULTS.rateWin, "0.1"],
    ["ratePay3", "Xác 3 số", customer?.ratePay3 ?? CUSTOMER_DEFAULTS.ratePay3, "0.01"],
    ["rateWin3", "Trúng 3 số", customer?.rateWin3 ?? CUSTOMER_DEFAULTS.rateWin3, "1"],
    ["ratePay4", "Xác 4 số", customer?.ratePay4 ?? CUSTOMER_DEFAULTS.ratePay4, "0.01"],
    ["rateWin4", "Trúng 4 số", customer?.rateWin4 ?? CUSTOMER_DEFAULTS.rateWin4, "1"],
    ["rateWinDaMNMT", "Đá xiên", customer?.rateWinDaMNMT ?? CUSTOMER_DEFAULTS.rateWinDaMNMT, "1"],
    ["rateWinDaMB", "Đá thẳng", customer?.rateWinDaMB ?? CUSTOMER_DEFAULTS.rateWinDaMB, "1"]
  ] as const

  return (
    <>
      <div className="space-y-2"><Label htmlFor={`customer-name-${fieldSuffix}`}>Tên gọi</Label><Input id={`customer-name-${fieldSuffix}`} name="name" defaultValue={customer?.name ?? ""} required className="h-11" /></div>
      <div className="space-y-2"><Label htmlFor={`customer-phone-${fieldSuffix}`}>Số điện thoại</Label><Input id={`customer-phone-${fieldSuffix}`} name="phone" type="tel" defaultValue={customer?.phone ?? ""} autoComplete="tel" className="h-11" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor={`customer-role-${fieldSuffix}`}>Loại</Label><select id={`customer-role-${fieldSuffix}`} name="role" defaultValue={customer?.role ?? CUSTOMER_DEFAULTS.role} className="h-11 w-full rounded-md border border-input bg-background px-3 text-foreground"><option value="KHACH">Khách hàng</option><option value="THAU">Thầu</option></select></div>
        <div className="space-y-2"><Label htmlFor={`customer-status-${fieldSuffix}`}>Trạng thái</Label><select id={`customer-status-${fieldSuffix}`} name="isActive" defaultValue={(customer?.isActive ?? true) ? "on" : "off"} className="h-11 w-full rounded-md border border-input bg-background px-3 text-foreground"><option value="on">Đang hoạt động</option><option value="off">Đã tắt</option></select></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{fields.map(([name, label, defaultValue, step]) => { const id = `${name}-${fieldSuffix}`; return <div key={name} className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} name={name} type="number" step={step} defaultValue={defaultValue} required className="h-11" /></div> })}</div>
    </>
  )
}

function CustomerDialog({ userId, customer, onSuccess }: { userId: string; customer?: Customer; onSuccess: (message: string) => void }) {
  const [open, setOpen] = useState(false)
  const action = customer ? updateManagedCustomer.bind(null, customer.id, userId) : createManagedCustomer.bind(null, userId)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{customer ? <Button variant="outline" size="sm" className="h-10 gap-2"><Pencil className="h-3.5 w-3.5" />Sửa</Button> : <Button variant="outline" className="h-11 gap-2"><Plus className="h-4 w-4" />Thêm khách / thầu</Button>}</DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{customer ? "Sửa khách hàng / thầu" : "Thêm khách hàng / thầu"}</DialogTitle></DialogHeader>
        <ActionForm action={action} submitLabel={customer ? "Lưu thay đổi" : "Thêm mới"} onDone={(message) => { setOpen(false); onSuccess(message) }}><CustomerFields customer={customer} /></ActionForm>
      </DialogContent>
    </Dialog>
  )
}

function DeleteAction({ title, description, action, onSuccess, compact = false }: { title: string; description: string; action: () => Promise<ActionResult>; onSuccess: (message: string) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !isPending && setOpen(nextOpen)}>
      <AlertDialogTrigger asChild><Button variant="destructive" size={compact ? "sm" : "icon"} aria-label={compact ? undefined : title} className={compact ? "h-10 gap-2" : "h-11 w-11"}><Trash2 className="h-4 w-4" />{compact && "Xóa"}</Button></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription>{description}</AlertDialogDescription>{error && <p role="alert" className="mt-3 text-sm font-medium text-rose-500">{error}</p>}</AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={isPending}>Hủy bỏ</AlertDialogCancel><AlertDialogAction disabled={isPending} onClick={(event) => { event.preventDefault(); setError(null); startTransition(async () => { try { const result = await action(); if (!result.success) return setError(result.error); setOpen(false); onSuccess(result.message) } catch { setError("Không thể kết nối tới máy chủ. Vui lòng thử lại.") } }) }} className="bg-rose-600 text-white hover:bg-rose-700">{isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function AdminDashboard({ users }: { users: ManagedUser[] }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<string | null>(null)
  const customerCount = users.reduce((sum, user) => sum + user.customers.length, 0)
  const billCount = users.reduce((sum, user) => sum + user.billCount, 0)
  const done = (text: string) => { setMessage(text); router.refresh() }

  return (
    <div className="mx-auto w-full max-w-7xl p-4 pb-24 md:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-primary"><ShieldCheck className="h-6 w-6" /><span className="text-sm font-bold uppercase tracking-widest">Quản trị hệ thống</span></div><h1 className="text-3xl font-black tracking-tight">Quản lý tài khoản</h1><p className="mt-2 text-muted-foreground">Tạo tài khoản và quản lý khách hàng, thầu của từng người dùng.</p></div>
        <UserDialog onSuccess={done} />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Tài khoản</p><p className="mt-1 text-3xl font-black text-primary">{users.length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Khách / Thầu</p><p className="mt-1 text-3xl font-black text-emerald-600">{customerCount}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Phơi số</p><p className="mt-1 text-3xl font-black text-sky-600">{billCount}</p></CardContent></Card></div>
      {message && <div role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-400">{message}</div>}

      <div className="space-y-4">
        {users.length === 0 && <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">Chưa có tài khoản người dùng.</div>}
        {users.map(user => {
          const isOpen = !!expanded[user.id]
          return <Card key={user.id} className="overflow-hidden">
            <CardHeader className="bg-foreground/[0.03] p-4 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><button type="button" onClick={() => setExpanded(current => ({ ...current, [user.id]: !isOpen }))} className="flex min-w-0 items-center gap-3 text-left"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></span><span className="min-w-0"><CardTitle className="break-words text-lg">{user.name || user.username}</CardTitle><span className="text-sm text-muted-foreground">@{user.username} · {user.customers.length} khách/thầu · {user.billCount} phơi</span></span>{isOpen ? <ChevronUp className="h-5 w-5 shrink-0" /> : <ChevronDown className="h-5 w-5 shrink-0" />}</button><div className="flex flex-wrap gap-2"><UserDialog user={user} onSuccess={done} /><PasswordDialog user={user} onSuccess={done} /><DeleteAction title="Xóa tài khoản?" description={`Tài khoản ${user.username} cùng toàn bộ khách/thầu, phơi và chi tiết phơi sẽ bị xóa vĩnh viễn.`} action={() => deleteManagedUser(user.id)} onSuccess={done} /></div></div></CardHeader>
            {isOpen && <CardContent className="p-4 sm:p-5"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold">Khách hàng & Thầu</h3><p className="text-sm text-muted-foreground">Dữ liệu thuộc riêng tài khoản @{user.username}</p></div><CustomerDialog userId={user.id} onSuccess={done} /></div><div className="grid gap-3 lg:grid-cols-2">{user.customers.length === 0 && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground lg:col-span-2">Chưa có khách hàng hoặc thầu.</p>}{user.customers.map(customer => <div key={customer.id} className="rounded-xl border border-border bg-background/50 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-bold">{customer.name}</p><p className="mt-1 text-xs text-muted-foreground">{customer.role === "THAU" ? "Thầu" : "Khách hàng"} · {customer.isActive ? "Đang hoạt động" : "Đã tắt"} · {customer.billCount} phơi{customer.phone ? ` · ${customer.phone}` : ""}</p></div><div className="flex shrink-0 gap-2"><CustomerDialog userId={user.id} customer={customer} onSuccess={done} /><DeleteAction compact title="Xóa khách hàng / thầu?" description={`${customer.name} và toàn bộ phơi liên quan sẽ bị xóa vĩnh viễn.`} action={() => deleteManagedCustomer(customer.id, user.id)} onSuccess={done} /></div></div><div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><span>Xác 2: <b>{customer.ratePay}</b></span><span>Trúng 2: <b>{customer.rateWin}</b></span><span>Xác 3: <b>{customer.ratePay3}</b></span><span>Trúng 3: <b>{customer.rateWin3}</b></span><span>Xác 4: <b>{customer.ratePay4}</b></span><span>Trúng 4: <b>{customer.rateWin4}</b></span><span>Đá xiên: <b>{customer.rateWinDaMNMT}</b></span><span>Đá thẳng: <b>{customer.rateWinDaMB}</b></span></div></div>)}</div></CardContent>}
          </Card>
        })}
      </div>
    </div>
  )
}
