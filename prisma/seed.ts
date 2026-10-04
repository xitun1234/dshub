import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  // Tạo Khách Hàng Cơ Bản: Khách A
  const customerA = await prisma.customer.upsert({
    where: { id: 'test-customer-a' },
    update: {},
    create: {
      id: 'test-customer-a',
      name: 'Khách A',
      phone: '0901234567',
      ratePay: 0.72,
      rateWin: 71,
    },
  })

  // Thầu 1
  const thau1 = await prisma.customer.upsert({
    where: { id: 'test-thau-1' },
    update: {},
    create: {
      id: 'test-thau-1',
      name: 'Thầu 1',
      phone: '0987654321',
      ratePay: 0.75,
      rateWin: 72,
    },
  })

  console.log({ customerA, thau1 })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
