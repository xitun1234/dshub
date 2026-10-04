"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { DEFAULT_STATIONS } from "@/lib/default-stations"

export async function updateStationAliases(id: string, rawAliases: string) {
  try {
    // Process and normalize aliases: split, trim, lowercase, filter empty
    const normalized = rawAliases
      .split(",")
      .map(a => a.trim().toLowerCase())
      .filter(Boolean)
      
    // Deduplicate aliases
    const uniqueAliases = Array.from(new Set(normalized))
    const aliasesString = uniqueAliases.join(", ")

    await prisma.station.update({
      where: { id },
      data: { aliases: aliasesString }
    })

    // Revalidate paths to reflect updates
    revalidatePath("/dictionary")
    revalidatePath("/tickets/new")
    revalidatePath("/results")

    return { success: true }
  } catch (error: unknown) {
    console.error("Error updating station aliases:", error)
    const message = error instanceof Error ? error.message : "Lỗi khi cập nhật viết tắt."
    return { error: message }
  }
}

export async function resetToDefault() {
  try {
    // Delete all current records
    await prisma.station.deleteMany()

    // Create many using defaults
    await prisma.station.createMany({
      data: DEFAULT_STATIONS.map(s => ({
        name: s.name,
        region: s.region,
        aliases: s.aliases.join(", ")
      }))
    })

    revalidatePath("/dictionary")
    revalidatePath("/tickets/new")
    revalidatePath("/results")

    return { success: true }
  } catch (error: unknown) {
    console.error("Error resetting stations to default:", error)
    const message = error instanceof Error ? error.message : "Lỗi khi đặt lại mặc định."
    return { error: message }
  }
}
