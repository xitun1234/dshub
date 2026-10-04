"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface CustomerTab {
  id: string
  name: string
  ratePay: number
  rateWin: number
}

export function CustomerTabs({
  customers,
  activeCustomerId,
  initialRegion,
  initialDate
}: {
  customers: CustomerTab[]
  activeCustomerId?: string
  initialRegion: "MN" | "MT" | "MB"
  initialDate: string
}) {
  const searchParams = useSearchParams()

  return (
    <div className="flex flex-wrap gap-2 mb-8 pb-2">
      {customers.map(customer => {
        const isActive = activeCustomerId === customer.id
        const params = new URLSearchParams(searchParams.toString())
        params.set("customer", customer.id)
        const region = params.get("region")
        if (region !== "MN" && region !== "MT" && region !== "MB") {
          params.set("region", initialRegion)
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(params.get("date") || "")) {
          params.set("date", initialDate)
        }

        return (
          <Link
            key={customer.id}
            href={`/tickets/new?${params.toString()}`}
            className={`px-6 py-3 rounded-xl transition-all font-bold whitespace-nowrap border text-sm ${
              isActive
                ? "bg-gradient-to-br from-primary to-accent text-white border-primary-light shadow-[0_8px_20px_var(--primary-glow)] scale-105 z-10"
                : "bg-card/80 text-muted-foreground border-border hover:text-primary hover:bg-primary-surface hover:border-primary-border"
            }`}
          >
            {customer.name}
            <small className={`block text-[10px] mt-1 font-black tracking-wider uppercase ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
              Xác: {customer.ratePay || "0.72"} - Ăn: {customer.rateWin || "71"}
            </small>
          </Link>
        )
      })}
    </div>
  )
}
