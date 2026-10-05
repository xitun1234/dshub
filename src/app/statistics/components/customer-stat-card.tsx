"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, ImageDown } from "lucide-react"

interface WinningDetail {
  betNumber: string
  betType: string
  winQuantity: number
  pricePerUnit: number
  prize: number
  stations: string[]
}

interface RegionData {
  inv: number
  prize: number
  winningDetails?: WinningDetail[]
}

interface CustomerStat {
  id: string
  name: string
  isActive: boolean
  role: string
  total: { profit: number, inv: number, prize: number }
  MN: RegionData
  MT: RegionData
  MB: RegionData
  copyText: string
}

function formatMoney(amount: number): string {
  const absolute = Math.abs(Math.round(amount));
  if (absolute < 10000) {
    return absolute.toString();
  }
  return absolute.toLocaleString('vi-VN');
}

function formatPoints(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount);
}
export function CustomerStatCard({
  stat,
  selectedDate
}: {
  stat: CustomerStat
  selectedDate: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({})

  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => ({ ...prev, [region]: !prev[region] }))
  }

  const tProfit = stat.total.profit
  
  const regions = [
    { key: 'MN', name: 'Miền Nam', data: stat.MN },
    { key: 'MT', name: 'Miền Trung', data: stat.MT },
    { key: 'MB', name: 'Miền Bắc', data: stat.MB }
  ]

  return (
    <Card className="bg-card-bg border-border shadow-sm overflow-hidden transition-all duration-300">
      <div
        className="flex cursor-pointer flex-col gap-3 border-b border-border bg-foreground/5 px-4 py-4 transition-colors hover:bg-foreground/10 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            {stat.name} 
            {!stat.isActive && <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border font-medium">Ngừng</span>}
          </h3>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-4">
          <div className={`font-bold text-lg ${tProfit > 0 ? 'text-emerald-500' : tProfit < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
            {stat.role === "THAU"
              ? (tProfit >= 0 ? "Bù" : "Thu")
              : (tProfit >= 0 ? "Thu" : "Bù")} {formatMoney(Math.abs(tProfit))}k
          </div>
          <Button
            asChild
            variant="outline"
            className="h-11"
            onClick={(event) => event.stopPropagation()}
          >
            <Link
              href={`/statistics/export?customer=${encodeURIComponent(stat.id)}&date=${encodeURIComponent(selectedDate)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ImageDown className="h-4 w-4" />
              Xuất chi tiết
            </Link>
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <CardContent className="p-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-1 p-6 overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm text-center border-collapse min-w-[600px]">
              <thead className="text-muted-foreground border-b border-border">
                <tr>
                  <th className="pb-2 font-medium text-left">Miền</th>
                  <th className="pb-2 font-medium text-right text-rose-500/80">Vốn (Xác)</th>
                  <th className="pb-2 font-medium text-right text-sky-400/80">Trúng</th>
                  <th className="pb-2 font-medium text-right">Thu / Bù</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {regions.map(r => {
                  if (r.data.inv === 0 && r.data.prize === 0) return null
                  const rProfit = r.data.inv - r.data.prize
                  const settlementWord = stat.role === "THAU"
                    ? (rProfit >= 0 ? "Bù" : "Thu")
                    : (rProfit >= 0 ? "Thu" : "Bù")
                  const isRegionExpanded = expandedRegions[r.key]
                  const winningDetails = r.data.winningDetails || []

                  return (
                    <React.Fragment key={r.key}>
                      <tr className="hover:bg-foreground/[0.02] cursor-pointer transition-colors" onClick={() => toggleRegion(r.key)}>
                        <td className="py-2 text-left font-medium text-primary flex items-center gap-1 group">
                          {r.key}
                          <span className={`text-[10px] text-primary/50 transition-transform ${isRegionExpanded ? 'rotate-180' : ''}`}>▼</span>
                        </td>
                        <td className="py-2 text-right">{formatMoney(r.data.inv)}</td>
                        <td className="py-2 text-right text-sky-400/60">{formatMoney(r.data.prize)}</td>
                        <td className={`py-2 text-right font-bold ${rProfit > 0 ? 'text-emerald-500' : rProfit < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                          {rProfit !== 0 ? `${settlementWord} ${formatMoney(Math.abs(rProfit))}` : '0'}
                        </td>
                      </tr>
                      {isRegionExpanded && winningDetails.length > 0 && (
                        <tr className="bg-foreground/[0.01]">
                          <td colSpan={4} className="p-3">
                            <div className="bg-background rounded-lg border border-primary/20 overflow-hidden shadow-inner overflow-x-auto">
                              <table className="w-full text-xs text-left min-w-[450px]">
                                <thead className="bg-primary/10 text-primary">
                                  <tr>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Đài</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Số</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]">Kiểu</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-center">Nháy</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-right">Điểm (n)</th>
                                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-right">Tiền (k)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                  {winningDetails.map((wd, idx) => (
                                    <tr key={idx} className="hover:bg-primary/5">
                                      <td className="px-3 py-2 text-foreground/70">{wd.stations.join(', ')}</td>
                                      <td className="px-3 py-2 font-bold text-foreground text-sm">{wd.betNumber}</td>
                                      <td className="px-3 py-2 text-foreground/70 uppercase">{wd.betType}</td>
                                      <td className="px-3 py-2 text-center font-bold text-primary">{wd.winQuantity}</td>
                                      <td className="px-3 py-2 text-right font-mono text-foreground whitespace-nowrap">
                                        {wd.winQuantity > 1 ? (
                                          <>
                                            <span className="text-muted-foreground font-semibold">{formatPoints(wd.pricePerUnit)}n x {wd.winQuantity}</span>
                                            <span className="font-bold"> = {formatPoints(wd.pricePerUnit * wd.winQuantity)}n</span>
                                          </>
                                        ) : (
                                          <span className="font-bold">{formatPoints(wd.pricePerUnit * wd.winQuantity)}n</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-right font-bold text-sky-500">{formatMoney(wd.prize)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                      {isRegionExpanded && winningDetails.length === 0 && (
                        <tr className="bg-foreground/[0.01]">
                          <td colSpan={4} className="p-3 text-center text-xs text-muted-foreground italic">
                            Chưa có dữ liệu trúng thưởng cho đài này
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
                <tr className="font-bold bg-foreground/5">
                  <td className="py-3 text-left pl-2">TỔNG CỘNG</td>
                  <td className="py-3 text-right text-rose-500">{formatMoney(stat.total.inv)}</td>
                  <td className="py-3 text-right text-sky-400">{formatMoney(stat.total.prize)}</td>
                  <td className={`py-3 text-right pr-2 ${stat.total.profit > 0 ? 'text-emerald-500' : stat.total.profit < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                    {stat.total.profit > 0 ? '+' : ''}{stat.total.profit !== 0 ? formatMoney(stat.total.profit) : '0'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="w-full md:w-[350px] shrink-0 bg-background/30 p-6 flex flex-col justify-center space-y-3">
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Tin nhắn gửi khách</p>
            <textarea 
              readOnly
              className="w-full h-32 bg-card-bg/50 border border-emerald-500/20 rounded-lg p-3 text-sm font-sans font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50 leading-relaxed whitespace-pre overflow-x-auto shadow-inner"
              value={stat.copyText}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <p className="text-[10px] text-muted-foreground text-center italic mt-1">
              (Bấm vào ô trên để tự động bôi đen và Copy)
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
