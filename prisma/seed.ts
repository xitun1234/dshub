import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const seedPassword = process.env.SEED_ADMIN_PASSWORD
  if (!seedPassword) {
    throw new Error("SEED_ADMIN_PASSWORD is required to seed the admin account")
  }

  const password = await bcrypt.hash(seedPassword, 10)
  await prisma.$transaction([
    prisma.user.updateMany({
      where: { role: "admin", username: { not: "admin" } },
      data: { role: "user" }
    }),
    prisma.user.upsert({
      where: { username: "admin" },
      update: {
        password,
        name: "Quản trị viên",
        role: "admin"
      },
      create: {
        username: "admin",
        password,
        name: "Quản trị viên",
        role: "admin"
      }
    })
  ])

  console.log("Admin account is ready")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async error => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
