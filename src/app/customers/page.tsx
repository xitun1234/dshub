import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import prisma from "@/lib/prisma"
import { Edit, UserPlus } from "lucide-react"
import { CustomerDialog } from "./components/customer-dialog"
import { DeleteButton } from "./components/delete-button"

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'asc' } // Changed order to keep Thau creation logic sequential
  })

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Khách Hàng / Thầu</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý tỷ lệ Ăn / Xác và danh sách đối tác của bạn
          </p>
        </div>
        <CustomerDialog>
          <Button className="gap-2">
            <UserPlus className="w-4 h-4" />
            Thêm Khởi Tạo Mới
          </Button>
        </CustomerDialog>
      </div>

      <div className="rounded-md border border-border bg-card-bg overflow-x-auto shadow-sm pb-2">
        <Table className="min-w-[600px]">
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
              <TableHead className="text-foreground/80">Trúng đá MN-MT</TableHead>
              <TableHead className="text-foreground/80">Trúng đá MB</TableHead>
              <TableHead className="text-right text-foreground/80">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center text-foreground/50">
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
                    <span className="px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-foreground/10 text-foreground/50 border border-foreground/20">
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
                <TableCell className="text-amber-500 font-medium">{(customer as any).rateWin3}</TableCell>
                <TableCell className="text-blue-400 font-medium">
                  {(((customer as any).ratePay4 ?? 0.72) * 100).toFixed(0)}%
                </TableCell>
                <TableCell className="text-pink-500 font-medium">{(customer as any).rateWin4 ?? 5500}</TableCell>
                <TableCell className="text-emerald-400 font-medium">{(customer as any).rateWinDaMNMT}</TableCell>
                <TableCell className="text-purple-400 font-medium">{(customer as any).rateWinDaMB}</TableCell>
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
