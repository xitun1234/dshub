import { isDaBetType } from "@/lib/bill-calculations"
import prisma from "@/lib/prisma"

export type ReportRegionKey = "MN" | "MT" | "MB"

type Settlement = {
  label: "Thu" | "Bù"
  amount: number
}

export type StatisticsReportWinningDetail = {
  betNumber: string
  betType: string
  winQuantity: number
  pricePerUnit: number
  points: number
  prize: number
  stations: string[]
}

export type StatisticsReportBill = {
  id: string
  rawContent: string
  totalPoints: number
  totalMoney: number
  totalInvestment: number
  totalWinningPoints: number
  totalPrize: number
  settlement: Settlement
}

export type StatisticsReportRegion = {
  key: ReportRegionKey
  name: string
  bills: StatisticsReportBill[]
  winningDetails: StatisticsReportWinningDetail[]
  totalPoints: number
  totalMoney: number
  totalInvestment: number
  totalPrize: number
  settlement: Settlement
}

export type StatisticsReport = {
  customer: {
    id: string
    name: string
    role: string
  }
  date: string
  regions: StatisticsReportRegion[]
  totalInvestment: number
  totalPrize: number
  settlement: Settlement
}

const REGION_CONFIG: Record<ReportRegionKey, string> = {
  MN: "Miền Nam",
  MT: "Miền Trung",
  MB: "Miền Bắc"
}

function getSettlement(role: string, investment: number, prize: number): Settlement {
  const balance = investment - prize
  const isContractor = role === "THAU"

  return {
    label: isContractor
      ? (balance >= 0 ? "Bù" : "Thu")
      : (balance >= 0 ? "Thu" : "Bù"),
    amount: Math.abs(balance)
  }
}

function parseStations(value: string | null): string[] {
  if (!value) return []

  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed)
      ? parsed.filter((station): station is string => typeof station === "string")
      : typeof parsed === "string" ? [parsed] : []
  } catch {
    return []
  }
}

function getDetailPoints(detail: {
  betType: string
  stationCount: number
  pricePerUnit: number
}) {
  const typeMultiplier = isDaBetType(detail.betType) ? 2 : 1
  return detail.pricePerUnit * detail.stationCount * typeMultiplier
}

function getWinRate(
  detail: { betNumber: string; betType: string },
  region: ReportRegionKey,
  rates: {
    rateWin: number
    rateWin3: number
    rateWin4: number
    rateWinDaMNMT: number
    rateWinDaMB: number
  }
) {
  const type = detail.betType.toLowerCase().replace(/đ/g, "d")
  const isFourDigit = detail.betNumber.length === 4
  const isThreeDigit = detail.betNumber.length === 3 ||
    type.includes("bacang") ||
    type.includes("xc") ||
    type.includes("xiuchu")

  if (isFourDigit) return rates.rateWin4
  if (isThreeDigit) return rates.rateWin3
  if (isDaBetType(detail.betType)) {
    return region === "MB" ? rates.rateWinDaMB : rates.rateWinDaMNMT
  }
  return rates.rateWin
}

export async function getStatisticsReport(
  userId: string,
  customerId: string,
  date: string
): Promise<StatisticsReport | null> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, userId },
    select: {
      id: true,
      name: true,
      role: true,
      rateWin: true,
      rateWin3: true,
      rateWin4: true,
      rateWinDaMNMT: true,
      rateWinDaMB: true,
      bills: {
        where: { date },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          region: true,
          rawContent: true,
          totalInvestment: true,
          totalPrize: true,
          details: {
            orderBy: { createdAt: "asc" },
            select: {
              betNumber: true,
              betType: true,
              stationCount: true,
              multiplier: true,
              pricePerUnit: true,
              isWin: true,
              winQuantity: true,
              winStations: true
            }
          }
        }
      }
    }
  })

  if (!customer) return null

  const regions = (Object.keys(REGION_CONFIG) as ReportRegionKey[]).flatMap(regionKey => {
    const regionBills = customer.bills.filter(bill => bill.region === regionKey)
    if (regionBills.length === 0) return []

    const bills = regionBills.map(bill => {
      const totalPoints = bill.details.reduce(
        (total, detail) => total + getDetailPoints(detail),
        0
      )
      const totalMoney = bill.details.reduce(
        (total, detail) => total + (getDetailPoints(detail) * detail.multiplier),
        0
      )

      const totalWinningPoints = bill.details.reduce(
        (total, detail) => total + (detail.pricePerUnit * detail.winQuantity),
        0
      )

      return {
        id: bill.id,
        rawContent: bill.rawContent,
        totalPoints,
        totalMoney,
        totalInvestment: bill.totalInvestment,
        totalWinningPoints,
        totalPrize: bill.totalPrize,
        settlement: getSettlement(customer.role, bill.totalInvestment, bill.totalPrize)
      }
    })

    const winningDetails = regionBills.flatMap(bill =>
      bill.details
        .filter(detail => detail.winQuantity > 0)
        .map(detail => {
          const winRate = getWinRate(detail, regionKey, customer)
          return {
            betNumber: detail.betNumber,
            betType: detail.betType,
            winQuantity: detail.winQuantity,
            pricePerUnit: detail.pricePerUnit,
            points: detail.pricePerUnit * detail.winQuantity,
            prize: detail.pricePerUnit * detail.winQuantity * winRate,
            stations: parseStations(detail.winStations)
          }
        })
    )

    const totalPoints = bills.reduce((total, bill) => total + bill.totalPoints, 0)
    const totalMoney = bills.reduce((total, bill) => total + bill.totalMoney, 0)
    const totalInvestment = bills.reduce((total, bill) => total + bill.totalInvestment, 0)
    const totalPrize = bills.reduce((total, bill) => total + bill.totalPrize, 0)

    return [{
      key: regionKey,
      name: REGION_CONFIG[regionKey],
      bills,
      winningDetails,
      totalPoints,
      totalMoney,
      totalInvestment,
      totalPrize,
      settlement: getSettlement(customer.role, totalInvestment, totalPrize)
    }]
  })

  const totalInvestment = regions.reduce((total, region) => total + region.totalInvestment, 0)
  const totalPrize = regions.reduce((total, region) => total + region.totalPrize, 0)

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      role: customer.role
    },
    date,
    regions,
    totalInvestment,
    totalPrize,
    settlement: getSettlement(customer.role, totalInvestment, totalPrize)
  }
}

function estimateWrappedLines(value: string) {
  return value.split("\n").reduce(
    (total, line) => total + Math.max(1, Math.ceil(line.length / 72)),
    0
  )
}

export function estimateStatisticsReportHeight(report: StatisticsReport) {
  const contentHeight = report.regions.reduce((total, region) => {
    const billsHeight = region.bills.reduce(
      (billTotal, bill) => billTotal + 220 + (estimateWrappedLines(bill.rawContent) * 28),
      0
    )
    const winnersHeight = Math.max(90, region.winningDetails.length * 52)
    return total + 180 + billsHeight + winnersHeight
  }, 0)

  return 620 + contentHeight + (report.regions.length * 56)
}
