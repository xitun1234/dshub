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
      <DialogContent className="sm:max-w-[425px] bg-card-bg border-border text-foreground">
        <DialogHeader>
          <DialogTitle>{customer ? "Sửa Khách Hàng / Thầu" : "Thêm Khởi Tạo Mới"}</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Tên gọi</Label>
            <Input id="name" name="name" defaultValue={customer?.name ?? ""} className="col-span-3 bg-foreground/5" required />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Loại</Label>
            <select 
              id="role" 
              name="role" 
              defaultValue={customer?.role ?? CUSTOMER_DEFAULTS.role}
              className="col-span-3 flex h-9 w-full rounded-md border border-input bg-foreground/5 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="KHACH">Khách hàng (Người chơi)</option>
              <option value="THAU">Thầu (Người nhận phơi)</option>
            </select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isActive" className="text-right">Hoạt động</Label>
            <div className="col-span-3 flex items-center gap-3">
              <Switch id="isActive" checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} />
              <input type="hidden" name="isActive" value={isActive ? "on" : "off"} />
              <span className={`text-sm font-semibold ${isActive ? "text-emerald-500" : "text-muted-foreground"}`}>
                {isActive ? "Đang hoạt động (hiển thị khi Lên đơn)" : "Đã tắt (ẩn khỏi Lên đơn)"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ratePay" className="text-right text-teal-400 font-bold">Xác 2 số</Label>
            <Input id="ratePay" name="ratePay" type="number" step="0.01" defaultValue={customer?.ratePay ?? CUSTOMER_DEFAULTS.ratePay} className="col-span-3 bg-foreground/5" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ratePay3" className="text-right text-sky-400 font-bold">Xác 3 số</Label>
            <Input id="ratePay3" name="ratePay3" type="number" step="0.01" defaultValue={customer?.ratePay3 ?? CUSTOMER_DEFAULTS.ratePay3} className="col-span-3 bg-foreground/5" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ratePay4" className="text-right text-blue-400 font-bold">Xác 4 số</Label>
            <Input id="ratePay4" name="ratePay4" type="number" step="0.01" defaultValue={customer?.ratePay4 ?? CUSTOMER_DEFAULTS.ratePay4} className="col-span-3 bg-foreground/5" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rateWin" className="text-right text-rose-400 font-bold">Ăn 2 số</Label>
            <Input id="rateWin" name="rateWin" type="number" step="0.1" defaultValue={customer?.rateWin ?? CUSTOMER_DEFAULTS.rateWin} className="col-span-3 bg-foreground/5" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rateWin3" className="text-right text-amber-500 font-bold">Ăn 3 số</Label>
            <Input id="rateWin3" name="rateWin3" type="number" step="1" defaultValue={customer?.rateWin3 ?? CUSTOMER_DEFAULTS.rateWin3} className="col-span-3 bg-foreground/5" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rateWin4" className="text-right text-pink-500 font-bold">Ăn 4 số</Label>
            <Input id="rateWin4" name="rateWin4" type="number" step="1" defaultValue={customer?.rateWin4 ?? CUSTOMER_DEFAULTS.rateWin4} className="col-span-3 bg-foreground/5" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rateWinDaMNMT" className="text-right text-emerald-400 font-bold">Ăn đá MN-MT</Label>
            <Input id="rateWinDaMNMT" name="rateWinDaMNMT" type="number" step="1" defaultValue={customer?.rateWinDaMNMT ?? CUSTOMER_DEFAULTS.rateWinDaMNMT} className="col-span-3 bg-foreground/5" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rateWinDaMB" className="text-right text-purple-400 font-bold">Ăn đá MB</Label>
            <Input id="rateWinDaMB" name="rateWinDaMB" type="number" step="1" defaultValue={customer?.rateWinDaMB ?? CUSTOMER_DEFAULTS.rateWinDaMB} className="col-span-3 bg-foreground/5" required />
          </div>



          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu Thay Đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
