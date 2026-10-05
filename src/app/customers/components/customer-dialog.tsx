"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CUSTOMER_DEFAULTS } from "@/lib/customer-defaults"
import { useState, useTransition } from "react"
import { createCustomer, updateCustomer } from "../actions"

type Customer = {
  id?: string
  name: string
  ratePay: number
  ratePay3?: number
  ratePay4?: number
  rateWin: number
  rateWin3?: number
  rateWin4?: number
  rateWinDaMNMT?: number
  rateWinDaMB?: number
  role: string
  isActive?: boolean
}

export function CustomerDialog({ customer, children }: { customer?: Customer, children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isActive, setIsActive] = useState(customer?.isActive ?? CUSTOMER_DEFAULTS.isActive)

  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      if (customer?.id) {
        await updateCustomer(customer.id, formData)
      } else {
        await createCustomer(formData)
      }
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-border bg-card-bg text-foreground sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{customer ? "Sửa Khách Hàng / Thầu" : "Thêm Khách Hàng / Thầu Mới"}</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="name" className="font-semibold sm:text-right">Tên gọi</Label>
            <Input id="name" name="name" defaultValue={customer?.name ?? ""} className="h-11 bg-background sm:col-span-3" required />
          </div>

          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="role" className="font-semibold sm:text-right">Loại</Label>
            <select
              id="role"
              name="role"
              defaultValue={customer?.role ?? CUSTOMER_DEFAULTS.role}
              className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base font-medium text-foreground shadow-sm transition-colors [color-scheme:light] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 dark:[color-scheme:dark] sm:col-span-3 sm:text-sm [&>option]:bg-background [&>option]:text-foreground"
            >
              <option value="KHACH">Khách hàng (Người chơi)</option>
              <option value="THAU">Thầu (Người nhận phơi)</option>
            </select>
          </div>

          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="isActive" className="font-semibold sm:text-right">Hoạt động</Label>
            <div className="flex min-h-11 items-center gap-3 sm:col-span-3">
              <Switch id="isActive" checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} />
              <input type="hidden" name="isActive" value={isActive ? "on" : "off"} />
              <span className={`text-sm font-semibold ${isActive ? "text-emerald-500" : "text-muted-foreground"}`}>
                {isActive ? "Đang hoạt động (hiển thị khi Lên đơn)" : "Đã tắt (ẩn khỏi Lên đơn)"}
              </span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="ratePay" className="font-bold text-teal-600 dark:text-teal-400 sm:text-right">Xác 2 số</Label>
            <Input id="ratePay" name="ratePay" type="number" step="0.01" defaultValue={customer?.ratePay ?? CUSTOMER_DEFAULTS.ratePay} className="h-11 bg-background sm:col-span-3" required />
          </div>
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="ratePay3" className="font-bold text-sky-600 dark:text-sky-400 sm:text-right">Xác 3 số</Label>
            <Input id="ratePay3" name="ratePay3" type="number" step="0.01" defaultValue={customer?.ratePay3 ?? CUSTOMER_DEFAULTS.ratePay3} className="h-11 bg-background sm:col-span-3" required />
          </div>
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="ratePay4" className="font-bold text-blue-600 dark:text-blue-400 sm:text-right">Xác 4 số</Label>
            <Input id="ratePay4" name="ratePay4" type="number" step="0.01" defaultValue={customer?.ratePay4 ?? CUSTOMER_DEFAULTS.ratePay4} className="h-11 bg-background sm:col-span-3" required />
          </div>
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="rateWin" className="font-bold text-rose-600 dark:text-rose-400 sm:text-right">Trúng 2 số</Label>
            <Input id="rateWin" name="rateWin" type="number" step="0.1" defaultValue={customer?.rateWin ?? CUSTOMER_DEFAULTS.rateWin} className="h-11 bg-background sm:col-span-3" required />
          </div>
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="rateWin3" className="font-bold text-amber-600 dark:text-amber-500 sm:text-right">Trúng 3 số</Label>
            <Input id="rateWin3" name="rateWin3" type="number" step="1" defaultValue={customer?.rateWin3 ?? CUSTOMER_DEFAULTS.rateWin3} className="h-11 bg-background sm:col-span-3" required />
          </div>
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="rateWin4" className="font-bold text-pink-600 dark:text-pink-500 sm:text-right">Trúng 4 số</Label>
            <Input id="rateWin4" name="rateWin4" type="number" step="1" defaultValue={customer?.rateWin4 ?? CUSTOMER_DEFAULTS.rateWin4} className="h-11 bg-background sm:col-span-3" required />
          </div>
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="rateWinDaMNMT" className="font-bold text-emerald-600 dark:text-emerald-400 sm:text-right">Đá xiên</Label>
            <Input id="rateWinDaMNMT" name="rateWinDaMNMT" type="number" step="1" defaultValue={customer?.rateWinDaMNMT ?? CUSTOMER_DEFAULTS.rateWinDaMNMT} className="h-11 bg-background sm:col-span-3" required />
          </div>
          <div className="grid gap-2 sm:grid-cols-4 sm:items-center sm:gap-4">
            <Label htmlFor="rateWinDaMB" className="font-bold text-purple-600 dark:text-purple-400 sm:text-right">Đá thẳng</Label>
            <Input id="rateWinDaMB" name="rateWinDaMB" type="number" step="1" defaultValue={customer?.rateWinDaMB ?? CUSTOMER_DEFAULTS.rateWinDaMB} className="h-11 bg-background sm:col-span-3" required />
          </div>



          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="h-11" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" className="h-11" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu Thay Đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
