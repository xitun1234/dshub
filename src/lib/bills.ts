import { unstable_cache } from "next/cache"
import prisma from "./prisma"

export const getBillsCacheTag = (userId: string) => `bills:${userId}`

export async function getDailyBills(userId: string, date: string) {
  return unstable_cache(
    async () => prisma.bill.findMany({
      where: { date, customer: { userId } },
    select: {
      id: true,
      customerId: true,
      rawContent: true,
      region: true,
      date: true,
      totalInvestment: true,
      totalPrize: true,
      status: true,
      details: {
        select: {
          id: true,
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
    },
      orderBy: { createdAt: "desc" }
    }),
    ["daily-bills", userId, date],
    { tags: [getBillsCacheTag(userId)], revalidate: false }
  )()
}

export async function getDailyStatisticsBills(userId: string, date: string) {
  return unstable_cache(
    async () => prisma.bill.findMany({
      where: { date, customer: { userId } },
    select: {
      customerId: true,
      region: true,
      totalInvestment: true,
      totalPrize: true,
      status: true,
      details: {
        where: { isWin: true },
        select: {
          betNumber: true,
          betType: true,
          winQuantity: true,
          pricePerUnit: true,
          winStations: true
        }
      }
      }
    }),
    ["daily-statistics-bills", userId, date],
    { tags: [getBillsCacheTag(userId)], revalidate: false }
  )()
}
