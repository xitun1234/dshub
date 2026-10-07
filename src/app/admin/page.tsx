import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin-auth"
import { AdminDashboard } from "./components/admin-dashboard"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  await requireAdmin()
  const users = await prisma.user.findMany({
    where: { role: "user" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      name: true,
      createdAt: true,
      customers: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          ratePay: true,
          ratePay3: true,
          ratePay4: true,
          rateWin: true,
          rateWin3: true,
          rateWin4: true,
          rateWinDaMNMT: true,
          rateWinDaMB: true,
          _count: { select: { bills: true } }
        }
      }
    }
  })

  const data = users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    billCount: user.customers.reduce((total, customer) => total + customer._count.bills, 0),
    customers: user.customers.map(({ _count, ...customer }) => ({
      ...customer,
      billCount: _count.bills
    }))
  }))

  return <AdminDashboard users={data} />
}
