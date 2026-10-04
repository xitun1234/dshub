"use server"

import prisma from "@/lib/prisma"
import { parseTicketInput } from "@/lib/parser"
import { getParserConfigs } from "@/lib/stations"

export async function createTicket(formData: FormData) {
  const customerId = formData.get("customerId") as string
  const region = formData.get("region") as string
  const dateStr = formData.get("date") as string
  const rawInput = formData.get("rawInput") as string
  
  if (!customerId || !rawInput) {
    return { error: "Vui lòng chọn khách và nhập phơi" }
  }

  // Fetch parser config from database
  const parserConfig = await getParserConfigs()

  // Parse logic again on server
  const parsed = parseTicketInput(rawInput, region, parserConfig)
  
  if (!parsed.isValid || parsed.bets.length === 0) {
    return { error: "Phơi không hợp lệ hoặc sai cú pháp" }
  }

  // Lấy tỷ lệ xác từ khách hàng
  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  const capitalRate = customer?.ratePay || 0.72
  const capitalRate3 = customer?.ratePay3 || 0.72
  const capitalRate4 = (customer as any)?.ratePay4 || 0.72
 
  const totalCapital = parsed.bets.reduce((sum, bet) => {
    const rate = bet.isFourDigit ? capitalRate4 : (bet.isThreeDigit ? capitalRate3 : capitalRate)
    const typeLower = bet.type.toLowerCase().replace(/đ/g, "d");
    const isDa = typeLower === "da" ||
                 typeLower.includes("xien") ||
                 typeLower === "x" ||
                 typeLower === "d" ||
                 typeLower === "dx";
    
    let points = 0
    if (isDa) {
      points = bet.amount * bet.numbers.length * 2 * bet.stationCount * bet.multiplier
    } else {
      points = bet.amount * bet.numbers.length * bet.multiplier * bet.stationCount
    }

    return sum + (points * rate)
  }, 0)

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

  // Lưu phơi
  const bill = await prisma.bill.create({
    data: {
      customerId,
      region,
      date: dateStr,
      rawContent: rawInput,
      totalInvestment: totalCapital,
      details: {
        create: detailCreates
      }
    }
  })

  return { success: true, ticketId: bill.id }
}

import { revalidatePath } from "next/cache"

export async function deleteTicket(id: string) {
  try {
    await prisma.bill.delete({
      where: { id }
    })
    revalidatePath("/tickets/new")
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Không thể xoá phơi"
    return { error: message }
  }
}
