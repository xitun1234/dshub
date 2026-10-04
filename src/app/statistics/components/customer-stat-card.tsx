"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"

interface RegionData {
  inv: number
  prize: number
}

interface CustomerStat {
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

export function CustomerStatCard({ 
  stat
}: { 
  stat: CustomerStat
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const tProfit = stat.total.profit
  
  const regions = [
    { key: 'MN', name: 'Miền Nam', data: stat.MN },
    { key: 'MT', name: 'Miền Trung', data: stat.MT },
    { key: 'MB', name: 'Miền Bắc', data: stat.MB }
  ]

  return (
    <Card className="bg-card-bg border-border shadow-sm overflow-hidden transition-all duration-300">
      <div 
        className="bg-foreground/5 border-b border-border px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-foreground/10 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="text-foreground/40">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            {stat.name} 
            {!stat.isActive && <span className="text-[10px] px-2 py-0.5 rounded-sm bg-foreground/10 text-foreground/50 font-normal">Ngừng</span>}
          </h3>
        </div>
        <div className={`font-bold text-lg ${tProfit > 0 ? 'text-emerald-500' : tProfit < 0 ? 'text-rose-500' : 'text-foreground/50'}`}>
          {stat.role === "THAU" 
            ? (tProfit >= 0 ? "Bù" : "Thu") 
            : (tProfit >= 0 ? "Thu" : "Bù")} {formatMoney(Math.abs(tProfit))}k
        </div>
      </div>
      
      {isExpanded && (
        <CardContent className="p-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-1 p-6 overflow-x-auto scrollbar-hide">
            <table className="w-full text-sm text-center border-collapse min-w-[600px]">
              <thead className="text-foreground/40 border-b border-border/50">
                <tr>
                  <th className="pb-2 font-medium text-left">Miền</th>
                  <th className="pb-2 font-medium text-right text-rose-500/80">Vốn (Xác)</th>
                  <th className="pb-2 font-medium text-right text-sky-400/80">Trúng</th>
                  <th className="pb-2 font-medium text-right">Lời / Lỗ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {regions.map(r => {
                  if (r.data.inv === 0 && r.data.prize === 0) return null
                  const rProfit = r.data.inv - r.data.prize
                  return (
                    <tr key={r.key} className="hover:bg-foreground/[0.02]">
                      <td className="py-2 text-left font-medium">{r.key}</td>
                      <td className="py-2 text-right">{formatMoney(r.data.inv)}</td>
                      <td className="py-2 text-right text-sky-400/60">{formatMoney(r.data.prize)}</td>
                      <td className={`py-2 text-right font-medium ${rProfit > 0 ? 'text-emerald-500/80' : rProfit < 0 ? 'text-rose-500/80' : 'text-foreground/20'}`}>
                        {rProfit > 0 ? '+' : ''}{rProfit !== 0 ? formatMoney(rProfit) : '0'}
                      </td>
                    </tr>
                  )
                })}
                <tr className="font-bold bg-foreground/5">
                  <td className="py-3 text-left pl-2">TỔNG CỘNG</td>
                  <td className="py-3 text-right text-rose-500">{formatMoney(stat.total.inv)}</td>
                  <td className="py-3 text-right text-sky-400">{formatMoney(stat.total.prize)}</td>
                  <td className={`py-3 text-right pr-2 ${stat.total.profit > 0 ? 'text-emerald-500' : stat.total.profit < 0 ? 'text-rose-500' : 'text-foreground/20'}`}>
                    {stat.total.profit > 0 ? '+' : ''}{stat.total.profit !== 0 ? formatMoney(stat.total.profit) : '0'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="w-full md:w-[350px] shrink-0 bg-background/30 p-6 flex flex-col justify-center space-y-3">
            <p className="text-xs text-foreground/40 font-black uppercase tracking-widest">Tin nhắn gửi khách</p>
            <textarea 
              readOnly
              className="w-full h-32 bg-card-bg/50 border border-emerald-500/20 rounded-lg p-3 text-sm font-sans font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/50 leading-relaxed whitespace-pre overflow-x-auto shadow-inner"
              value={stat.copyText}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <p className="text-[10px] text-foreground/30 text-center italic mt-1">
              (Bấm vào ô trên để tự động bôi đen và Copy)
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
