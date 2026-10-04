import prisma from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CustomerStatCard } from "./components/customer-stat-card"

function formatMoney(amount: number): string {
  const absolute = Math.abs(Math.round(amount));
  if (absolute < 10000) {
    return absolute.toString();
  }
  return absolute.toLocaleString('vi-VN');
}

export default async function StatisticsPage(props: {
  searchParams: Promise<{ date?: string }>
}) {
  const resolvedSearchParams = await props.searchParams
  
  // Default to today if no date provided
  const today = new Date().toISOString().split('T')[0]
  const selectedDate = resolvedSearchParams.date || today

  // Fetch all active customers to show in stats - Sorted by creation date
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'asc' }
  })

  // Fetch bills for the selected date
  const bills = await prisma.bill.findMany({
    where: {
      date: selectedDate
    },
    include: {
      customer: true
    }
  })

  // Group stats by customer and region
  const stats: Record<string, {
    name: string;
    isActive: boolean;
    role: string;
    MN: { inv: number; prize: number };
    MT: { inv: number; prize: number };
    MB: { inv: number; prize: number };
    total: { inv: number; prize: number; profit: number };
  }> = {}
  
  ;(customers as any[]).forEach((c) => {
    stats[c.id] = {
      name: c.name,
      isActive: c.isActive,
      role: c.role,
      MN: { inv: 0, prize: 0 },
      MT: { inv: 0, prize: 0 },
      MB: { inv: 0, prize: 0 },
      total: { inv: 0, prize: 0, profit: 0 }
    }
  })

  bills.forEach((bill) => {
    if (!stats[bill.customerId]) return
    
    const region = bill.region as "MN" | "MT" | "MB"
    const inv = bill.totalInvestment || 0
    const prize = bill.totalPrize || 0
    
    if (stats[bill.customerId][region]) {
      stats[bill.customerId][region].inv += inv
      stats[bill.customerId][region].prize += prize
    }
    
    stats[bill.customerId].total.inv += inv
    stats[bill.customerId].total.prize += prize
  })

  // Calculate profit
  Object.keys(stats).forEach(id => {
    stats[id].MN.inv = Math.round(stats[id].MN.inv)
    stats[id].MT.inv = Math.round(stats[id].MT.inv)
    stats[id].MB.inv = Math.round(stats[id].MB.inv)
    stats[id].total.inv = stats[id].MN.inv + stats[id].MT.inv + stats[id].MB.inv

    stats[id].MN.prize = Math.round(stats[id].MN.prize)
    stats[id].MT.prize = Math.round(stats[id].MT.prize)
    stats[id].MB.prize = Math.round(stats[id].MB.prize)
    stats[id].total.prize = stats[id].MN.prize + stats[id].MT.prize + stats[id].MB.prize

    stats[id].total.profit = stats[id].total.inv - stats[id].total.prize
  })

  const sortedStats = Object.values(stats)
    .filter(s => s.total.inv > 0 || s.isActive)

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thống Kê 3 Miền</h1>
          <p className="text-muted-foreground mt-2">
            Theo dõi Vốn, Trúng, và Lợi Nhuận của từng Khách hàng / Thầu.
          </p>
        </div>
        
        <Card className="bg-card-bg border-border p-2">
          <form method="GET" className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-foreground/60 px-1">Chọn ngày</label>
              <input 
                type="date" 
                name="date" 
                defaultValue={selectedDate}
                className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
            <Button type="submit" className="bg-primary hover:bg-primary-light text-white h-9">
              Lọc
            </Button>
          </form>
        </Card>
      </div>

      <div className="space-y-6">
        {sortedStats.length === 0 && (
          <div className="p-12 text-center text-foreground/50 border border-border border-dashed rounded-lg bg-card-bg/20">
            Không có dữ liệu trong khoảng thời gian này.
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6 pb-20">
        {sortedStats.map((s, idx) => {
          let copyText = ""
          const isThau = s.role === 'THAU'
          
          const regions = [
            { key: 'MN', data: s.MN },
            { key: 'MT', data: s.MT },
            { key: 'MB', data: s.MB }
          ]
          
          regions.forEach(r => {
            if (r.data.inv > 0 || r.data.prize > 0) {
              const rProfit = r.data.inv - r.data.prize
              const rProfitWord = isThau ? (rProfit >= 0 ? 'Bù' : 'Thu') : (rProfit >= 0 ? 'Thu' : 'Bù')
              copyText += `${r.key} ${formatMoney(r.data.inv)} Trúng ${formatMoney(r.data.prize)} = ${rProfitWord} ${formatMoney(Math.abs(rProfit))}\n`
            }
          })
          
          const tProfit = s.total.profit;
          const profitWord = isThau ? (tProfit >= 0 ? 'Bù' : 'Thu') : (tProfit >= 0 ? 'Thu' : 'Bù')
          copyText += `Tổng ${profitWord} ${formatMoney(Math.abs(tProfit))}`
          
          return (
            <CustomerStatCard key={idx} stat={{...s, copyText} as any} />
          )
        })}
        </div>
      </div>
    </div>
  )
}
