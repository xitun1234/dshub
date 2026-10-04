"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getCustomers() {
  return prisma.customer.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createCustomer(formData: FormData) {
  const name = formData.get("name") as string
  const ratePay = parseFloat(formData.get("ratePay") as string)
  const ratePay3 = parseFloat(formData.get("ratePay3") as string) || 0.72
  const ratePay4 = parseFloat(formData.get("ratePay4") as string) || 0.72
  const rateWin = parseFloat(formData.get("rateWin") as string)
  const rateWin3 = parseFloat(formData.get("rateWin3") as string) || 650
  const rateWin4 = parseFloat(formData.get("rateWin4") as string) || 5500
  const rateWinDaMNMT = parseFloat(formData.get("rateWinDaMNMT") as string) || 650
  const rateWinDaMB = parseFloat(formData.get("rateWinDaMB") as string) || 650
  const role = formData.get("role") as string || "KHACH"
  const isActive = formData.get("isActive") !== "off"

  if (!name) return { error: "Name is required" }

  await prisma.customer.create({
    data: {
      name,
      ratePay,
      ratePay3,
      ratePay4,
      rateWin,
      rateWin3,
      rateWin4,
      rateWinDaMNMT,
      rateWinDaMB,
      role,
      isActive
    }
  })

  revalidatePath("/customers")
  revalidatePath("/tickets/new")
  return { success: true }
}

export async function updateCustomer(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const ratePay = parseFloat(formData.get("ratePay") as string)
  const ratePay3 = parseFloat(formData.get("ratePay3") as string) || 0.72
  const ratePay4 = parseFloat(formData.get("ratePay4") as string) || 0.72
  const rateWin = parseFloat(formData.get("rateWin") as string)
  const rateWin3 = parseFloat(formData.get("rateWin3") as string) || 650
  const rateWin4 = parseFloat(formData.get("rateWin4") as string) || 5500
  const rateWinDaMNMT = parseFloat(formData.get("rateWinDaMNMT") as string) || 650
  const rateWinDaMB = parseFloat(formData.get("rateWinDaMB") as string) || 650
  const role = formData.get("role") as string || "KHACH"
  const isActive = formData.get("isActive") !== "off"

  if (!name) return { error: "Name is required" }

  await prisma.customer.update({
    where: { id },
    data: {
      name,
      ratePay,
      ratePay3,
      ratePay4,
      rateWin,
      rateWin3,
      rateWin4,
      rateWinDaMNMT,
      rateWinDaMB,
      role,
      isActive
    }
  })

  revalidatePath("/customers")
  revalidatePath("/tickets/new")
  return { success: true }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.bill.deleteMany({ where: { customerId: id } })
    await prisma.customer.delete({ where: { id } })
    revalidatePath("/customers")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { error: message }
  }
}
