"use server"

import bcrypt from "bcryptjs"
import { Prisma } from "@prisma/client"
import { revalidatePath, updateTag } from "next/cache"
import { requireAdmin } from "@/lib/admin-auth"
import { getBillsCacheTag } from "@/lib/bills"
import { CUSTOMER_DEFAULTS, type CustomerRole } from "@/lib/customer-defaults"
import { getCustomersCacheTag } from "@/lib/customers"
import prisma from "@/lib/prisma"

type ActionResult = { success: true; message: string } | { success: false; error: string }

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function numberValue(formData: FormData, key: string, fallback: number) {
  const parsed = Number.parseFloat(value(formData, key))
  return Number.isFinite(parsed) ? parsed : fallback
}

function roleValue(formData: FormData): CustomerRole {
  return value(formData, "role") === "THAU" ? "THAU" : CUSTOMER_DEFAULTS.role
}

function isUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

function isAuthorizedError(error: unknown) {
  return error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")
}

function actionError(error: unknown, fallback: string): ActionResult {
  if (isAuthorizedError(error)) {
    return { success: false, error: "Phiên quản trị không hợp lệ. Vui lòng đăng nhập lại." }
  }
  return { success: false, error: fallback }
}

async function requireManagedUser(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, role: "user" },
    select: { id: true }
  })
}

function invalidateUserData(userId: string) {
  updateTag(getCustomersCacheTag(userId))
  updateTag(getBillsCacheTag(userId))
  revalidatePath("/admin")
}

export async function createManagedUser(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const name = value(formData, "name")
    const username = value(formData, "username")
    const password = String(formData.get("password") ?? "")

    if (!name || !username || password.length < 6) {
      return { success: false, error: "Nhập đầy đủ tên, tên đăng nhập và mật khẩu từ 6 ký tự." }
    }

    await prisma.user.create({
      data: {
        name,
        username,
        password: await bcrypt.hash(password, 10),
        role: "user"
      }
    })
    revalidatePath("/admin")
    return { success: true, message: "Đã tạo tài khoản mới." }
  } catch (error: unknown) {
    if (isUniqueError(error)) return { success: false, error: "Tên đăng nhập đã tồn tại." }
    return actionError(error, "Không thể tạo tài khoản. Vui lòng thử lại.")
  }
}

export async function updateManagedUser(userId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const name = value(formData, "name")
    const username = value(formData, "username")
    if (!name || !username) return { success: false, error: "Tên và tên đăng nhập không được để trống." }

    const managedUser = await requireManagedUser(userId)
    if (!managedUser) return { success: false, error: "Không tìm thấy tài khoản người dùng." }

    await prisma.user.update({
      where: { id: managedUser.id },
      data: { name, username }
    })

    revalidatePath("/admin")
    return { success: true, message: "Đã cập nhật tài khoản." }
  } catch (error: unknown) {
    if (isUniqueError(error)) return { success: false, error: "Tên đăng nhập đã tồn tại." }
    return actionError(error, "Không thể cập nhật tài khoản.")
  }
}

export async function resetManagedUserPassword(userId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    const password = String(formData.get("password") ?? "")
    if (password.length < 6) return { success: false, error: "Mật khẩu phải có ít nhất 6 ký tự." }

    const managedUser = await requireManagedUser(userId)
    if (!managedUser) return { success: false, error: "Không tìm thấy tài khoản người dùng." }

    await prisma.user.update({
      where: { id: managedUser.id },
      data: { password: await bcrypt.hash(password, 10) }
    })

    return { success: true, message: "Đã đặt lại mật khẩu." }
  } catch (error: unknown) {
    return actionError(error, "Không thể đặt lại mật khẩu.")
  }
}

export async function deleteManagedUser(userId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin()
    if (admin.id === userId) return { success: false, error: "Không thể xóa tài khoản quản trị hiện tại." }

    const result = await prisma.user.deleteMany({ where: { id: userId, role: "user" } })
    if (result.count === 0) return { success: false, error: "Không tìm thấy tài khoản người dùng." }

    invalidateUserData(userId)
    return { success: true, message: "Đã xóa tài khoản và toàn bộ dữ liệu liên quan." }
  } catch (error: unknown) {
    return actionError(error, "Không thể xóa tài khoản.")
  }
}

