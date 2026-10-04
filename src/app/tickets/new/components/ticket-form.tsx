"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { parseTicketInput, ParseResult, ParserAliasesConfig } from "@/lib/parser"
import { createTicket } from "../actions"
import { useRouter, useSearchParams } from "next/navigation"
import { fetchAndCheckResults } from "@/app/results/actions"
import { TicketList } from "./ticket-list"
import { CustomerSummary } from "./customer-summary"
import { Pin, Minimize2, ChevronDown, ChevronRight } from "lucide-react"

// Temporary mock for customer list, would be fetched from DB in page.tsx
// Define specific types for better safety
interface Customer {
  id: string
  name: string
  ratePay: number
  rateWin: number
  role: string
  [key: string]: unknown
}

interface BillDetail {
  id: string
  betNumber: string
  betType: string
  stationCount: number
  multiplier: number
  pricePerUnit: number
  isWin: boolean
  winQuantity: number
  winStations: string | null
}

interface Bill {
  id: string
  customerId: string
  customer: Customer
  details: BillDetail[]
  rawContent: string
  region: string
  date: string
  totalInvestment: number
  totalPrize: number
  status: string
  [key: string]: unknown
}

const STATION_MAP: Record<string, { value: string, label: string }[]> = {
  MN: [
    { value: "0", label: "Chủ Nhật (Tiền Giang, Kiên Giang, Đà Lạt)" },
    { value: "1", label: "Thứ 2 (TPHCM, Đồng Tháp, Cà Mau)" },
    { value: "2", label: "Thứ 3 (Bến Tre, Vũng Tàu, Bạc Liêu)" },
    { value: "3", label: "Thứ 4 (Đồng Nai, Cần Thơ, Sóc Trăng)" },
    { value: "4", label: "Thứ 5 (Tây Ninh, An Giang, Bình Thuận)" },
    { value: "5", label: "Thứ 6 (Vĩnh Long, Bình Dương, Trà Vinh)" },
    { value: "6", label: "Thứ 7 (TPHCM, Long An, Bình Phước, Hậu Giang)" },
  ],
  MT: [
    { value: "0", label: "Chủ Nhật (Kon Tum, Khánh Hòa, Thừa Thiên Huế)" },
    { value: "1", label: "Thứ 2 (Thừa Thiên Huế, Phú Yên)" },
    { value: "2", label: "Thứ 3 (Đắk Lắk, Quảng Nam)" },
    { value: "3", label: "Thứ 4 (Đà Nẵng, Khánh Hòa)" },
    { value: "4", label: "Thứ 5 (Bình Định, Quảng Trị, Quảng Bình)" },
    { value: "5", label: "Thứ 6 (Gia Lai, Ninh Thuận)" },
    { value: "6", label: "Thứ 7 (Đà Nẵng, Quảng Ngãi, Đắk Nông)" },
  ],
  MB: [
    { value: "0", label: "Chủ Nhật (Hà Nội)" },
    { value: "1", label: "Thứ 2 (Hà Nội)" },
    { value: "2", label: "Thứ 3 (Hà Nội)" },
    { value: "3", label: "Thứ 4 (Hà Nội)" },
    { value: "4", label: "Thứ 5 (Hà Nội)" },
    { value: "5", label: "Thứ 6 (Hà Nội)" },
    { value: "6", label: "Thứ 7 (Hà Nội)" },
  ]
}

