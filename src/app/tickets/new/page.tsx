import prisma from "@/lib/prisma"
import { TicketForm } from "./components/ticket-form"
import Link from "next/link"
import { getParserConfigs } from "@/lib/stations"

export default async function NewTicketPage(props: {
  searchParams: Promise<{ region?: string, customer?: string, date?: string }>
}) {
  const resolvedSearchParams = await props.searchParams
  const currentRegion = resolvedSearchParams.region || "MN"
  const currentCustomerId = resolvedSearchParams.customer
  const currentDateParam = resolvedSearchParams.date || new Date().toISOString().split('T')[0]

  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      isActive: true,
      phone: true,
      ratePay: true,
      ratePay3: true,
      ratePay4: true,
      rateWin: true,
      rateWin3: true,
      rateWin4: true,
      rateWinDaMNMT: true,
      rateWinDaMB: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  })

  const activeCustomer = customers.find(c => c.id === currentCustomerId) || customers[0]

  const allBills = await prisma.bill.findMany({
    where: { 
      date: currentDateParam
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          rateWin: true,
          rateWin3: true,
          rateWin4: true,
          rateWinDaMNMT: true,
          rateWinDaMB: true,
          ratePay: true,
          ratePay3: true,
          ratePay4: true,
          role: true
        }
      },
      details: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const bills = allBills.filter(b => b.customerId === activeCustomer?.id)

  const parserConfig = await getParserConfigs()

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dò Số & Tính Tiền</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý phơi số cho từng Khách / Thầu riêng biệt.
        </p>
      </div>

      {/* TABS KHÁCH HÀNG */}
      {customers && customers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 pb-2">
          {customers.map(c => {
            const isActive = activeCustomer?.id === c.id
            return (
              <Link 
                key={c.id} 
                href={`/tickets/new?customer=${c.id}${currentRegion ? `&region=${currentRegion}` : ''}${currentDateParam ? `&date=${currentDateParam}` : ''}`}
              >
                <button 
                  className={`px-6 py-3 rounded-xl transition-all font-bold whitespace-nowrap border text-sm ${
                    isActive 
                    ? "bg-gradient-to-br from-primary to-accent text-white border-primary-light shadow-[0_8px_20px_var(--primary-glow)] scale-105 z-10" 
                    : "bg-card-bg/50 text-foreground/80 border-border/50 hover:text-primary hover:bg-primary/10 hover:border-primary/30"
                  }`}
                >
                  {c.name}
                  <small className={`block text-[10px] mt-1 font-black tracking-wider uppercase ${isActive ? "text-white/80" : "text-foreground/40"}`}>
                    Xác: {(c as any).ratePay || '0.72'} - Ăn: {(c as any).rateWin || '71'}
                  </small>
                </button>
              </Link>
            )
          })}
        </div>
      )}

      {activeCustomer ? (
        <>
          <TicketForm 
            customer={activeCustomer as any} 
            initialRegion={currentRegion as "MN"|"MT"|"MB"} 
            bills={bills as any} 
            allBills={allBills as any}
            customers={customers as any}
            initialDate={currentDateParam}
            parserConfig={parserConfig}
          />
        </>
      ) : (
        <div className="py-12 text-center text-foreground/50 border border-border border-dashed rounded-lg">
          Vui lòng tạo ít nhất 1 khách hàng / thầu để tiếp tục.
        </div>
      )}
    </div>
  )
}