export async function createManagedCustomer(userId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (!(await requireManagedUser(userId))) return { success: false, error: "Tài khoản người dùng không tồn tại." }
    const name = value(formData, "name")
    if (!name) return { success: false, error: "Tên khách hàng không được để trống." }

    await prisma.customer.create({
      data: {
        userId,
        name,
        phone: value(formData, "phone") || null,
        role: roleValue(formData),
        isActive: formData.get("isActive") !== "off",
        ratePay: numberValue(formData, "ratePay", CUSTOMER_DEFAULTS.ratePay),
        ratePay3: numberValue(formData, "ratePay3", CUSTOMER_DEFAULTS.ratePay3),
        ratePay4: numberValue(formData, "ratePay4", CUSTOMER_DEFAULTS.ratePay4),
        rateWin: numberValue(formData, "rateWin", CUSTOMER_DEFAULTS.rateWin),
        rateWin3: numberValue(formData, "rateWin3", CUSTOMER_DEFAULTS.rateWin3),
        rateWin4: numberValue(formData, "rateWin4", CUSTOMER_DEFAULTS.rateWin4),
        rateWinDaMNMT: numberValue(formData, "rateWinDaMNMT", CUSTOMER_DEFAULTS.rateWinDaMNMT),
        rateWinDaMB: numberValue(formData, "rateWinDaMB", CUSTOMER_DEFAULTS.rateWinDaMB)
      }
    })
    invalidateUserData(userId)
    return { success: true, message: "Đã thêm khách hàng / thầu." }
  } catch (error: unknown) {
    return actionError(error, "Không thể thêm khách hàng / thầu.")
  }
}

export async function updateManagedCustomer(customerId: string, userId: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (!(await requireManagedUser(userId))) return { success: false, error: "Tài khoản người dùng không tồn tại." }
    const name = value(formData, "name")
    if (!name) return { success: false, error: "Tên khách hàng không được để trống." }

    const result = await prisma.customer.updateMany({
      where: { id: customerId, userId },
      data: {
        name,
        phone: value(formData, "phone") || null,
        role: roleValue(formData),
        isActive: formData.get("isActive") !== "off",
        ratePay: numberValue(formData, "ratePay", CUSTOMER_DEFAULTS.ratePay),
        ratePay3: numberValue(formData, "ratePay3", CUSTOMER_DEFAULTS.ratePay3),
        ratePay4: numberValue(formData, "ratePay4", CUSTOMER_DEFAULTS.ratePay4),
        rateWin: numberValue(formData, "rateWin", CUSTOMER_DEFAULTS.rateWin),
        rateWin3: numberValue(formData, "rateWin3", CUSTOMER_DEFAULTS.rateWin3),
        rateWin4: numberValue(formData, "rateWin4", CUSTOMER_DEFAULTS.rateWin4),
        rateWinDaMNMT: numberValue(formData, "rateWinDaMNMT", CUSTOMER_DEFAULTS.rateWinDaMNMT),
        rateWinDaMB: numberValue(formData, "rateWinDaMB", CUSTOMER_DEFAULTS.rateWinDaMB)
      }
    })
    if (result.count === 0) return { success: false, error: "Không tìm thấy khách hàng / thầu." }

    invalidateUserData(userId)
    return { success: true, message: "Đã cập nhật khách hàng / thầu." }
  } catch (error: unknown) {
    return actionError(error, "Không thể cập nhật khách hàng / thầu.")
  }
}

export async function deleteManagedCustomer(customerId: string, userId: string): Promise<ActionResult> {
  try {
    await requireAdmin()
    if (!(await requireManagedUser(userId))) return { success: false, error: "Tài khoản người dùng không tồn tại." }
    const result = await prisma.customer.deleteMany({ where: { id: customerId, userId } })
    if (result.count === 0) return { success: false, error: "Không tìm thấy khách hàng / thầu." }

    invalidateUserData(userId)
    return { success: true, message: "Đã xóa khách hàng / thầu và dữ liệu liên quan." }
  } catch (error: unknown) {
    return actionError(error, "Không thể xóa khách hàng / thầu.")
  }
}
