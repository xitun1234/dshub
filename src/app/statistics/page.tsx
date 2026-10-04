import { getDailyStatisticsBills } from "@/lib/bills"
import { getCustomers } from "@/lib/customers"
import { requireUser } from "@/lib/auth"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CustomerStatCard } from "./components/customer-stat-card"

export const dynamic = 'force-dynamic'

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
  const user = await requireUser()

  // Default to today if no valid date was provided.
  const today = new Date().toISOString().split('T')[0]
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(resolvedSearchParams.date || "")
    ? resolvedSearchParams.date!
    : today

  const [customers, bills] = await Promise.all([
    getCustomers(user.id),
    getDailyStatisticsBills(user.id, selectedDate)
  ])
  const customerMap = new Map(customers.map(customer => [customer.id, customer]))

  type WinningDetail = {
    betNumber: string
    betType: string
    winQuantity: number
    pricePerUnit: number
    prize: number
    stations: string[]
  }

  const stats: Record<string, {
    id: string;
    name: string;
    isActive: boolean;
    role: string;
    MN: { inv: number; prize: number; winningDetails: WinningDetail[] };
    MT: { inv: number; prize: number; winningDetails: WinningDetail[] };
    MB: { inv: number; prize: number; winningDetails: WinningDetail[] };
    total: { inv: number; prize: number; profit: number };
  }> = {}

  customers.forEach((customer) => {
    stats[customer.id] = {
      id: customer.id,
      name: customer.name,
      isActive: customer.isActive,
      role: customer.role,
      MN: { inv: 0, prize: 0, winningDetails: [] },
      MT: { inv: 0, prize: 0, winningDetails: [] },
      MB: { inv: 0, prize: 0, winningDetails: [] },
      total: { inv: 0, prize: 0, profit: 0 }
    }
  })

  bills.forEach((bill) => {
    if (!stats[bill.customerId]) return

    const customer = customerMap.get(bill.customerId)
    if (!customer) return

    const region = bill.region as "MN" | "MT" | "MB"
    const inv = bill.totalInvestment || 0
    const prize = bill.totalPrize || 0
    
    if (stats[bill.customerId][region]) {
      stats[bill.customerId][region].inv += inv
      stats[bill.customerId][region].prize += prize

      if (bill.status === "processed" && bill.totalPrize > 0) {
        bill.details.forEach((detail) => {
          const typeNorm = detail.betType.toLowerCase().replace(/đ/g, "d");
          const is4D = detail.betNumber.length === 4;
          const is3D = detail.betNumber.length === 3 || typeNorm.includes("bacang") || typeNorm.includes("xc") || typeNorm.includes("xiuchu");
          const isDa = typeNorm === "da" || typeNorm.includes("xien") || typeNorm === "x" || typeNorm === "d" || typeNorm === "dx";

          let winRateApplied = customer.rateWin;
          if (is4D) winRateApplied = customer.rateWin4 ?? 5500;
          else if (is3D) winRateApplied = customer.rateWin3 ?? 650;
          else if (isDa) winRateApplied = bill.region === "MB" ? (customer.rateWinDaMB ?? 650) : (customer.rateWinDaMNMT ?? 650);

          const detailPrize = detail.winQuantity * detail.pricePerUnit * winRateApplied;
          let parsedStations: unknown = []
          if (detail.winStations) {
            try {
              parsedStations = JSON.parse(detail.winStations)
            } catch {
              parsedStations = []
            }
          }
          const stations = Array.isArray(parsedStations)
            ? parsedStations.filter((station): station is string => typeof station === "string")
            : typeof parsedStations === "string" ? [parsedStations] : []

          stats[bill.customerId][region].winningDetails.push({
            betNumber: detail.betNumber,
            betType: detail.betType,
            winQuantity: detail.winQuantity,
            pricePerUnit: detail.pricePerUnit,
            prize: detailPrize,
            stations
          });
        });
      }
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
              <label className="text-xs text-muted-foreground font-semibold px-1">Chọn ngày</label>
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
          <div className="p-12 text-center text-muted-foreground border border-border border-dashed rounded-2xl bg-card/50">
            Không có dữ liệu trong khoảng thời gian này.
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6 pb-20">
        {sortedStats.map((s) => {
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
            <CustomerStatCard key={s.id} stat={{ ...s, copyText }} />
          )
        })}
        </div>
      </div>
    </div>
  )
}
