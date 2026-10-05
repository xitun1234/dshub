import { XMLParser } from "fast-xml-parser"

interface RSSItem {
  title: string
  description: string
  [key: string]: unknown
}

export type LotteryResults = Record<string, Record<string, string | string[]>>

function decodeHTMLEntities(text: string): string {
  if (!text) return ""
  const entities: Record<string, string> = {
    'amp': '&',
    'lt': '<',
    'gt': '>',
    'quot': '"',
    'apos': "'",
    'nbsp': ' '
  };
  return text.replace(/&(#?[0-9a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith('#')) {
      if (entity[1]?.toLowerCase() === 'x') {
        return String.fromCharCode(parseInt(entity.substring(2), 16));
      }
      return String.fromCharCode(parseInt(entity.substring(1), 10));
    }
    return entities[entity.toLowerCase()] || match;
  });
}

export async function fetchLotteryRSS(
  region: "MN" | "MT" | "MB",
  dayIndex: number,
  dateStr?: string,
  options: { fresh?: boolean } = {}
) {
  let rssUrlPath = 'ket-qua-xo-so-mien-nam-xsmn.rss'
  if (region === 'MT') rssUrlPath = 'ket-qua-xo-so-mien-trung-xsmt.rss'
  if (region === 'MB') rssUrlPath = 'ket-qua-xo-so-mien-bac-xsmb.rss'

  const rssUrl = `https://xosodaiphat.com/${rssUrlPath}`

  const response = await fetch(
    rssUrl,
    options.fresh ? { cache: "no-store" } : { next: { revalidate: 60 } }
  )
  if (!response.ok) {
    throw new Error(`Không thể tải kết quả xổ số (HTTP ${response.status}).`)
  }

  const xmlData = await response.text()
  if (!xmlData || !xmlData.includes("<rss")) {
    throw new Error("Nguồn RSS trả về dữ liệu không hợp lệ.")
  }

  const parser = new XMLParser()
  const result = parser.parse(xmlData)
  
  let items = result.rss?.channel?.item
  if (!items) throw new Error("No items in RSS")
  if (!Array.isArray(items)) items = [items]

  const dayStringMap: Record<number, string> = {
    1: 'Thứ Hai',
    2: 'Thứ Ba',
    3: 'Thứ Tư',
    4: 'Thứ Năm',
    5: 'Thứ Sáu',
    6: 'Thứ Bảy',
    0: 'Chủ Nhật'
  }

  const targetDayString = dayStringMap[dayIndex]
  // Normalize checking because title might use 'Thứ 2' or 'Thứ Hai'
  const altDayString = targetDayString === 'Thứ Hai' ? 'Thứ 2' : 
                       targetDayString === 'Thứ Ba' ? 'Thứ 3' :
                       targetDayString === 'Thứ Tư' ? 'Thứ 4' :
                       targetDayString === 'Thứ Năm' ? 'Thứ 5' :
                       targetDayString === 'Thứ Sáu' ? 'Thứ 6' :
                       targetDayString === 'Thứ Bảy' ? 'Thứ 7' : targetDayString;

  // Format dateStr (YYYY-MM-DD) to DD/MM/YYYY for precise search
  let targetDateFormatted = ""
  if (dateStr) {
    const [y, m, d] = dateStr.split('-')
    targetDateFormatted = `${d}/${m}/${y}`
  }

  let targetItem: RSSItem | undefined

  if (targetDateFormatted) {
    targetItem = (items as RSSItem[]).find((i) => {
      const t = i.title?.toLowerCase() || ""
      return t.includes(targetDateFormatted)
    })
    
    if (!targetItem) {
      throw new Error(`Chưa có kết quả xổ số ngày ${targetDateFormatted} trên RSS.`)
    }
  } else {
    targetItem = (items as RSSItem[]).find((i) => {
      const t = i.title?.toLowerCase() || ""
      return t.includes(targetDayString.toLowerCase()) || t.includes(altDayString.toLowerCase())
    }) || items[0] as RSSItem
  }

  const title = decodeHTMLEntities(targetItem.title)
  const description = targetItem.description
  const parsedDateStr = title.replace(/KẾT QUẢ XỔ SỐ MIỀN [NAM|TRUNG|BẮC]+ NGÀY\s+/i, '').trim()

  const parsedResults = parseDescription(description, region)

  return { title: parsedDateStr, results: parsedResults }
}

function parseDescription(text: string, region: "MN" | "MT" | "MB"): LotteryResults {
  const results: LotteryResults = {}
  
  // Normalize text for parsing
  const normalizedText = text.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/g, ' ');

  if (region === 'MB' && !normalizedText.includes('[')) {
    const stationName = "Miền Bắc"
    results[stationName] = {
      'ĐB': '', '1': '', '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': ''
    }
    parseContentLines(normalizedText, results[stationName], region)
    return results
  }

  // Phân tích text theo từng đài [Tên Đài]
  const blocks = normalizedText.split('[').filter(b => b.trim() !== '')
  
  blocks.forEach(block => {
    const closingBracketIndex = block.indexOf(']')
    if (closingBracketIndex === -1) return
    
    const stationName = decodeHTMLEntities(block.substring(0, closingBracketIndex)).trim()
    const content = block.substring(closingBracketIndex + 1).trim()
    
    results[stationName] = {
      'ĐB': '', '1': '', '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': ''
    }
    
    parseContentLines(content, results[stationName], region)
  })
  
  return results
}

function parseContentLines(content: string, stationResults: Record<string, string | string[]>, region: "MN" | "MT" | "MB") {
  const lines = content.split('\n')
  lines.forEach(line => {
    const l = line.trim()
    if (!l) return
    
    // Normalize prefix: 'G.1:' -> '1:', 'G.2:' -> '2:', 'DB6:' -> 'ĐB:', 'DB:' -> 'ĐB:'
    let cleanLine = l.replace(/^G\./i, '').replace(/^DB6?/i, 'ĐB').trim()
    
    const separatorIndex = cleanLine.indexOf(':')
    if (separatorIndex === -1) return

    const key = cleanLine.substring(0, separatorIndex).trim().toUpperCase()
    let value = cleanLine.substring(separatorIndex + 1).trim()
    
    // Split by dash (with or without spaces)
    const values = value.split(/\s*-\s*/).map(s => s.trim()).filter(s => s !== '')

    if (key === 'ĐB') stationResults['ĐB'] = values[0]
    else if (key === '1') stationResults['1'] = values[0]
    else if (key === '2') stationResults['2'] = values
    else if (key === '3') stationResults['3'] = values
    else if (key === '4') stationResults['4'] = values
    else if (key === '5') stationResults['5'] = values
    else if (key === '6') stationResults['6'] = values
    else if (key === '7') {
      if (region === 'MB') {
        stationResults['7'] = values
      } else {
        stationResults['7'] = values[0]
      }
    }
    else if (key === '8') {
      stationResults['8'] = values[0]
    }
  })
}
