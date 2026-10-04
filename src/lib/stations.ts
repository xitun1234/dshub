import { unstable_cache } from "next/cache"
import prisma from "./prisma"
import { DEFAULT_STATIONS } from "./default-stations"

export const STATIONS_CACHE_TAG = "stations"

export interface StationData {
  id: string
  name: string
  aliases: string
  region: string
}

async function loadStations(): Promise<StationData[]> {
  let dbStations = await prisma.station.findMany({
    orderBy: { name: "asc" }
  })

  if (dbStations.length === 0) {
    await prisma.station.createMany({
      data: DEFAULT_STATIONS.map(s => ({
        name: s.name,
        region: s.region,
        aliases: s.aliases.join(", ")
      })),
      skipDuplicates: true
    })
    dbStations = await prisma.station.findMany({
      orderBy: { name: "asc" }
    })
  }

  return dbStations
}

export const getStations = unstable_cache(
  loadStations,
  [STATIONS_CACHE_TAG],
  { tags: [STATIONS_CACHE_TAG], revalidate: false }
)

export interface ParserConfig {
  customAliases: string[]
  twoDaiAliases: string[]
  threeDaiAliases: string[]
  fourDaiAliases: string[]
}

export async function getParserConfigs(): Promise<ParserConfig> {
  const stations = await getStations()
  
  const config: ParserConfig = {
    customAliases: [],
    twoDaiAliases: [],
    threeDaiAliases: [],
    fourDaiAliases: []
  }
  
  stations.forEach(s => {
    const aliasesList = s.aliases
      .split(",")
      .map(a => a.trim().toLowerCase())
      .filter(Boolean)
      
    // Add all aliases to customAliases flat list
    config.customAliases.push(...aliasesList)
    
    // Add to specific multi-station lists if matched
    if (s.name === "2 Đài") {
      config.twoDaiAliases.push(...aliasesList)
    } else if (s.name === "3 Đài") {
      config.threeDaiAliases.push(...aliasesList)
    } else if (s.name === "4 Đài") {
      config.fourDaiAliases.push(...aliasesList)
    }
  })
  
  return config
}

export async function getDynamicAliasMap(): Promise<Record<string, string[]>> {
  const stations = await getStations()
  const map: Record<string, string[]> = {}

  stations.forEach(s => {
    // Do not include multi-station shortcuts in ALIAS_MAP since they don't map to a single official station
    if (s.region === "CHUNG") return

    const aliasesList = s.aliases
      .split(",")
      .map(a => a.trim().toLowerCase())
      .filter(Boolean)

    aliasesList.forEach(alias => {
      if (!map[alias]) map[alias] = []
      // Một alias có thể trùng nhiều đài (vd "bd" = Bình Dương + Bình Định)
      // -> giữ cả 2, bên dò số sẽ chọn theo miền/ngày đang kết toán
      if (!map[alias].includes(s.name)) map[alias].push(s.name)
    })
  })

  return map
}
