import { getDailyBills } from "@/lib/bills"
import { getCustomers } from "@/lib/customers"
import { requireUser } from "@/lib/auth"
import { getParserConfigs } from "@/lib/stations"
import { CustomerTabs } from "./components/customer-tabs"
import { TicketForm } from "./components/ticket-form"

const REGIONS = new Set(["MN", "MT", "MB"])

export default async function NewTicketPage(props: {
  searchParams: Promise<{ region?: string, customer?: string, date?: string }>
}) {
  const resolvedSearchParams = await props.searchParams
  const user = await requireUser()
  const currentRegion = REGIONS.has(resolvedSearchParams.region || "")
    ? resolvedSearchParams.region as "MN" | "MT" | "MB"
    : "MN"
  const today = new Date().toISOString().split("T")[0]
  const currentDate = /^\d{4}-\d{2}-\d{2}$/.test(resolvedSearchParams.date || "")
    ? resolvedSearchParams.date!
    : today

  const [allCustomers, parserConfig, dailyBills] = await Promise.all([
    getCustomers(user.id),
    getParserConfigs(),
    getDailyBills(user.id, currentDate)
  ])
  const customers = allCustomers.filter(customer => customer.isActive)

  const activeCustomer = customers.find(customer => customer.id === resolvedSearchParams.customer) || customers[0]
  const customerMap = new Map(customers.map(customer => [customer.id, customer]))
  const regionalSummaries: Record<string, Record<string, {
    name: string
    role: string
    totalPoints: number
    winPoints: number
    totalInvestment: number
    totalPrize: number
  }>> = { MN: {}, MT: {}, MB: {} }

  dailyBills.forEach(bill => {
    const customer = customerMap.get(bill.customerId)
    if (!customer || !regionalSummaries[bill.region]) return

    const totalPoints = bill.details.reduce((total, detail) => {
      const type = detail.betType.toLowerCase().replace(/đ/g, "d")
      const isDaOrXien = type === "da" || type.includes("xien") || type === "x" || type === "d" || type === "dx"
      const numberCount = detail.betNumber.split(/[-_,]+/).filter(Boolean).length
      return total + (isDaOrXien
        ? detail.pricePerUnit * 2 * (detail.stationCount || 1)
        : detail.pricePerUnit * (detail.stationCount || 1) * numberCount)
    }, 0)
    const winPoints = bill.details.reduce(
      (total, detail) => total + (detail.isWin ? detail.pricePerUnit * detail.winQuantity : 0),
      0
    )

    const summary = regionalSummaries[bill.region][bill.customerId] ?? {
      name: customer.name,
      role: customer.role,
      totalPoints: 0,
      winPoints: 0,
      totalInvestment: 0,
      totalPrize: 0
    }

    summary.totalPoints += totalPoints
    summary.winPoints += winPoints
    summary.totalInvestment += bill.totalInvestment || 0
    summary.totalPrize += bill.totalPrize || 0
    regionalSummaries[bill.region][bill.customerId] = summary
  })

  const customerBills = activeCustomer
    ? dailyBills
        .filter(bill => bill.customerId === activeCustomer.id)
        .map(bill => ({ ...bill, customer: activeCustomer }))
    : []

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dò Số & Tính Tiền</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý phơi số cho từng Khách / Thầu riêng biệt.
        </p>
      </div>

      {customers.length > 0 && (
        <CustomerTabs
          customers={customers}
          activeCustomerId={activeCustomer?.id}
          initialRegion={currentRegion}
          initialDate={currentDate}
        />
      )}

      {activeCustomer ? (
        <TicketForm
          customer={activeCustomer}
          initialRegion={currentRegion}
          bills={customerBills}
          customers={customers}
          initialDate={currentDate}
          parserConfig={parserConfig}
          regionalSummaries={regionalSummaries}
        />
      ) : (
        <div className="py-12 text-center text-muted-foreground border border-border border-dashed rounded-2xl bg-card/50">
          Vui lòng tạo ít nhất 1 khách hàng / thầu để tiếp tục.
        </div>
      )}
    </div>
  )
}
