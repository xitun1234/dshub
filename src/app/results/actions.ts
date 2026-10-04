"use server"

import prisma from "@/lib/prisma"
import { fetchLotteryRSS } from "@/lib/rss"
import { revalidatePath } from "next/cache"
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
    const dynamicAliasMap = await getDynamicAliasMap()
    // 1. Kéo RSS xskt - Pass dateStr for precise filtering
    const rssData = await fetchLotteryRSS(region, dayIndex, dateStr)
    
    // 2. Lưu/Cập nhật KQXS vào Database 
    for (const station of Object.keys(rssData.results)) {
      await prisma.lotteryResult.upsert({
        where: { drawDate_stationCode: { drawDate: dateStr, stationCode: station } },
        update: { winningNumbers: JSON.stringify(rssData.results[station]) },
        create: { drawDate: dateStr, region, stationCode: station, winningNumbers: JSON.stringify(rssData.results[station]) }
      })
    }

    // Xác định thứ tự ưu tiên của đài (để mapping 2dai, 3dai)
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

    // 4. Lấy tất cả Phơi đang chờ dò của ngày hôm đó (hoặc tất cả pending)
    const bills = await prisma.bill.findMany({
      where: { status: 'pending', region },
      include: { details: true, customer: true }
    })

    let totalProcessed = 0

    // 5. Dò số cho từng phơi
    for (const bill of bills) {
      let billTotalWin = 0

      for (const detail of bill.details) {
        let stationsToCheck = orderedStations.slice(0, detail.stationCount || orderedStations.length)

        if (detail.stationAliases) {
          try {
            const aliases: string[] = JSON.parse(detail.stationAliases)
            if (aliases && aliases.length > 0) {
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
                       let normSt = normalizeStation(st);
                       // Special case for TPHCM where RSS returns "Hồ Chí Minh" or similar variants
                       if (normSt.includes("hochiminh") || normSt.includes("hchminh") || normSt.includes("hcm")) {
                          normSt = "tphcm";
                        }

                        return normSt === normOfficial ||
                               normSt.includes(normOfficial) ||
                               normOfficial.includes(normSt);
                     })
                     if (found) break
                 }

                 // Fallback cuối cùng: alias là đoạn con của tên đài trên RSS
                 // (chỉ dùng khi không khớp được tên chính thức, tránh dính nhầm như "cm" khớp vào "tphcm")
                 if (!found) {
                    found = orderedStations.find(st => {
                       let normSt = normalizeStation(st);
                       if (normSt.includes("hochiminh") || normSt.includes("hchminh") || normSt.includes("hcm")) {
                          normSt = "tphcm";
                        }
                        return normSt.includes(normAlias);
                     })
                 }

                 if (found && !actualStations.includes(found)) {
                    actualStations.push(found);
                 }
              });
 
               if (actualStations.length > 0) {
                  stationsToCheck = actualStations
               }
             }
           } catch (e) {
             console.error(e)
           }
         }
 
         let hitCount = 0
         const hitStations: string[] = []
         
         const typeNorm = detail.betType.toLowerCase().replace(/đ/g, "d");
         const isDa = typeNorm === "da" ||
                      typeNorm.includes("xien") ||
                      typeNorm === "x" ||
                      typeNorm === "d" ||
                      typeNorm === "dx";

         if (isDa && detail.betNumber.includes("-")) {
            const [num1, num2] = detail.betNumber.split("-");
            let totalHits1 = 0;
            let totalHits2 = 0;
            
            stationsToCheck.forEach(st => {
               const prizes = rssData.results[st];
               if (!prizes) return;
               
               const winNumbers1 = getWinningNumbersForBet(prizes, detail.betType, num1.length, region);
               const winNumbers2 = getWinningNumbersForBet(prizes, detail.betType, num2.length, region);
               
               const hits1 = winNumbers1.filter(win => win === num1).length || 0;
               const hits2 = winNumbers2.filter(win => win === num2).length || 0;
               
               if (hits1 > 0) {
                  totalHits1 += hits1;
                  if (!hitStations.includes(st)) hitStations.push(st);
               }
               if (hits2 > 0) {
                  totalHits2 += hits2;
                  if (!hitStations.includes(st)) hitStations.push(st);
               }
            });
            
            if (totalHits1 > 0 && totalHits2 > 0) {
               hitCount = Math.min(totalHits1, totalHits2);
            } else {
               hitStations.length = 0; // Clear stations if not winning
            }
         } else {
            const digitCount = detail.betNumber.length;
            stationsToCheck.forEach(st => {
               const prizes = rssData.results[st];
               if (!prizes) return;
               
               const winNumbers = getWinningNumbersForBet(prizes, detail.betType, digitCount, region);
               const hitsInObj = winNumbers.filter(win => win === detail.betNumber).length || 0;
               
               if (hitsInObj > 0) {
                  hitCount += hitsInObj;
                  if (!hitStations.includes(st)) {
                     hitStations.push(st);
                  }
               }
            });
         }
          let winAmount = 0;
          if (hitCount > 0) {
            const is4D = detail.betNumber.length === 4;
            const is3D = detail.betNumber.length === 3 || 
                         detail.betType.toLowerCase().includes("bacang") || 
                         detail.betType.toLowerCase().includes("xc") || 
                         detail.betType.toLowerCase().includes("xiuchu");
                          
            const isDa = detail.betType.toLowerCase() === "da" ||
                         detail.betType.toLowerCase().includes("xien") ||
                         detail.betType === "x" ||
                         detail.betType === "d" ||
                         detail.betType === "dx";
                          
            let winRateApplied = bill.customer.rateWin;
            if (is4D) {
              winRateApplied = (bill.customer as any).rateWin4 ?? 5500;
            } else if (is3D) {
              winRateApplied = (bill.customer as any).rateWin3 ?? 650;
            } else if (isDa) {
              winRateApplied = region === "MB" 
                ? ((bill.customer as any).rateWinDaMB ?? 650)
                : ((bill.customer as any).rateWinDaMNMT ?? 650);
            }
            
            winAmount = hitCount * detail.pricePerUnit * winRateApplied;
 
           // Update SQL BillDetail
           await prisma.billDetail.update({
             where: { id: detail.id },
             data: { 
               isWin: true, 
               winQuantity: hitCount,
               winStations: JSON.stringify(hitStations)
             }
           })
 
           billTotalWin += winAmount
         } else {
             // Update là đã soát nhưng thua
             await prisma.billDetail.update({
                 where: { id: detail.id },
                 data: { isWin: false, winQuantity: 0, winStations: null }
             })
         }
       }
 
       // Đánh dấu Phơi đã được xử lý (Processed) để không bị dò lại
       await prisma.bill.update({
         where: { id: bill.id },
         data: { status: 'processed', totalPrize: billTotalWin }
       })
 
       totalProcessed++
     }
 
     revalidatePath("/results")
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
