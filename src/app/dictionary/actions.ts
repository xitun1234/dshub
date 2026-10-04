"use server"

import { DEFAULT_STATIONS } from "@/lib/default-stations"
import { requireUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { STATIONS_CACHE_TAG } from "@/lib/stations"
import { revalidatePath, updateTag } from "next/cache"

export async function updateStationAliases(id: string, rawAliases: string) {
  try {
    await requireUser()
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
    updateTag(STATIONS_CACHE_TAG)
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
    await requireUser()
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

    updateTag(STATIONS_CACHE_TAG)
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
