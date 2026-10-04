import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
const prisma = new PrismaClient()

async function main() {
  const seedPassword = process.env.SEED_ADMIN_PASSWORD
  if (!seedPassword) {
    throw new Error('SEED_ADMIN_PASSWORD is required to seed the admin account')
  }

  const password = await bcrypt.hash(seedPassword, 10)
  const owner = await prisma.user.upsert({
    where: { username: 'nghia' },
    update: {},
    create: {
      username: 'nghia',
      password,
      name: 'Nghĩa Admin',
      role: 'admin'
    }
  })

  // Tạo Khách Hàng Cơ Bản: Khách A
  const customerA = await prisma.customer.upsert({
    where: { id: 'test-customer-a' },
    update: {},
    create: {
      id: 'test-customer-a',
      userId: owner.id,
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
      userId: owner.id,
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
