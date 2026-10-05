"use server"

import { calculateTotalInvestment } from "@/lib/bill-calculations"
import { getBillsCacheTag } from "@/lib/bills"
import { requireUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { normalizeTicketInput, parseTicketInput } from "@/lib/parser"
import { getParserConfigs } from "@/lib/stations"
import { revalidatePath, updateTag } from "next/cache"

export async function createTicket(formData: FormData) {
  const user = await requireUser()
  const customerId = formData.get("customerId") as string
  const region = formData.get("region") as string
  const dateStr = formData.get("date") as string
  const rawInput = formData.get("rawInput") as string
  const normalizedInput = normalizeTicketInput(rawInput || "")
  
  if (!customerId || !normalizedInput) {
    return { error: "Vui lòng chọn khách và nhập phơi" }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr || "")) {
    return { error: "Ngày lập phơi không hợp lệ" }
  }
  if (region !== "MN" && region !== "MT" && region !== "MB") {
    return { error: "Miền xổ số không hợp lệ" }
  }

  // Fetch parser config from database
  const parserConfig = await getParserConfigs()

  // Parse logic again on server
  const parsed = parseTicketInput(normalizedInput, region, parserConfig)
  
  if (!parsed.isValid || parsed.bets.length === 0) {
    return { error: "Phơi không hợp lệ hoặc sai cú pháp" }
  }

  // Lấy tỷ lệ xác từ khách hàng
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, userId: user.id, isActive: true },
    select: { ratePay: true, ratePay3: true, ratePay4: true }
  })
  if (!customer) {
    return { error: "Khách hàng không tồn tại hoặc không thuộc tài khoản này" }
  }
  // Tạo mảng chi tiết (tách từng con số)
  const detailCreates: {
    betNumber: string;
    betType: string;
    stationCount: number;
    multiplier: number;
    pricePerUnit: number;
    stationAliases: string;
  }[] = []
  parsed.bets.forEach(b => {
    b.numbers.forEach(num => {
      detailCreates.push({
        betNumber: num,
        betType: b.type,
        stationCount: b.stationCount,
        multiplier: b.multiplier,
        pricePerUnit: b.amount,
        stationAliases: JSON.stringify(b.stationAliases)
      })
    })
  })

  const totalCapital = calculateTotalInvestment(detailCreates, customer)

  // Lưu phơi
  const bill = await prisma.bill.create({
    data: {
      customerId,
      region,
      date: dateStr,
      rawContent: normalizedInput,
      totalInvestment: totalCapital,
      details: {
        create: detailCreates
      }
    }
  })

  updateTag(getBillsCacheTag(user.id))
  return { success: true, ticketId: bill.id }
}

export async function deleteTicket(id: string) {
  try {
    const user = await requireUser()
    const result = await prisma.bill.deleteMany({
      where: { id, customer: { userId: user.id } }
    })
    if (result.count === 0) return { error: "Phơi không tồn tại hoặc không thuộc tài khoản này" }

    updateTag(getBillsCacheTag(user.id))
    revalidatePath("/tickets/new")
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Không thể xoá phơi"
    return { error: message }
  }
}
