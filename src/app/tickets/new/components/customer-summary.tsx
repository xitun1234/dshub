"use client"

import { Card, CardContent } from "@/components/ui/card"

interface Customer {
  id: string
  name: string
  role: string
  [key: string]: unknown
}

interface Bill {
  id: string
  region: string
  totalInvestment: number
  totalPrize: number
  customer: Customer
  date: string
  [key: string]: unknown
}

function formatMoney(amount: number): string {
  const absolute = Math.abs(Math.round(amount));
  if (absolute < 10000) {
    return absolute.toString();
  }
  return absolute.toLocaleString('vi-VN');
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
          <div className={`font-bold text-lg ${tProfit > 0 ? 'text-primary' : tProfit < 0 ? 'text-rose-500' : 'text-foreground/50'}`}>
            {customerRole === "THAU" 
              ? (tProfit >= 0 ? "Bù" : "Thu") 
              : (tProfit >= 0 ? "Thu" : "Bù")} {formatMoney(Math.abs(tProfit))}k
          </div>
        </div>
        
        <CardContent className="p-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border/50">
          <div className="flex-1 p-6 overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
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
                  if (r.data.inv === 0 && r.data.prize === 0) return null;
                  const rProfit = r.data.inv - r.data.prize;
                  return (
                    <tr key={r.key} className="hover:bg-foreground/[0.02]">
                      <td className="py-3 text-left font-medium">{r.key}</td>
                      <td className="py-3 text-right">{formatMoney(r.data.inv)}</td>
                      <td className="py-3 text-right">{formatMoney(r.data.prize)}</td>
                      <td className={`py-3 text-right font-medium ${rProfit > 0 ? 'text-primary' : rProfit < 0 ? 'text-rose-500' : 'text-foreground/50'}`}>
                        {rProfit > 0 ? '+' : ''}{rProfit !== 0 ? formatMoney(rProfit) : '0'}
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-bold bg-foreground/5">
                  <td className="py-3 text-left pl-2">TỔNG CỘNG</td>
                  <td className="py-3 text-right text-rose-500">{formatMoney(stats.total.inv)}</td>
                  <td className="py-3 text-right text-sky-400">{formatMoney(stats.total.prize)}</td>
                  <td className={`py-3 text-right pr-2 ${stats.total.profit > 0 ? 'text-primary' : stats.total.profit < 0 ? 'text-rose-500' : 'text-foreground/20'}`}>
                    {stats.total.profit > 0 ? '+' : ''}{stats.total.profit !== 0 ? formatMoney(stats.total.profit) : '0'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="w-full xl:w-[400px] shrink-0 bg-background/30 p-6 flex flex-col justify-center space-y-3">
            <p className="text-xs text-foreground/40 font-black uppercase tracking-widest">Tin nhắn gửi khách</p>
            <textarea 
              readOnly
              className="w-full h-32 bg-card-bg/50 border border-primary/20 rounded-lg p-3 text-sm font-sans font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 leading-relaxed whitespace-pre overflow-x-auto shadow-inner"
              value={copyText}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <p className="text-[10px] text-foreground/30 text-center italic mt-1">
              (Bấm vào ô trên để tự động bôi đen và Copy)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
