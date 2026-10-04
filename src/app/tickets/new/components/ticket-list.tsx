"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

type Bill = {
  id: string
  region: string
  rawContent: string
  totalInvestment: number
  totalPrize: number
  status: string
  customer: {
    name: string
    rateWin: number
    rateWin3?: number
    rateWin4?: number
    rateWinDaMNMT?: number
    rateWinDaMB?: number
  }
  details: {
    id: string
    pricePerUnit: number
    winQuantity: number
    isWin: boolean
    betNumber: string
    betType: string
    multiplier: number
    winStations?: string | null
    stationCount: number
  }[]
}
import { Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteTicket } from "../actions"
import { useTransition, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { RssDisplay, RssResults } from "./rss-display"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function TicketList({
  bills,
  currentRegion,
  onEdit,
  onCheckRSS,
  isChecking,
  checkResultMsg,
  customers,
  activeCustomerId,
  activeCustomerRole,
  dateStr,
  rssResults,
  rssTitle
}: {
  bills: Bill[],
  currentRegion: string,
  onEdit: (rawContent: string) => void,
  onCheckRSS?: (region: "MN" | "MT" | "MB") => void,
  isChecking?: boolean,
  checkResultMsg?: { success: boolean, text: string } | null,
  customers?: { id: string, name: string, ratePay?: number, rateWin?: number }[],
  activeCustomerId?: string,
  activeCustomerRole?: string,
  dateStr?: string,
  rssResults?: RssResults | null,
  rssTitle?: string
}) {
  const [isPending, startTransition] = useTransition()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()

  // Support select all text inside code block when user hovers and presses Ctrl+A / Cmd+A
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        const hoveredCodeEl = document.querySelector('.phoi-code-block:hover');
        if (hoveredCodeEl) {
          e.preventDefault();
          const range = document.createRange();
          range.selectNodeContents(hoveredCodeEl);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({
    MN: false,
    MT: false,
    MB: false
  })

  const toggleRegion = (regionId: string) => {
    setExpandedRegions(prev => ({
      ...prev,
      [regionId]: !prev[regionId]
    }))
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = () => {
    if (!deleteId) return
    startTransition(async () => {
      const res = await deleteTicket(deleteId)
      if (res.error) alert(res.error)
      else router.refresh()
      setDeleteId(null)
    })
  }

  // No longer filtering by currentRegion for the whole list
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


  const getDayOfWeekLabel = (dateString: string) => {
    const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"]
    const [y, m, d] = dateString.split('-').map(Number)
    const dayIndex = new Date(y, m - 1, d).getDay()
    return days[dayIndex]
  }

  const regions: { id: "MN" | "MT" | "MB", name: string }[] = [
    { id: "MN", name: "Miền Nam" },
    { id: "MT", name: "Miền Trung" },
    { id: "MB", name: "Miền Bắc" }
  ]

  return (
    <div className="mt-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
          <h2 className="text-base font-black tracking-tight text-foreground/80 shrink-0 whitespace-nowrap">
            {dateStr && `${getDayOfWeekLabel(dateStr)} - ${dateStr}`}
          </h2>

          {customers && customers.length > 0 && activeCustomerId && (
            <div className="flex gap-1.5 flex-wrap py-1">
              {customers.map(c => {
                const isActive = activeCustomerId === c.id
                return (
                  <Link
                    key={c.id}
                    href={`/tickets/new?customer=${c.id}${currentRegion ? `&region=${currentRegion}` : ''}${dateStr ? `&date=${dateStr}` : ''}`}
                  >
                    <button
                      className={`px-3 py-1.5 rounded-xl transition-all font-bold whitespace-nowrap border text-xs ${isActive
                        ? "bg-gradient-to-br from-primary to-accent text-white border-primary-glow shadow-[0_8px_20px_var(--primary-glow)] scale-105 z-10"
                        : "bg-white/5 text-foreground/80 border-white/10 hover:text-primary hover:bg-primary/10 hover:border-primary/30"
                        }`}
                    >
                      {c.name}
                      <small className={`block text-[9px] mt-0.5 font-black tracking-wider uppercase ${isActive ? "text-white/80" : "text-foreground/40"}`}>
                        Xác: {c.ratePay || '0.72'} - Ăn: {c.rateWin || '71'}
                      </small>
                    </button>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {regions.map(r => {
          const regionBills = bills.filter(b => b.region === r.id)
          const isExpanded = expandedRegions[r.id]
          const billCount = regionBills.length

          return (
            <div key={r.id} className="space-y-6 pt-2 first:pt-0">
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card-bg/30 p-4 rounded-xl border border-border/40 cursor-pointer hover:bg-card-bg/50 transition-all group"
                onClick={() => toggleRegion(r.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-foreground/30 transition-transform group-hover:scale-110">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                  <div className={`h-6 w-1.5 rounded-full ${billCount > 0 ? 'bg-primary' : 'bg-foreground/10'}`}></div>
                  <h3 className={`text-xl font-extrabold ${billCount > 0 ? 'text-foreground' : 'text-foreground/40'}`}>
                    Phơi {r.name}
                  </h3>
                  <Badge variant="outline" className={`${billCount > 0 ? 'text-primary/70 border-primary/20 bg-primary/5' : 'text-foreground/40 border-border/40'} font-black px-2`}>
                    {billCount} phơi
                  </Badge>
                </div>

                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  {onCheckRSS && (
                    <div className="flex items-center gap-3">
                      {checkResultMsg && currentRegion === r.id && (
                        <span className={`text-sm font-medium ${checkResultMsg.success ? 'text-primary' : 'text-rose-400'}`}>
                          {checkResultMsg.text}
                        </span>
                      )}
                      <Button
                        onClick={() => {
                          if (!isExpanded) toggleRegion(r.id)
                          onCheckRSS(r.id)
                        }}
                        disabled={isChecking}
                        size="sm"
                        className="bg-primary/90 hover:bg-primary text-white shadow-sm transition-all h-9 font-bold px-4 rounded-lg"
                      >
                        {isChecking && currentRegion === r.id ? "Đang dò..." : `Dò KQ ${r.name}`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-16 animate-in fade-in slide-in-from-top-4 duration-500">
                  {billCount > 0 ? (
                    <>
                      <Card className="bg-card-bg border-border shadow-sm border-none overflow-hidden">
                        <div className="rounded-md border border-border overflow-x-auto pb-2">
                          <table className="w-full text-sm text-left min-w-[700px]">
                            <thead className="bg-foreground/5 text-foreground/60 font-medium border-b border-border">
                              <tr>
                                <th className="px-4 py-3 text-center w-12">#</th>
                                <th className="px-4 py-3">Khách hàng</th>
                                <th className="px-4 py-3">Phơi gốc</th>
                                <th className="px-4 py-3 text-right">Tổng điểm</th>
                                <th className="px-4 py-3 text-right">Tổng tiền</th>
                                <th className="px-4 py-3 text-right">Tiền xác</th>
                                <th className="px-4 py-3 text-right">Tiền Trúng</th>
                                <th className="px-4 py-3 text-right">Hành động</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {regionBills.map((bill, index) => (
                                <tr key={bill.id} className="hover:bg-primary/5 transition-colors border-b border-border/50">
                                  <td className="px-4 py-3 text-center text-foreground/40">{index + 1}</td>
                                  <td className="px-4 py-3 font-medium text-foreground">{bill.customer.name}</td>
                                  <td className="px-4 py-3">
                                    <code className="phoi-code-block cursor-text select-all text-sm font-bold tracking-wide bg-foreground/5 px-2 py-1.5 rounded text-foreground whitespace-pre-wrap break-words block w-full leading-relaxed">
                                      {bill.rawContent}
                                    </code>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-primary font-bold">
                                    {(() => {
                                      const pts = bill.details.reduce((acc, curr) => {
                                        const typeNorm = curr.betType.toLowerCase().replace(/đ/g, "d");
                                        const isDaOrXien = typeNorm === "da" || typeNorm.includes("xien") || typeNorm === "x" || typeNorm === "d" || typeNorm === "dx";
                                        const numCount = curr.betNumber.split(/[-_,]+/).filter(Boolean).length;
                                        const p = isDaOrXien
                                          ? curr.pricePerUnit * 2 * (curr.stationCount || 1)
                                          : curr.pricePerUnit * (curr.stationCount || 1) * numCount;
                                        return acc + p;
                                      }, 0);
                                      return `${formatMoney(pts)}n`;
                                    })()}
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-foreground font-medium">
                                    {(() => {
                                      const money = bill.details.reduce((acc, curr) => {
                                        const typeNorm = curr.betType.toLowerCase().replace(/đ/g, "d");
                                        const isDaOrXien = typeNorm === "da" || typeNorm.includes("xien") || typeNorm === "x" || typeNorm === "d" || typeNorm === "dx";
                                        const numCount = curr.betNumber.split(/[-_,]+/).filter(Boolean).length;
                                        const p = isDaOrXien
                                          ? curr.pricePerUnit * 2 * (curr.stationCount || 1) * curr.multiplier
                                          : curr.pricePerUnit * (curr.stationCount || 1) * numCount * curr.multiplier;
                                        return acc + p;
                                      }, 0);
                                      return `${formatMoney(money)}k`;
                                    })()}
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-rose-500">
                                    {formatMoney(bill.totalInvestment)}k
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    {bill.status === 'processed' ? (
                                      bill.totalPrize > 0 ? (
                                        <span className="font-bold text-sky-400">+{formatMoney(bill.totalPrize)}k</span>
                                      ) : (
                                        <span className="text-foreground/40 font-medium italic">Trượt</span>
                                      )
                                    ) : (
                                      <Badge variant="outline" className="text-amber-500/80 border-amber-500/30">Chờ kết quả</Badge>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-neutral-500 dark:text-neutral-400 hover:text-blue-500 hover:bg-blue-500/10"
                                        onClick={() => onEdit(bill.rawContent)}
                                        disabled={isPending}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-neutral-500 dark:text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10"
                                        onClick={() => handleDelete(bill.id)}
                                        disabled={isPending}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>

                      {/* Regional Summary Selection */}
                      {(() => {
                        const rCapital = regionBills.reduce((acc, b) => acc + b.totalInvestment, 0)
                        const rPrize = regionBills.reduce((acc, b) => acc + (b.totalPrize || 0), 0)
                        const rProfit = rCapital - rPrize

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <Card className="bg-rose-500/10 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.05)] overflow-hidden min-h-[100px] flex flex-col justify-center backdrop-blur-md border-2 hover:bg-rose-500/15 transition-all">
                              <CardContent className="p-5 flex flex-col items-center">
                                <p className="text-xs uppercase tracking-widest text-rose-500/60 mb-2 font-black">XÁC {r.name}</p>
                                <p className="text-3xl font-black text-rose-500 drop-shadow-[0_2px_8px_rgba(244,63,94,0.3)]">{formatMoney(rCapital)}k</p>
                              </CardContent>
                            </Card>

                            <Card className="bg-sky-500/10 border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.05)] overflow-hidden min-h-[100px] flex flex-col justify-center backdrop-blur-md border-2 hover:bg-sky-500/15 transition-all">
                              <CardContent className="p-5 flex flex-col items-center">
                                <p className="text-xs uppercase tracking-widest text-sky-500/60 mb-2 font-black">TRÚNG {r.name}</p>
                                <p className="text-3xl font-black text-sky-500 dark:text-sky-400 drop-shadow-[0_2px_8px_rgba(14,165,233,0.3)]">
                                  {rPrize > 0 ? `+${formatMoney(rPrize)}` : '0'}k
                                </p>
                              </CardContent>
                            </Card>

                            <Card className={`relative overflow-hidden min-h-[100px] flex flex-col justify-center backdrop-blur-md border-2 transition-all ${rProfit > 0
                              ? 'bg-primary/15 border-primary/30 shadow-[0_0_20px_var(--primary-glow)] hover:bg-primary/20'
                              : rProfit < 0
                                ? 'bg-rose-500/15 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.1)] hover:bg-rose-500/20'
                                : 'bg-card-bg/40 border-border/40'
                              }`}>
                              <CardContent className="p-5 flex flex-col items-center relative z-10">
                                <p className={`text-xs uppercase tracking-widest mb-2 font-black ${rProfit > 0 ? 'text-primary/60' : rProfit < 0 ? 'text-rose-500/60' : 'text-neutral-500'
                                  }`}>
                                  {activeCustomerRole === "THAU"
                                    ? (rProfit >= 0 ? "BÙ" : "THU")
                                    : (rProfit >= 0 ? "THU" : "BÙ")} {r.name}
                                </p>
                                <p className={`text-3xl font-black drop-shadow-lg ${rProfit > 0 ? 'text-primary' : rProfit < 0 ? 'text-rose-500' : 'text-neutral-500 dark:text-neutral-300'
                                  }`}>
                                  {formatMoney(Math.abs(rProfit))}k
                                </p>
                              </CardContent>
                              {rProfit !== 0 && (
                                <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-20 ${rProfit > 0 ? 'bg-primary' : 'bg-rose-500'
                                  }`} />
                              )}
                            </Card>
                          </div>
                        )
                      })()}

                      {/* Winners per region */}
                      <WinnersList bills={regionBills} formatMoney={formatMoney} formatPoints={formatPoints} regionName={r.name} />
                    </>
                  ) : (
                    <div className="p-12 text-center text-foreground/40 border-2 border-dashed border-border/20 rounded-2xl italic font-medium">
                      Chưa có phơi nào được nhập for {r.name}
                    </div>
                  )}

                  {/* RSS per region - only show if it matches active sync region */}
                  {rssResults && rssTitle && currentRegion === r.id && (
                    <div className="bg-background/20 rounded-xl p-6 border border-border/40">
                      <RssDisplay title={rssTitle} results={rssResults} region={r.id} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {bills.length === 0 && (
          <div className="pt-12 text-center text-foreground/40 font-bold italic">
            Danh sách phơi hôm nay trống.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card-bg border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Xác nhận xoá phơi</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/60">
              Bạn có chắc chắn muốn xoá phơi này? Hành động này không thể hoàn tác và dữ liệu sẽ mất vĩnh viễn khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-foreground/10 text-foreground border-border hover:bg-foreground/20 hover:text-foreground">
              Huỷ bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isPending}
              className="bg-rose-500 text-white hover:bg-rose-600 border-none shadow-sm"
            >
              {isPending ? "Đang xoá..." : "Xoá vĩnh viễn"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function WinnersList({ bills, formatMoney, formatPoints, regionName }: { bills: Bill[], formatMoney: (val: number) => string, formatPoints: (val: number) => string, regionName: string }) {
  const winningBills = bills.filter(b => b.status === "processed" && b.totalPrize > 0)

  if (winningBills.length === 0) return null

  const winningDetails = winningBills.flatMap(bill =>
    bill.details.filter(d => d.isWin).map(d => {
      const typeNorm = d.betType.toLowerCase().replace(/đ/g, "d");
      const is4D = d.betNumber.length === 4;
      const is3D = d.betNumber.length === 3 ||
        typeNorm.includes("bacang") ||
        typeNorm.includes("xc") ||
        typeNorm.includes("xiuchu");

      const isDa = typeNorm === "da" ||
        typeNorm.includes("xien") ||
        typeNorm === "x" ||
        typeNorm === "d" ||
        typeNorm === "dx";

      let winRateApplied = bill.customer.rateWin;
      if (is4D) {
        winRateApplied = (bill.customer as any).rateWin4 ?? 5500;
      } else if (is3D) {
        winRateApplied = (bill.customer as any).rateWin3 ?? 650;
      } else if (isDa) {
        winRateApplied = bill.region === "MB"
          ? ((bill.customer as any).rateWinDaMB ?? 650)
          : ((bill.customer as any).rateWinDaMNMT ?? 650);
      }

      const prize = d.winQuantity * d.pricePerUnit * winRateApplied;

      return {
        id: d.id,
        customerName: bill.customer.name,
        betType: d.betType,
        betNumber: d.betNumber,
        winQuantity: d.winQuantity,
        prize: prize,
        pricePerUnit: d.pricePerUnit,
        rawContent: bill.rawContent,
        winStations: d.winStations ? JSON.parse(d.winStations) : []
      }
    })
  )

  if (winningDetails.length === 0) return null

  const totalPrizeAll = winningDetails.reduce((acc, curr) => acc + curr.prize, 0)
  const totalPointsWin = winningDetails.reduce((acc, curr) => acc + (curr.pricePerUnit * curr.winQuantity), 0)

  let totalDaXienPoints = 0
  let totalXePoints = 0
  let totalDeBaPoints = 0
  let totalFourDigitPoints = 0
  let totalDauDuoiPoints = 0
  let total7LoPoints = 0
  let totalXiuChuPoints = 0
  let totalBaCangPoints = 0

  winningDetails.forEach(detail => {
    const typeNorm = detail.betType.toLowerCase().replace(/đ/g, "d");
    const isDa = typeNorm === "da" ||
      typeNorm.includes("xien") ||
      typeNorm === "x" ||
      typeNorm === "d" ||
      typeNorm === "dx";

    const isBao = typeNorm.includes("bao") ||
      typeNorm.includes("blo") ||
      typeNorm === "lo" ||
      typeNorm === "b";

    const numLen = detail.betNumber.includes("-")
      ? detail.betNumber.split("-")[0].length
      : detail.betNumber.length;

    const pts = detail.pricePerUnit * detail.winQuantity;

    if (isDa) {
      totalDaXienPoints += pts;
    } else if (typeNorm === "7lo" || typeNorm === "7l") {
      total7LoPoints += pts;
    } else if (typeNorm === "xc" || typeNorm === "xiuchu") {
      totalXiuChuPoints += pts;
    } else if (typeNorm === "bacang") {
      totalBaCangPoints += pts;
    } else if (isBao && numLen === 2) {
      totalXePoints += pts;
    } else if (isBao && numLen === 3) {
      totalDeBaPoints += pts;
    } else if (isBao && numLen === 4) {
      totalFourDigitPoints += pts;
    } else if (typeNorm === "dd" || typeNorm === "dauduoi" || typeNorm === "dau" || typeNorm === "duoi") {
      totalDauDuoiPoints += pts;
    }
  })

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <span>🎉 Danh sách số trúng - {regionName}</span>
          </h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {totalDaXienPoints > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-primary text-white/90 border border-primary/30 shadow-sm">
                Đá xiên trúng: <strong className="font-bold text-white">{formatPoints(totalDaXienPoints)}n</strong>
              </span>
            )}
            {totalXePoints > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-primary text-white/90 border border-primary/30 shadow-sm">
                Xề trúng: <strong className="font-bold text-white">{formatPoints(totalXePoints)}n</strong>
              </span>
            )}
            {total7LoPoints > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-primary text-white/90 border border-primary/30 shadow-sm">
                7 lô trúng: <strong className="font-bold text-white">{formatPoints(total7LoPoints)}n</strong>
              </span>
            )}
            {totalDauDuoiPoints > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-sky-600 text-white/90 border border-sky-500/30 shadow-sm">
                Đầu đuôi trúng: <strong className="font-bold text-white">{formatPoints(totalDauDuoiPoints)}n</strong>
              </span>
            )}
            {totalDeBaPoints > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-cyan-600 text-white/90 border border-cyan-500/30 shadow-sm">
                Đề ba (Bao 3s) trúng: <strong className="font-bold text-white">{formatPoints(totalDeBaPoints)}n</strong>
              </span>
            )}
            {totalXiuChuPoints > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-cyan-600 text-white/90 border border-cyan-500/30 shadow-sm">
                Xỉu chủ trúng: <strong className="font-bold text-white">{formatPoints(totalXiuChuPoints)}n</strong>
              </span>
            )}
            {totalBaCangPoints > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-cyan-600 text-white/90 border border-cyan-500/30 shadow-sm">
                Ba càng trúng: <strong className="font-bold text-white">{formatPoints(totalBaCangPoints)}n</strong>
              </span>
            )}
             {totalFourDigitPoints > 0 && (
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-purple-600 text-white/90 border border-purple-500/30 shadow-sm">
                 Bao 4 số trúng: <strong className="font-bold text-white">{formatPoints(totalFourDigitPoints)}n</strong>
               </span>
             )}
          </div>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30 px-4 py-2 text-xl font-black italic">
            Tổng điểm trúng: {formatPoints(totalPointsWin)}n
          </Badge>
          <Badge className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-sm font-black">
            TỔNG TRÚNG: {formatMoney(totalPrizeAll)}k
          </Badge>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm text-left min-w-[650px]">
            <thead>
              <tr className="bg-primary/10 text-primary font-black border-b border-primary/20">
                <th className="px-6 py-4">ĐÀI TRÚNG</th>
                <th className="px-6 py-4">SỐ TRÚNG</th>
                <th className="px-6 py-4 text-center">NHÁY</th>
                <th className="px-6 py-4 text-right">ĐIỂM (n)</th>
                <th className="px-6 py-4 text-right">TIỀN TRÚNG (k)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {winningDetails.map((detail, idx) => (
                <tr key={idx} className="hover:bg-primary/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {(Array.isArray(detail.winStations) ? detail.winStations : [detail.winStations]).map((station, sIdx) => (
                        <span key={sIdx} className="font-semibold text-foreground/70 bg-foreground/5 rounded px-2 py-0.5 border border-border italic">
                          {station}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-primary group-hover:scale-110 transition-transform origin-left w-fit">
                        {detail.betNumber}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${["bao","blo","lo","b","7lo","7l","da","xien","x","d","dx","xc","xiuchu"].includes(detail.betType.toLowerCase().replace(/đ/g, "d")) ? "text-rose-500" : "text-foreground/40"}`}>{detail.betType.toLowerCase() === "b" ? "bao" : detail.betType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-black">{detail.winQuantity}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-900 dark:text-white whitespace-nowrap">
                    {detail.winQuantity > 1 ? (
                      <>
                        <span className="text-foreground/60 font-semibold">{formatPoints(detail.pricePerUnit)}n x {detail.winQuantity}</span>
                        <span className="font-bold"> = {formatPoints(detail.pricePerUnit * detail.winQuantity)}n</span>
                      </>
                    ) : (
                      <span className="font-bold">{formatPoints(detail.pricePerUnit * detail.winQuantity)}n</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-black text-primary drop-shadow-[0_2px_8px_var(--primary-glow)]">
                      {formatMoney(detail.prize)}k
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
