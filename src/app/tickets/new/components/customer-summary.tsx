"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface Customer {
  id: string
  name: string
  role: string
  rateWin: number
  rateWin3: number
  rateWin4: number
  rateWinDaMNMT: number
  rateWinDaMB: number
}

interface BillDetail {
  betNumber: string
  betType: string
  pricePerUnit: number
  isWin: boolean
  winQuantity: number
  winStations: string | null
}

interface Bill {
  id: string
  region: string
  totalInvestment: number
  totalPrize: number
  status: string
  customer: Customer
  date: string
  details: BillDetail[]
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

export function CustomerSummary({ 
  bills, 
  customerName,
  customerRole
}: { 
  bills: Bill[], 
  customerName: string,
  customerRole?: string
}) {
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});

  const toggleRegion = (region: string) => {
    setExpandedRegions(prev => ({ ...prev, [region]: !prev[region] }));
  };

  if (bills.length === 0) return null;

  const stats = {
    MN: { inv: 0, prize: 0 },
    MT: { inv: 0, prize: 0 },
    MB: { inv: 0, prize: 0 },
    total: { inv: 0, prize: 0, profit: 0 }
  };

  bills.forEach((bill) => {
    const region = bill.region as "MN" | "MT" | "MB";
    const inv = bill.totalInvestment || 0;
    const prize = bill.totalPrize || 0;

    if (stats[region]) {
      stats[region].inv += inv;
      stats[region].prize += prize;
    }

    stats.total.inv += inv;
    stats.total.prize += prize;
  });

  stats.total.profit = stats.total.inv - stats.total.prize;

  // Generate copy text (Logic matches StatisticsPage)
  let copyText = "";
  const isThau = customerRole === "THAU" || customerName.toLowerCase().includes('thầu') || customerName.toLowerCase().includes('thau');
  
  const regions = [
    { key: 'MN', data: stats.MN },
    { key: 'MT', data: stats.MT },
    { key: 'MB', data: stats.MB }
  ];

  regions.forEach(r => {
    if (r.data.inv > 0 || r.data.prize > 0) {
      const rProfit = r.data.inv - r.data.prize;
      const rProfitWord = isThau ? (rProfit >= 0 ? 'Bù' : 'Thu') : (rProfit >= 0 ? 'Thu' : 'Bù')
      copyText += `${r.key} ${formatMoney(r.data.inv)} Trúng ${formatMoney(r.data.prize)} = ${rProfitWord} ${formatMoney(Math.abs(rProfit))}\n`;
    }
  });

  const tProfit = stats.total.profit;
  const tProfitWord = isThau ? (tProfit >= 0 ? 'Bù' : 'Thu') : (tProfit >= 0 ? 'Thu' : 'Bù')
  copyText += `Tổng ${tProfitWord} ${formatMoney(Math.abs(tProfit))}`;

  return (
    <div className="space-y-6 mt-12 pt-8 border-t border-border/50">
      <Card className="bg-card-bg border-border shadow-sm overflow-hidden">
        <div className="bg-foreground/5 border-b border-border px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
            Thống kê tổng hợp: {customerName}
          </h3>
          <div className={`font-bold text-lg ${tProfit > 0 ? 'text-emerald-500' : tProfit < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
            {customerRole === "THAU" 
              ? (tProfit >= 0 ? "Bù" : "Thu") 
              : (tProfit >= 0 ? "Thu" : "Bù")} {formatMoney(Math.abs(tProfit))}k
          </div>
        </div>
        
        <CardContent className="p-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/50">
          <div className="flex-1 p-6 overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
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
                  if (r.data.inv === 0 && r.data.prize === 0) return null;
                  const rProfit = r.data.inv - r.data.prize;
                  const settlementWord = isThau
                    ? (rProfit >= 0 ? "Bù" : "Thu")
                    : (rProfit >= 0 ? "Thu" : "Bù");
                  const isExpanded = expandedRegions[r.key];

                  const rBills = bills.filter(b => b.region === r.key && b.status === "processed" && b.totalPrize > 0);
                  const winningDetails = rBills.flatMap(bill =>
                    bill.details.filter(d => d.isWin).map(d => {
                      const typeNorm = d.betType.toLowerCase().replace(/đ/g, "d");
                      const is4D = d.betNumber.length === 4;
                      const is3D = d.betNumber.length === 3 || typeNorm.includes("bacang") || typeNorm.includes("xc") || typeNorm.includes("xiuchu");
                      const isDa = typeNorm === "da" || typeNorm.includes("xien") || typeNorm === "x" || typeNorm === "d" || typeNorm === "dx";

                      let winRateApplied = bill.customer.rateWin;
                      if (is4D) winRateApplied = bill.customer.rateWin4;
                      else if (is3D) winRateApplied = bill.customer.rateWin3;
                      else if (isDa) winRateApplied = bill.region === "MB"
                        ? bill.customer.rateWinDaMB
                        : bill.customer.rateWinDaMNMT;

                      const prize = d.winQuantity * d.pricePerUnit * winRateApplied;
                      let parsedStations: unknown = [];
                      if (d.winStations) {
                        try {
                          parsedStations = JSON.parse(d.winStations);
                        } catch {
                          parsedStations = [];
                        }
                      }
                      const stations = Array.isArray(parsedStations)
                        ? parsedStations.filter((station): station is string => typeof station === "string")
                        : typeof parsedStations === "string" ? [parsedStations] : [];

                      return {
                        betNumber: d.betNumber,
                        betType: d.betType,
                        winQuantity: d.winQuantity,
                        pricePerUnit: d.pricePerUnit,
                        prize,
                        stations
                      };
                    })
                  );

                  return (
                    <React.Fragment key={r.key}>
                      <tr className="hover:bg-foreground/[0.02] cursor-pointer transition-colors" onClick={() => toggleRegion(r.key)}>
                        <td className="py-3 text-left font-medium text-primary flex items-center gap-1 group">
                          {r.key}
                          <span className={`text-[10px] text-primary/50 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                        </td>
                        <td className="py-3 text-right">{formatMoney(r.data.inv)}</td>
                        <td className="py-3 text-right">{formatMoney(r.data.prize)}</td>
                        <td className={`py-3 text-right font-bold ${rProfit > 0 ? 'text-emerald-500' : rProfit < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                          {rProfit !== 0 ? `${settlementWord} ${formatMoney(Math.abs(rProfit))}` : '0'}
                        </td>
                      </tr>
                      {isExpanded && winningDetails.length > 0 && (
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
                      {isExpanded && winningDetails.length === 0 && (
                        <tr className="bg-foreground/[0.01]">
                          <td colSpan={4} className="p-3 text-center text-xs text-muted-foreground italic">
                            Chưa có dữ liệu trúng thưởng cho đài này
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                <tr className="font-bold bg-foreground/5">
                  <td className="py-3 text-left pl-2">TỔNG CỘNG</td>
                  <td className="py-3 text-right text-rose-500">{formatMoney(stats.total.inv)}</td>
                  <td className="py-3 text-right text-sky-400">{formatMoney(stats.total.prize)}</td>
                  <td className={`py-3 text-right pr-2 ${stats.total.profit > 0 ? 'text-primary' : stats.total.profit < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                    {stats.total.profit > 0 ? '+' : ''}{stats.total.profit !== 0 ? formatMoney(stats.total.profit) : '0'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="w-full xl:w-[400px] shrink-0 bg-background/30 p-6 flex flex-col justify-center space-y-3">
            <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Tin nhắn gửi khách</p>
            <textarea 
              readOnly
              className="w-full h-32 bg-card-bg/50 border border-primary/20 rounded-lg p-3 text-sm font-sans font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 leading-relaxed whitespace-pre overflow-x-auto shadow-inner"
              value={copyText}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <p className="text-[10px] text-muted-foreground text-center italic mt-1">
              (Bấm vào ô trên để tự động bôi đen và Copy)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
