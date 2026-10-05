"use server"

import { revalidatePath, updateTag } from "next/cache"
import { requireUser } from "@/lib/auth"
import { getBillsCacheTag } from "@/lib/bills"
import prisma from "@/lib/prisma"

export async function deleteAllBills() {
  try {
    const user = await requireUser()
    const result = await prisma.bill.deleteMany({
      where: { customer: { userId: user.id } }
    })

    updateTag(getBillsCacheTag(user.id))
    revalidatePath("/")
    revalidatePath("/tickets/new")
    revalidatePath("/statistics")
    revalidatePath("/results")

    return { success: true as const, count: result.count }
  } catch {
    return {
      success: false as const,
      error: "Không thể xoá dữ liệu. Vui lòng đăng nhập lại hoặc thử lại sau."
    }
  }
}
