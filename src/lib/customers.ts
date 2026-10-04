import { unstable_cache } from "next/cache"
import prisma from "./prisma"

export const getCustomersCacheTag = (userId: string) => `customers:${userId}`

export async function getCustomers(userId: string) {
  return unstable_cache(
    async () => prisma.customer.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        phone: true,
        isActive: true,
        ratePay: true,
        ratePay3: true,
        ratePay4: true,
        rateWin: true,
        rateWin3: true,
        rateWin4: true,
        rateWinDaMNMT: true,
        rateWinDaMB: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: "asc" }
    }),
    ["customers", userId],
    { tags: [getCustomersCacheTag(userId)], revalidate: false }
  )()
}
