"use server"

import type { Prisma } from "@prisma/client"
import { revalidatePath, updateTag } from "next/cache"
import { getBillsCacheTag } from "@/lib/bills"
import { requireUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { fetchLotteryRSS } from "@/lib/rss"
import { getDynamicAliasMap } from "@/lib/stations"

function getWinningNumbersForBet(
  prizes: Record<string, string | string[]>,
  betType: string,
  digitCount: number,
  region: string
): string[] {
  const typeNorm = betType.toLowerCase().replace(/đ/g, "d");
  const isSouthOrCentral = region === "MN" || region === "MT";
  const winNumbers: string[] = [];

  const extractDigits = (numStr: string, n: number) => {
    if (numStr && numStr.length >= n) {
      winNumbers.push(numStr.slice(-n));
    }
  };

  const processPrize = (key: string, n: number) => {
    const data = prizes[key];
    if (!data) return;
    if (Array.isArray(data)) {
      data.forEach(val => extractDigits(val, n));
    } else {
      extractDigits(data, n);
    }
  };

  if (typeNorm.includes("7lo") || typeNorm === "7l") {
    // 7 lô: Giải 7, Giải 6, Giải 5, số đầu tiên Giải 4 và Giải Đặc Biệt
    processPrize("7", digitCount);
    processPrize("6", digitCount);
    processPrize("5", digitCount);
    const g4 = prizes["4"];
    if (g4 && Array.isArray(g4)) {
      extractDigits(g4[0], digitCount);
    }
    processPrize("ĐB", digitCount);
  } else if (typeNorm === "dau") {
    processPrize("8", digitCount);
  } else if (typeNorm === "duoi") {
    processPrize("ĐB", digitCount);
  } else if (typeNorm.includes("dauduoi") || typeNorm === "dd") {
    processPrize("8", digitCount);
    processPrize("ĐB", digitCount);
  } else if (typeNorm.includes("xc") || typeNorm.includes("xiuchu")) {
    const prizeKeys = isSouthOrCentral ? ["ĐB", "7"] : ["ĐB", "6"];
    prizeKeys.forEach(key => processPrize(key, 3));
  } else if (digitCount === 4) {
    const prizeKeys = isSouthOrCentral 
      ? ["ĐB", "1", "2", "3", "4", "5", "6"] 
      : ["ĐB", "1", "2", "3", "4", "5"];
    
    prizeKeys.forEach(key => processPrize(key, 4));
  } else if (digitCount === 3) {
    const prizeKeys = isSouthOrCentral 
      ? ["ĐB", "1", "2", "3", "4", "5", "6", "7"] 
      : ["ĐB", "1", "2", "3", "4", "5", "6"];
    
    prizeKeys.forEach(key => processPrize(key, 3));
  } else {
    const prizeKeys = ["ĐB", "1", "2", "3", "4", "5", "6", "7", "8"];
    prizeKeys.forEach(key => processPrize(key, 2));
  }

  return winNumbers;
}

export async function fetchAndCheckResults(region: "MN" | "MT" | "MB", dateStr: string, dayIndex: number) {
  try {
    const user = await requireUser()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) {
      return { success: false, error: "Ngày dò kết quả không hợp lệ." }
    }

    const dynamicAliasMap = await getDynamicAliasMap()
    // 1. Kéo RSS xskt - Pass dateStr for precise filtering
    const rssData = await fetchLotteryRSS(region, dayIndex, dateStr)
    
    // 2. Lưu/Cập nhật KQXS vào Database
    await Promise.all(Object.keys(rssData.results).map(station =>
      prisma.lotteryResult.upsert({
        where: { drawDate_stationCode: { drawDate: dateStr, stationCode: station } },
        update: { winningNumbers: JSON.stringify(rssData.results[station]) },
        create: { drawDate: dateStr, region, stationCode: station, winningNumbers: JSON.stringify(rssData.results[station]) }
      })
    ))

    // Xác định thứ tự ưu tiên của đài (để mapping 2dai, 3dai) chính xác theo lịch
    const DAILY_STATIONS: Record<string, Record<number, string[]>> = {
      MN: {
        1: ['TP.HCM', 'Đồng Tháp', 'Cà Mau'], // Thứ 2
        2: ['Bến Tre', 'Vũng Tàu', 'Bạc Liêu'], // Thứ 3
        3: ['Đồng Nai', 'Cần Thơ', 'Sóc Trăng'], // Thứ 4
        4: ['Tây Ninh', 'An Giang', 'Bình Thuận'], // Thứ 5
        5: ['Vĩnh Long', 'Bình Dương', 'Trà Vinh'], // Thứ 6
        6: ['TP.HCM', 'Long An', 'Bình Phước', 'Hậu Giang'], // Thứ 7
        0: ['Tiền Giang', 'Kiên Giang', 'Đà Lạt'] // Chủ nhật
      },
      MT: {
        1: ['Phú Yên', 'Thừa Thiên Huế'], // Thứ 2
        2: ['Đắk Lắk', 'Quảng Nam'], // Thứ 3
        3: ['Đà Nẵng', 'Khánh Hòa'], // Thứ 4
        4: ['Bình Định', 'Quảng Trị', 'Quảng Bình'], // Thứ 5
        5: ['Gia Lai', 'Ninh Thuận'], // Thứ 6
        6: ['Đà Nẵng', 'Quảng Ngãi', 'Đắk Nông'], // Thứ 7
        0: ['Khánh Hòa', 'Kon Tum'] // Chủ nhật
      }
    }

    const officialOrder = DAILY_STATIONS[region]?.[dayIndex] || [];
    
    const normalizeStation = (s: string) => s.toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]/g, "");
    const normOfficialOrder = officialOrder.map(normalizeStation);
    
    // Tạo mảng đài dựa trên RSS kéo về, nhưng sắp xếp đúng chuẩn theo lịch Official
    const orderedStations = Object.keys(rssData.results).sort((a, b) => {
      const normA = normalizeStation(a);
      const normB = normalizeStation(b);
      
      const idxA = normOfficialOrder.findIndex(off => normA.includes(off) || off.includes(normA));
      const idxB = normOfficialOrder.findIndex(off => normB.includes(off) || off.includes(normB));
      
      // Nếu đài có trong lịch, nó đứng trước. Nếu không, đẩy xuống cuối
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });

    // 4. Chỉ lấy các phơi đang chờ dò của đúng ngày và miền đã chọn.
    const bills = await prisma.bill.findMany({
      where: { status: "pending", region, date: dateStr, customer: { userId: user.id } },
      select: {
        id: true,
        details: {
          select: {
            id: true,
            betNumber: true,
            betType: true,
            stationCount: true,
            pricePerUnit: true,
            stationAliases: true
          }
        },
        customer: {
          select: {
            rateWin: true,
            rateWin3: true,
            rateWin4: true,
            rateWinDaMNMT: true,
            rateWinDaMB: true
          }
        }
      }
    })

    let totalProcessed = 0

    // 5. Dò số cho từng phơi và gom toàn bộ thao tác ghi vào một transaction.
    const writeOperations: Prisma.PrismaPromise<unknown>[] = []

    for (const bill of bills) {
      let billTotalWin = 0

      for (const detail of bill.details) {
        let stationsToCheck = orderedStations.slice(0, detail.stationCount || orderedStations.length)

        if (detail.stationAliases) {
          try {
            const parsedAliases: unknown = JSON.parse(detail.stationAliases)
            const aliases = Array.isArray(parsedAliases)
              ? parsedAliases.filter((alias): alias is string => typeof alias === "string")
              : []

            if (aliases.length > 0) {
              const actualStations: string[] = []

              aliases.forEach(alias => {
                // Một alias có thể trùng nhiều đài (vd "bd" = Bình Dương + Bình Định)
                // -> ưu tiên đài nào thực sự có mặt trong kết quả của miền/ngày đang dò
                const officialNames = dynamicAliasMap[alias] || [alias]
                const normAlias = normalizeStation(alias)

                let found: string | undefined
                for (const officialName of officialNames) {
                  const normOfficial = normalizeStation(officialName)
                  found = orderedStations.find(st => {
                    let normSt = normalizeStation(st)
                    // Special case for TPHCM where RSS returns "Hồ Chí Minh" or similar variants
                    if (normSt.includes("hochiminh") || normSt.includes("hchminh") || normSt.includes("hcm")) {
                      normSt = "tphcm"
                    }

                    return normSt === normOfficial ||
                      normSt.includes(normOfficial) ||
                      normOfficial.includes(normSt)
                  })
                  if (found) break
                }

                // Fallback cuối cùng: alias là đoạn con của tên đài trên RSS.
                if (!found) {
                  found = orderedStations.find(st => {
                    let normSt = normalizeStation(st)
                    if (normSt.includes("hochiminh") || normSt.includes("hchminh") || normSt.includes("hcm")) {
                      normSt = "tphcm"
                    }
                    return normSt.includes(normAlias)
                  })
                }

                if (found && !actualStations.includes(found)) actualStations.push(found)
              })

              if (actualStations.length > 0) stationsToCheck = actualStations
            }
          } catch (error) {
            console.error(error)
          }
        }

        let hitCount = 0
        const hitStations: string[] = []
        const typeNorm = detail.betType.toLowerCase().replace(/đ/g, "d")
        const isDa = typeNorm === "da" ||
          typeNorm.includes("xien") ||
          typeNorm === "x" ||
          typeNorm === "d" ||
          typeNorm === "dx"

        if (isDa && detail.betNumber.includes("-")) {
          const [num1, num2] = detail.betNumber.split("-")
          let totalHits1 = 0
          let totalHits2 = 0

          stationsToCheck.forEach(station => {
            const prizes = rssData.results[station]
            if (!prizes) return

            const hits1 = getWinningNumbersForBet(prizes, detail.betType, num1.length, region)
              .filter(win => win === num1).length
            const hits2 = getWinningNumbersForBet(prizes, detail.betType, num2.length, region)
              .filter(win => win === num2).length

            if (hits1 > 0) {
              totalHits1 += hits1
              if (!hitStations.includes(station)) hitStations.push(station)
            }
            if (hits2 > 0) {
              totalHits2 += hits2
              if (!hitStations.includes(station)) hitStations.push(station)
            }
          })

          if (totalHits1 > 0 && totalHits2 > 0) {
            hitCount = Math.min(totalHits1, totalHits2)
          } else {
            hitStations.length = 0
          }
        } else {
          const digitCount = detail.betNumber.length
          stationsToCheck.forEach(station => {
            const prizes = rssData.results[station]
            if (!prizes) return

            const hits = getWinningNumbersForBet(prizes, detail.betType, digitCount, region)
              .filter(win => win === detail.betNumber).length
            if (hits > 0) {
              hitCount += hits
              if (!hitStations.includes(station)) hitStations.push(station)
            }
          })
        }

        if (hitCount > 0) {
          const is4D = detail.betNumber.length === 4
          const is3D = detail.betNumber.length === 3 ||
            typeNorm.includes("bacang") ||
            typeNorm.includes("xc") ||
            typeNorm.includes("xiuchu")

          let winRateApplied = bill.customer.rateWin
          if (is4D) {
            winRateApplied = bill.customer.rateWin4
          } else if (is3D) {
            winRateApplied = bill.customer.rateWin3
          } else if (isDa) {
            winRateApplied = region === "MB"
              ? bill.customer.rateWinDaMB
              : bill.customer.rateWinDaMNMT
          }

          billTotalWin += hitCount * detail.pricePerUnit * winRateApplied
        }

        writeOperations.push(prisma.billDetail.update({
          where: { id: detail.id },
          data: hitCount > 0
            ? {
                isWin: true,
                winQuantity: hitCount,
                winStations: JSON.stringify(hitStations)
              }
            : { isWin: false, winQuantity: 0, winStations: null }
        }))
      }

      writeOperations.push(prisma.bill.update({
        where: { id: bill.id },
        data: { status: "processed", totalPrize: billTotalWin }
      }))
      totalProcessed++
    }

    if (writeOperations.length > 0) {
      await prisma.$transaction([...writeOperations])
    }

    updateTag(getBillsCacheTag(user.id))
    revalidatePath("/results")
    revalidatePath("/tickets/new")
    revalidatePath("/statistics")
    return {
      success: true,
      message: `Thành công! Đã kết toán ${totalProcessed} phơi đánh ${region}.`,
      rssTitle: rssData.title,
      rssResults: rssData.results
    }
  } catch (error: unknown) {
    console.error("Lỗi dò tự động:", error)
    const message = error instanceof Error ? error.message : "Lỗi không xác định khi kết toán."
    return { success: false, error: message }
  }
}
