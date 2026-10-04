// No imports needed from @/components/ui/card as they are not used in this file
export type RssResults = Record<string, Record<string, string | string[]>>

export function RssDisplay({ 
  title, 
  results,
  region
}: { 
  title: string
  results: RssResults 
  region: string
}) {
  if (!results || Object.keys(results).length === 0) return null

  const stationNames = Object.keys(results)

  // Sort stations based on official drawing order
  const orderMap: Record<string, number> = {
    'Hồ Chí Minh': 1, 'TP. HCM': 1, 'TP.HCM': 1, 'TPHCM': 1, 'Bến Tre': 1, 'Đồng Nai': 1, 'Tây Ninh': 1, 'Vĩnh Long': 1, 'Tiền Giang': 1,
    'Đồng Tháp': 2, 'Vũng Tàu': 2, 'Cần Thơ': 2, 'An Giang': 2, 'Bình Dương': 2, 'Long An': 2, 'Kiên Giang': 2,
    'Cà Mau': 3, 'Bạc Liêu': 3, 'Sóc Trăng': 3, 'Bình Thuận': 3, 'Trà Vinh': 3, 'Bình Phước': 3, 'Đà Lạt': 3, 'Lâm Đồng': 3,
    'Hậu Giang': 4
  }
  stationNames.sort((a, b) => (orderMap[a] || 99) - (orderMap[b] || 99))

  // Prizes
  const prizeOrder = []
  if (region !== 'MB') prizeOrder.push({ key: '8', name: 'G. Tám', class: 'text-blue-400 font-bold text-lg' })
  prizeOrder.push(
    { key: '7', name: 'G. Bảy', class: 'text-base font-medium text-foreground/80' },
    { key: '6', name: 'G. Sáu', class: 'text-base font-medium text-foreground/80' },
    { key: '5', name: 'G. Năm', class: 'text-base font-medium text-foreground/80' },
    { key: '4', name: 'G. Tư', class: 'text-base font-medium text-foreground/80' },
    { key: '3', name: 'G. Ba', class: 'text-base font-medium text-foreground/80' },
    { key: '2', name: 'G. Hai', class: 'text-base font-medium text-foreground/80' },
    { key: '1', name: 'G. Nhất', class: 'text-lg font-bold text-amber-500' },
    { key: 'ĐB', name: 'Đặc Biệt', class: 'text-rose-500 font-bold text-2xl' }
  )

  // Create a map of prizeKey to className for easy lookup
  const classMap: Record<string, string> = {}
  prizeOrder.forEach(p => {
    classMap[p.key] = p.class
  })

  // Loto 
  const lotoData: Record<string, Record<string, {num: string, class: string}[]>> = {}
  stationNames.forEach(station => {
    lotoData[station] = {
      '0': [], '1': [], '2': [], '3': [], '4': [], 
      '5': [], '6': [], '7': [], '8': [], '9': []
    }
    
    const prizes = results[station]
    Object.keys(prizes).forEach(prizeKey => {
      const data = prizes[prizeKey]
      const className = classMap[prizeKey] || 'text-base font-medium text-foreground/80'
      const processNumber = (numStr: string) => {
        if (!numStr || numStr.length < 2) return
        const lastTwo = numStr.slice(-2)
        const dau = lastTwo[0]
        if (lotoData[station][dau]) lotoData[station][dau].push({num: lastTwo, class: className})
      }
      if (Array.isArray(data)) data.forEach(processNumber)
      else processNumber(data)
    })
    
    for (let dau = 0; dau <= 9; dau++) {
      lotoData[station][dau.toString()].sort((a, b) => parseInt(a.num) - parseInt(b.num))
    }
  })

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center text-primary font-medium mb-2">
        <span className="text-lg">Kết Quả Xổ Số Hôm Nay (RSS)</span>
        <span className="text-base text-rose-500 font-bold">{title}</span>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 overflow-x-auto pb-2">
        {/* Kết Quả Table */}
        <div className="flex-1 min-w-max border border-border rounded-md overflow-hidden">
          <table className="w-full text-base text-center bg-card-bg">
            <thead className="bg-foreground/5 text-foreground/80">
              <tr>
                <th className="p-3 border border-border font-semibold">Giải</th>
                {stationNames.map(name => <th key={name} className="p-3 border border-border font-medium text-lg text-primary/90">{name}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {prizeOrder.map(prize => (
                <tr key={prize.key} className="hover:bg-primary/5">
                  <td className="p-3 font-semibold text-foreground/60 bg-background/50">{prize.name}</td>
                  {stationNames.map(station => {
                    const data = results[station][prize.key]
                    return (
                      <td key={station} className={`p-3 border-l border-border align-middle tracking-wider ${prize.class}`}>
                        {Array.isArray(data) ? (
                          <div className="space-y-1">
                            {data.map((d, i) => <div key={i}>{d}</div>)}
                          </div>
                        ) : (
                          <div>{data || '-'}</div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Loto Table */}
        <div className="flex-1 min-w-max border border-border rounded-md overflow-hidden">
          <table className="w-full text-base text-center bg-card-bg">
            <thead className="bg-foreground/5 text-foreground/80">
              <tr>
                <th className="p-3 border border-border text-rose-400 font-semibold">Đầu</th>
                {stationNames.map(name => <th key={name} className="p-3 border border-border font-medium text-lg text-primary/90">{name}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(dau => (
                <tr key={dau} className="hover:bg-primary/5">
                  <td className="p-3 font-bold text-rose-400 bg-rose-950/20 text-xl">{dau}</td>
                  {stationNames.map(station => {
                    const duoiArray = lotoData[station][dau.toString()]
                    return (
                      <td key={station} className="p-3 border-l border-border tracking-widest align-middle">
                        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
                          {duoiArray.map((item, idx) => (
                            <span key={idx} className="text-foreground text-opacity-90 font-medium text-lg">
                              {item.num}
                            </span>
                          ))}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
