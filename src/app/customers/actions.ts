"use server"

import { getBillsCacheTag } from "@/lib/bills"
import { getCustomersCacheTag } from "@/lib/customers"
import { requireUser } from "@/lib/auth"
import { CUSTOMER_DEFAULTS, type CustomerRole } from "@/lib/customer-defaults"
import prisma from "@/lib/prisma"
import { revalidatePath, updateTag } from "next/cache"

function getNumber(formData: FormData, key: string, fallback: number) {
  const parsed = Number.parseFloat(String(formData.get(key) ?? ""))
  return Number.isFinite(parsed) ? parsed : fallback
}

function getRole(formData: FormData): CustomerRole {
  return formData.get("role") === "THAU" ? "THAU" : CUSTOMER_DEFAULTS.role
}

export async function createCustomer(formData: FormData) {
  const user = await requireUser()
  const name = formData.get("name") as string
  const ratePay = getNumber(formData, "ratePay", CUSTOMER_DEFAULTS.ratePay)
  const ratePay3 = getNumber(formData, "ratePay3", CUSTOMER_DEFAULTS.ratePay3)
  const ratePay4 = getNumber(formData, "ratePay4", CUSTOMER_DEFAULTS.ratePay4)
  const rateWin = getNumber(formData, "rateWin", CUSTOMER_DEFAULTS.rateWin)
  const rateWin3 = getNumber(formData, "rateWin3", CUSTOMER_DEFAULTS.rateWin3)
  const rateWin4 = getNumber(formData, "rateWin4", CUSTOMER_DEFAULTS.rateWin4)
  const rateWinDaMNMT = getNumber(formData, "rateWinDaMNMT", CUSTOMER_DEFAULTS.rateWinDaMNMT)
  const rateWinDaMB = getNumber(formData, "rateWinDaMB", CUSTOMER_DEFAULTS.rateWinDaMB)
  const role = getRole(formData)
  const isActive = formData.has("isActive") ? formData.get("isActive") !== "off" : CUSTOMER_DEFAULTS.isActive

  if (!name) return { error: "Name is required" }

  await prisma.customer.create({
    data: {
      userId: user.id,
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

  updateTag(getCustomersCacheTag(user.id))
  revalidatePath("/")
  revalidatePath("/customers")
  revalidatePath("/tickets/new")
  revalidatePath("/statistics")
  return { success: true }
}

export async function updateCustomer(id: string, formData: FormData) {
  const user = await requireUser()
  const name = formData.get("name") as string
  const ratePay = getNumber(formData, "ratePay", CUSTOMER_DEFAULTS.ratePay)
  const ratePay3 = getNumber(formData, "ratePay3", CUSTOMER_DEFAULTS.ratePay3)
  const ratePay4 = getNumber(formData, "ratePay4", CUSTOMER_DEFAULTS.ratePay4)
  const rateWin = getNumber(formData, "rateWin", CUSTOMER_DEFAULTS.rateWin)
  const rateWin3 = getNumber(formData, "rateWin3", CUSTOMER_DEFAULTS.rateWin3)
  const rateWin4 = getNumber(formData, "rateWin4", CUSTOMER_DEFAULTS.rateWin4)
  const rateWinDaMNMT = getNumber(formData, "rateWinDaMNMT", CUSTOMER_DEFAULTS.rateWinDaMNMT)
  const rateWinDaMB = getNumber(formData, "rateWinDaMB", CUSTOMER_DEFAULTS.rateWinDaMB)
  const role = getRole(formData)
  const isActive = formData.has("isActive") ? formData.get("isActive") !== "off" : CUSTOMER_DEFAULTS.isActive

  if (!name) return { error: "Name is required" }

  const result = await prisma.customer.updateMany({
    where: { id, userId: user.id },
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

  if (result.count === 0) return { error: "Khách hàng không tồn tại hoặc không thuộc tài khoản này" }

  updateTag(getCustomersCacheTag(user.id))
  revalidatePath("/")
  revalidatePath("/customers")
  revalidatePath("/tickets/new")
  revalidatePath("/statistics")
  return { success: true }
}

export async function deleteCustomer(id: string) {
  try {
    const user = await requireUser()
    const result = await prisma.customer.deleteMany({ where: { id, userId: user.id } })
    if (result.count === 0) return { error: "Khách hàng không tồn tại hoặc không thuộc tài khoản này" }

    updateTag(getBillsCacheTag(user.id))
    updateTag(getCustomersCacheTag(user.id))
    revalidatePath("/")
    revalidatePath("/customers")
    revalidatePath("/tickets/new")
    revalidatePath("/statistics")
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { error: message }
  }
}