export function TicketForm({
  customer,
  initialRegion,
  bills,
  allBills = [],
  customers,
  initialDate,
  parserConfig
}: {
  customer: Customer
  initialRegion: "MN" | "MT" | "MB"
  bills: Bill[]
  allBills?: Bill[]
  customers: Customer[]
  initialDate: string
  parserConfig: ParserAliasesConfig
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [rawInput, setRawInput] = useState("")
  const [region, setRegion] = useState<"MN" | "MT" | "MB">(initialRegion)
  const [stickyCollapsed, setStickyCollapsed] = useState(false)
  const [collapsedRegions, setCollapsedRegions] = useState<Record<string, boolean>>({
    MN: false,
    MT: false,
    MB: false
  })

  // Helper to get date string for a specific day of week in the current week
  const getDateForDayOfWeek = (dayIndex: number) => {
    const now = new Date();
    const today = now.getDay();
    const diff = dayIndex - today;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + (diff > 0 ? diff - 7 : diff)); // Prefer past/today

    // Explicitly use local date components to avoid UTC shift
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const [dateStr, setDateStr] = useState(initialDate)
  const [dayOfWeek, setDayOfWeek] = useState(() => {
    const [y, m, d] = initialDate.split("-").map(Number);
    return new Date(y, m - 1, d).getDay().toString();
  })

  // When dayOfWeek changes, update dateStr
  const handleDayChange = (val: string) => {
    const dIdx = parseInt(val)
    setDayOfWeek(val)
    const newDate = getDateForDayOfWeek(dIdx)
    setDateStr(newDate)
  }

  const [isPending, startTransition] = useTransition()

  // Results states
  const [isChecking, setIsChecking] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ success: boolean, text: string } | null>(null)
  const [rssMsg, setRssMsg] = useState<{ success: boolean, text: string } | null>(null)
  const [rssTitle, setRssTitle] = useState("")
  const [rssResults, setRssResults] = useState<import("@/lib/rss").LotteryResults | null>(null)

  // Real-time calculation preview
  const parseResult: ParseResult = parseTicketInput(rawInput, region, parserConfig)

  const capitalRate = customer?.ratePay || 0.72
  const capitalRate3 = (customer as any)?.ratePay3 || 0.72
  const capitalRate4 = (customer as any)?.ratePay4 || 0.72
  const winRate = customer?.rateWin || 71

  const formatMoney = (val: number) => {
    const rounded = Math.round(val);
    if (Math.abs(rounded) >= 10000) {
      return rounded.toLocaleString('vi-VN');
    }
    return rounded.toString();
  };

  const formatPoints = (val: number) => {
    return (Math.round(val * 100) / 100).toLocaleString('vi-VN');
  };

  const totalCapitalK = parseResult.bets.reduce((sum, bet) => {
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

  // Group bets by category and calculate total cược points for display
  const betCategories: Record<string, number> = {}
  parseResult.bets.forEach(bet => {
    const typeLower = bet.type.toLowerCase().replace(/đ/g, "d");
    const isDa = typeLower === "da" ||
                 typeLower.includes("xien") ||
                 typeLower === "x" ||
                 typeLower === "d" ||
                 typeLower === "dx";
                 
    const is7Lo = typeLower.includes("7lo") || typeLower === "7l";
                 
    const isBao = !is7Lo && (
                  typeLower.includes("bao") || 
                  typeLower.includes("blo") || 
                  typeLower === "lo" || 
                  typeLower === "b"
                );
                   
    let pts = 0;
    let name = "";
    if (isDa) {
      pts = bet.amount * 2 * bet.stationCount * bet.numbers.length;
      name = "Đá xiên";
    } else if (is7Lo) {
      pts = bet.amount * bet.numbers.length * bet.stationCount;
      name = "Bao 7 lô";
    } else if (isBao) {
      pts = bet.amount * bet.numbers.length * bet.stationCount;
      if (bet.isFourDigit) {
        name = "Bao 4 số";
      } else if (bet.isThreeDigit) {
        name = "Bao 3 số";
      } else {
        name = "Bao 2 số";
      }
    } else {
      pts = bet.amount * bet.numbers.length * bet.stationCount;
      if (typeLower === "dd" || typeLower === "dauduoi") {
        name = "Đầu đuôi";
      } else if (typeLower === "xc" || typeLower === "xiuchu") {
        name = "Xỉu chủ";
      } else if (typeLower === "bacang") {
        name = "Ba càng";
      } else {
        name = bet.type.toUpperCase();
      }
    }
    
    if (pts > 0 && name) {
      betCategories[name] = (betCategories[name] || 0) + pts;
    }
  });

  // Aggregated summary for sticky note
  const getRegionalSummaries = () => {
    const summaries: Record<
      string,
      Record<
        string,
        {
          name: string
          role: string
          totalPoints: number
          winPoints: number
          totalInvestment: number
          totalPrize: number
        }
      >
    > = {
      MN: {},
      MT: {},
      MB: {}
    }

    allBills.forEach(b => {
      const reg = b.region;
      if (!summaries[reg]) summaries[reg] = {};
      const cId = b.customerId;
      
      // Calculate total points for this bill
      const billPts = b.details.reduce((acc, curr) => {
        const typeNorm = curr.betType.toLowerCase().replace(/đ/g, "d");
        const isDaOrXien = typeNorm === "da" || typeNorm.includes("xien") || typeNorm === "x" || typeNorm === "d" || typeNorm === "dx";
        const numCount = curr.betNumber.split(/[-_,]+/).filter(Boolean).length;
        const p = isDaOrXien
          ? curr.pricePerUnit * 2 * (curr.stationCount || 1)
          : curr.pricePerUnit * (curr.stationCount || 1) * numCount;
        return acc + p;
      }, 0);

      // Calculate total points won for this bill
      const billWinPts = b.details.filter(d => d.isWin).reduce((acc, curr) => {
        return acc + (curr.pricePerUnit * curr.winQuantity);
      }, 0);

      if (!summaries[reg][cId]) {
        summaries[reg][cId] = {
          name: b.customer.name,
          role: b.customer.role,
          totalPoints: 0,
          winPoints: 0,
          totalInvestment: 0,
          totalPrize: 0
        };
      }

      summaries[reg][cId].totalPoints += billPts;
      summaries[reg][cId].winPoints += billWinPts;
      summaries[reg][cId].totalInvestment += b.totalInvestment || 0;
      summaries[reg][cId].totalPrize += b.totalPrize || 0;
    });

    return summaries;
  };

  const regionalSummaries = getRegionalSummaries();

  // Update URL internally when region or date changes so tabs inherit correctly
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('region', region)
    params.set('date', dateStr)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [region, dateStr, router, searchParams])

  const onSubmit = (data: FormData) => {
    data.append("customerId", customer.id)
    data.append("region", region)
    data.append("rawInput", rawInput)
    data.append("date", dateStr)

    startTransition(async () => {
      const res = await createTicket(data)
      if (res.error) {
        setSaveMsg({ success: false, text: res.error })
      } else {
        setSaveMsg({ success: true, text: "Lưu phơi thành công!" })
        setRawInput("")
        router.refresh()
      }
    })
  }

  const onFetchAndCheck = async (targetRegion: "MN" | "MT" | "MB") => {
    setIsChecking(true)
    setRssMsg(null)
    setRegion(targetRegion) // Sync the current active tab to the region being checked

    // Use the explicit dayOfWeek index from state
    const res = await fetchAndCheckResults(targetRegion, dateStr, parseInt(dayOfWeek))

    if (res.success) {
      setRssMsg({ success: true, text: res.message! })
      setRssTitle(res.rssTitle || "")
      setRssResults(res.rssResults || null)
      startTransition(() => {
        router.refresh()
      })
    } else {
      setRssMsg({ success: false, text: res.error! })
    }

    setIsChecking(false)
  }

  return (
    <div className="flex flex-col gap-8">
      <form action={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-stretch items-start">
          <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label>Khách hàng / Thầu</Label>
                <div className="flex h-10 w-full items-center rounded-md border border-border bg-card-bg/50 px-3 py-2 text-sm text-foreground/80 cursor-not-allowed">
                  {customer.name} (Xác: {customer.ratePay} - Trúng: {customer.rateWin})
                </div>
              </div>
              <div className="space-y-2">
                <Label>Miền</Label>
                <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={`flex-1 transition-all h-11 font-bold ${region === "MN" ? "btn-segment-active" : "btn-segment"}`}
                  onClick={() => setRegion("MN")}
                >
                  Miền Nam
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`flex-1 transition-all h-11 font-bold ${region === "MT" ? "btn-segment-active" : "btn-segment"}`}
                  onClick={() => setRegion("MT")}
                >
                  Miền Trung
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`flex-1 transition-all h-11 font-bold ${region === "MB" ? "btn-segment-active" : "btn-segment"}`}
                  onClick={() => setRegion("MB")}
                >
                  Miền Bắc
                </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Ngày / Thứ</Label>
                <Select value={dayOfWeek} onValueChange={handleDayChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ngày xổ số" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATION_MAP[region]?.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[10px] text-muted-foreground mt-1">
                  Ngày tương ứng: <span className="font-mono font-bold text-primary">{dateStr}</span>
                </div>
              </div>

              <div className="space-y-2 text-muted-foreground text-sm">
                <i>* Ngày tháng thực tế ghi vào DB vẫn theo Calendar, ô này để xác định đài.</i>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label>Phơi số (Cú pháp: [Số đài]. [Loại]. [Các số]. [Tiền])</Label>
              <Textarea
                placeholder="Ví dụ:&#10;2dai. bao. 08-12. 20n&#10;TPHCM. da. 34-45. 10n"
                rows={10}
                className="font-mono text-base bg-foreground/5 text-foreground border-border/50 resize-y focus-visible:ring-primary"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full h-full">
            <Card className="border-border bg-card-bg shadow-sm flex flex-col h-full min-h-[400px]">
              <CardHeader className="bg-foreground/5 border-b border-border flex-none">
                <CardTitle className="text-xl text-foreground">Kiểm Tra Phơi</CardTitle>
              </CardHeader>

              <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
                <div className="space-y-2 text-sm text-foreground/60 font-mono">
                  {!rawInput && <div className="text-foreground/50 italic">Bắt đầu gõ để xem kết quả phân tích...</div>}
                  {parseResult.bets.map((bet, i) => (
                    <div key={i} className="flex justify-between border-b border-border/50 border-dashed pb-2">
                      <span>
                        <span className="text-foreground/80 font-semibold text-xs mr-2 border border-border/40 px-1 py-0.5 rounded bg-background/50">
                          {bet.stationAliases && bet.stationAliases.length > 0
                            ? bet.stationAliases.join(',')
                            : `${bet.stationCount}dai`}
                        </span>
                        {bet.type} <strong className="text-foreground">{bet.numbers.join(', ')}</strong>
                      </span>
                      <span className="text-right text-primary font-bold">{formatPoints(bet.amount)}n</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 pt-4 border-t border-border space-y-3 bg-card-bg flex-none rounded-b-xl">
                {Object.keys(betCategories).length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-foreground/50 border-b border-border/20 pb-3 mb-2 font-semibold">
                    {Object.entries(betCategories).map(([name, pts]) => (
                      <span key={name}>
                        {name}: <strong className="text-primary font-bold">{formatPoints(pts)}n</strong>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center text-lg">
                  <span className="text-foreground/60">Tổng tiền</span>
                  <span className="font-bold text-primary">{formatPoints(parseResult.totalPoints)}</span>
                </div>
                <div className="flex justify-between items-center text-xl">
                  <span className="text-foreground/60">Tiền Xác:</span>
                  <span className="font-bold text-rose-500">-{formatMoney(totalCapitalK)}k</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            type="submit"
            variant="premium"
            className="w-full h-14 text-xl font-black rounded-2xl hvr-lift shadow-[0_10px_30px_var(--primary-glow)]"
            disabled={!parseResult.isValid || parseResult.bets.length === 0 || isPending}
          >
            {isPending ? "ĐANG LƯU..." : "LƯU PHƠI VÀO SỔ"}
          </Button>
          {saveMsg && (
            <div className={`mt-2 p-3 rounded-md border text-sm ${saveMsg.success ? 'bg-green-900/30 border-green-800 text-green-300' : 'bg-red-900/30 border-red-800 text-red-300'}`}>
              {saveMsg.text}
            </div>
          )}
        </div>
      </form>

      {/* Container Hiển thị Phơi đã Lưu */}
      <div className="mt-12 pt-8 border-t border-border">
        <TicketList
          bills={bills}
          currentRegion={region}
          dateStr={dateStr}
          onEdit={(content) => {
            setRawInput(content)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onCheckRSS={onFetchAndCheck}
          isChecking={isChecking}
          checkResultMsg={rssMsg}
          customers={customers}
          activeCustomerId={customer.id}
          activeCustomerRole={customer.role}
          rssResults={rssResults}
          rssTitle={rssTitle}
        />
        
        {/* THỐNG KÊ 3 MIỀN CHO KHÁCH */}
        <CustomerSummary bills={bills} customerName={customer.name} customerRole={customer.role} />
      </div>

      {/* FLOAT STICKY NOTE POPUP */}
      <div className="fixed right-4 bottom-20 md:bottom-4 z-50 transition-all duration-300">
        {stickyCollapsed ? (
          <Button
            type="button"
            className="flex items-center gap-2 rounded-full h-12 px-4 bg-gradient-to-r from-primary to-accent text-white shadow-lg border border-primary-light hover:scale-105 transition-transform"
            onClick={() => setStickyCollapsed(false)}
          >
            <Pin className="w-4 h-4 animate-bounce" />
            <span className="font-bold text-xs uppercase tracking-wider">Xem Điểm Nhanh</span>
          </Button>
        ) : (
          <Card className="w-80 border-border/80 bg-card-bg/95 backdrop-blur-md shadow-2xl overflow-hidden rounded-2xl flex flex-col border-2 max-h-[450px]">
            <CardHeader className="bg-foreground/5 border-b border-border/40 py-3 px-4 flex flex-row justify-between items-center flex-none">
              <CardTitle className="text-sm font-black text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                <Pin className="w-4 h-4 text-primary" />
                Ghi chú điểm hôm nay
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-7 h-7 hover:bg-foreground/10 text-foreground/60 rounded-lg shrink-0"
                onClick={() => setStickyCollapsed(true)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <div className="p-4 overflow-y-auto space-y-4 text-sm font-sans flex-1 scrollbar-hide">
              {Object.entries(regionalSummaries).map(([reg, custMap]) => {
                const nameOrder = [
                  "khách",
                  "thầu nị",
                  "thầu mẹ",
                  "thầu nghĩa",
                  "cậu 3 nơ",
                  "chạy dùm mẹ",
                  "nị ăn"
                ];
                const customersList = Object.values(custMap)
                  .filter(c => c.totalPoints > 0)
                  .sort((a, b) => {
                    const idxA = nameOrder.indexOf(a.name.toLowerCase().trim());
                    const idxB = nameOrder.indexOf(b.name.toLowerCase().trim());
                    const sortA = idxA === -1 ? 999 : idxA;
                    const sortB = idxB === -1 ? 999 : idxB;
                    return sortA - sortB;
                  });
                if (customersList.length === 0) return null;

                const regionConfig: Record<string, { name: string, textClass: string, pingClass: string }> = {
                  MN: { name: "Miền Nam", textClass: "text-primary", pingClass: "bg-primary" },
                  MT: { name: "Miền Trung", textClass: "text-amber-400", pingClass: "bg-amber-400" },
                  MB: { name: "Miền Bắc", textClass: "text-sky-400", pingClass: "bg-sky-400" }
                };

                const config = regionConfig[reg] || { name: reg, textClass: "text-primary", pingClass: "bg-primary" };
                const isCollapsed = collapsedRegions[reg] || false;

                return (
                  <div key={reg} className="space-y-2 border-b border-border/20 last:border-b-0 pb-3 last:pb-0">
                    <h4 
                      className={`font-extrabold ${config.textClass} text-xs uppercase tracking-widest flex items-center justify-between cursor-pointer select-none hover:opacity-80 transition-opacity py-1`}
                      onClick={() => setCollapsedRegions(prev => ({ ...prev, [reg]: !prev[reg] }))}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${config.pingClass} animate-ping`}></span>
                        {config.name}
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-foreground/40" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-foreground/40" />
                      )}
                    </h4>
                    {!isCollapsed && (
                      <div className="space-y-1.5 pl-2 font-mono text-xs">
                        {customersList.map((c, idx) => {
                          const isThau = c.role === "THAU" || c.name.toLowerCase().includes('thầu') || c.name.toLowerCase().includes('thau');
                          const netProfit = c.totalInvestment - c.totalPrize;
                          const word = isThau ? (netProfit >= 0 ? 'Bù' : 'Thu') : (netProfit >= 0 ? 'Thu' : 'Bù');
                          const moneyDiff = Math.abs(netProfit);

                          return (
                            <div key={idx} className="flex flex-col border-b border-foreground/5 py-1.5 last:border-0">
                              <span className="font-bold text-foreground/90 text-[13px]">{c.name}</span>
                              <span className="text-foreground/60 mt-0.5">
                                Tổng <strong className="text-primary">{c.totalPoints}n</strong>
                                {" "}|{" "}
                                Trúng <strong className={c.winPoints > 0 ? "text-rose-500 font-bold" : "text-foreground/40"}>{c.winPoints}n</strong>
                                {" "}|{" "}
                                {word} <strong className="text-primary dark:text-primary-light font-extrabold">{formatMoney(moneyDiff)}k</strong>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {Object.values(regionalSummaries).every(m => Object.values(m).filter(c => c.totalPoints > 0).length === 0) && (
                <div className="text-center text-foreground/30 italic py-6 text-xs">
                  Chưa có phơi số nào trong ngày này.
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
