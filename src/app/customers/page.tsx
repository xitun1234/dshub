import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCustomers } from "@/lib/customers"
import { requireUser } from "@/lib/auth"
import { Edit, UserPlus } from "lucide-react"
import { CustomerDialog } from "./components/customer-dialog"
import { DeleteButton } from "./components/delete-button"

export default async function CustomersPage() {
  const user = await requireUser()
  const customers = await getCustomers(user.id)

  return (
    <div className="container mx-auto w-full min-w-0 max-w-6xl p-4 md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Quản lý Khách Hàng / Thầu</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý tỷ lệ Trúng / Xác và danh sách đối tác của bạn
          </p>
        </div>
        <CustomerDialog>
          <Button className="h-11 w-full gap-2 sm:w-auto">
            <UserPlus className="w-4 h-4" />
            Thêm Khách Hàng / Thầu
          </Button>
        </CustomerDialog>
      </div>

      <div className="space-y-4 md:hidden">
        {customers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card-bg px-4 py-12 text-center text-sm text-muted-foreground">
            Chưa có khách hàng nào.
          </div>
        ) : customers.map((customer) => (
          <article key={customer.id} className="overflow-hidden rounded-2xl border border-border bg-card-bg shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border/70 bg-foreground/[0.03] p-4">
              <div className="min-w-0">
                <h2 className="break-words text-lg font-bold text-foreground">{customer.name}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`rounded-md border px-2 py-1 text-xs font-bold ${
                    customer.role === "THAU"
                      ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  }`}>
                    {customer.role === "THAU" ? "Thầu" : "Khách hàng"}
                  </span>
                  <span className={`rounded-md border px-2 py-1 text-xs font-bold ${
                    customer.isActive !== false
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-border bg-muted text-muted-foreground"
                  }`}>
                    {customer.isActive !== false ? "Đang hoạt động" : "Đã tắt"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <CustomerDialog customer={customer}>
                  <Button variant="outline" size="icon" aria-label={`Sửa ${customer.name}`} className="h-11 w-11 border-border bg-card-bg hover:bg-primary/10 hover:text-primary">
                    <Edit className="h-4 w-4 text-blue-500" />
                  </Button>
                </CustomerDialog>
                <DeleteButton id={customer.id} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-4 min-[360px]:grid-cols-2">
              {[
                { label: "2 số", pay: `${(customer.ratePay * 100).toFixed(0)}%`, win: customer.rateWin, color: "text-rose-600 dark:text-rose-400" },
                { label: "3 số", pay: `${(customer.ratePay3 * 100).toFixed(0)}%`, win: customer.rateWin3, color: "text-amber-600 dark:text-amber-500" },
                { label: "4 số", pay: `${(customer.ratePay4 * 100).toFixed(0)}%`, win: customer.rateWin4, color: "text-pink-600 dark:text-pink-500" }
              ].map(rate => (
                <div key={rate.label} className="rounded-xl border border-border bg-background/60 p-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{rate.label}</p>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Xác</p>
                      <p className="text-base font-bold text-teal-600 dark:text-teal-400">{rate.pay}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Trúng</p>
                      <p className={`text-base font-bold ${rate.color}`}>{rate.win}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="rounded-xl border border-border bg-background/60 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Đá</p>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Đá xiên</p>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{customer.rateWinDaMNMT}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Đá thẳng</p>
                    <p className="text-base font-bold text-purple-600 dark:text-purple-400">{customer.rateWinDaMB}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden w-full min-w-0 rounded-md border border-border bg-card-bg shadow-sm md:block">
        <Table className="min-w-[1080px]">
          <TableHeader className="bg-foreground/5">
            <TableRow className="border-border hover:bg-foreground/5">
              <TableHead className="text-foreground/80">Tên Thầu/Khách</TableHead>
              <TableHead className="text-foreground/80">Vai trò</TableHead>
              <TableHead className="text-foreground/80">Trạng thái</TableHead>
              <TableHead className="text-foreground/80">Xác 2 số</TableHead>
              <TableHead className="text-foreground/80">Trúng 2 số</TableHead>
              <TableHead className="text-foreground/80">Xác 3 số</TableHead>
              <TableHead className="text-foreground/80">Trúng 3 số</TableHead>
              <TableHead className="text-foreground/80">Xác 4 số</TableHead>
              <TableHead className="text-foreground/80">Trúng 4 số</TableHead>
              <TableHead className="text-foreground/80">Đá xiên</TableHead>
              <TableHead className="text-foreground/80">Đá thẳng</TableHead>
              <TableHead className="text-right text-foreground/80">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                  Chưa có khách hàng nào.
                </TableCell>
              </TableRow>
            ) : customers.map((customer) => (
              <TableRow key={customer.id} className="border-border hover:bg-primary/5">
                <TableCell className="font-medium text-foreground">{customer.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${
                    customer.role === "THAU" 
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  }`}>
                    {customer.role === "THAU" ? "Thầu" : "Khách"}
                  </span>
                </TableCell>
                <TableCell>
                  {customer.isActive !== false ? (
                    <span className="px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-muted text-muted-foreground border border-border">
                      Đã tắt
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-teal-400 font-medium">
                  {(customer.ratePay * 100).toFixed(0)}%
                </TableCell>
                <TableCell className="text-rose-400 font-medium">{customer.rateWin}</TableCell>
                <TableCell className="text-sky-400 font-medium">
                  {(customer.ratePay3 * 100).toFixed(0)}%
                </TableCell>
                <TableCell className="text-amber-500 font-medium">{customer.rateWin3}</TableCell>
                <TableCell className="text-blue-400 font-medium">
                  {(customer.ratePay4 * 100).toFixed(0)}%
                </TableCell>
                <TableCell className="text-pink-500 font-medium">{customer.rateWin4}</TableCell>
                <TableCell className="text-emerald-400 font-medium">{customer.rateWinDaMNMT}</TableCell>
                <TableCell className="text-purple-400 font-medium">{customer.rateWinDaMB}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <CustomerDialog customer={customer}>
                      <Button variant="outline" size="icon" className="border-border bg-card-bg hover:bg-primary/10 hover:text-primary">
                        <Edit className="w-4 h-4 text-blue-400" />
                      </Button>
                    </CustomerDialog>
                    <DeleteButton id={customer.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
