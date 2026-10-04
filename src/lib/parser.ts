export type ParsedBet = {
  type: string
  numbers: string[]
  amount: number
  multiplier: number
  stationCount: number
  stationAliases: string[]
  isThreeDigit: boolean
  isFourDigit?: boolean
}

export type ParseResult = {
  isValid: boolean
  error?: string
  totalPoints: number
  bets: ParsedBet[]
}

const isBetType = (t: string) => {
  const norm = t.toLowerCase().replace(/đ/g, "d");
  return ["bao", "blo", "lo", "b", "da", "d", "xien", "x", "dd", "dauduoi", "xc", "xiuchu", "bacang", "dau", "duoi", "7lo", "7l", "dx"].includes(norm);
}

export type ParserAliasesConfig = {
  customAliases: string[]
  twoDaiAliases?: string[]
  threeDaiAliases?: string[]
  fourDaiAliases?: string[]
}

const isStationAlias = (t: string, aliasesConfig?: ParserAliasesConfig) => {
  const norm = t.toLowerCase().replace(/đ/g, "d");
  if (norm.match(/^[1-4]d(ai)?$/)) return true;
  if (norm === "dai") return true;
  
  const aliases = [
    'tphcm', 'hcm', 'tp', 'la', 'longan', 'bp', 'binhphuoc', 'hg', 'haugiang', 'bt', 'bentre', 'vt', 'vungtau', 
    'bl', 'baclieu', 'dn', 'dongnai', 'ct', 'cantho', 'st', 'soctrang', 'tn', 'tayninh', 'ag', 'angiang', 'bth', 
    'binhthuan', 'vl', 'vinhlong', 'bd', 'binhduong', 'tv', 'travinh', 'dt', 'dongthap', 'cm', 'camau', 'tg', 
    'tiengiang', 'kg', 'kiengiang', 'dl', 'dalat', 'tth', 'hue', 'hu', 'py', 'phuyen', 'dlk', 'daklak', 'dak', 'qnm', 
    'quangnam', 'qnam', 'dnang', 'danang', 'kh', 'khanhhoa', 'bdi', 'binhdinh', 'qt', 'quangtri', 'qb', 'quangbinh', 
    'gl', 'gialai', 'nt', 'ninhthuan', 'qng', 'quangngai', 'dno', 'daknong', 'kt', 'kontum', 'hn', 'hanoi', 
    'tb', 'thaibinh', 'bn', 'bacninh', 'hp', 'haiphong', 'nd', 'namdinh', 'qn', 'quangninh',
    'mb', 'mn', 'mt'
  ];
  
  if (aliases.includes(norm)) return true;
  
  if (aliasesConfig && aliasesConfig.customAliases.length > 0) {
    return aliasesConfig.customAliases.includes(norm);
  }
  
  return false;
}

const isAmount = (t: string) => {
  return /^[0-9]+([.,][0-9]+)?[nkcd]$/i.test(t);
}

const parseStationTokens = (tokens: string[], aliasesConfig?: ParserAliasesConfig) => {
  let count = 0;
  const aliases: string[] = [];
  
  const twoDai = aliasesConfig?.twoDaiAliases || ['2dai', '2d', '2đ', '2đài'];
  const threeDai = aliasesConfig?.threeDaiAliases || ['3dai', '3d', '3đ', '3đài'];
  const fourDai = aliasesConfig?.fourDaiAliases || ['4dai', '4d', '4đ', '4đài'];

  for (const t of tokens) {
    const norm = t.toLowerCase().replace(/đ/g, "d");
    const normForMatch = t.toLowerCase();
    
    if (twoDai.includes(normForMatch) || norm.includes("2dai") || norm === "2d") {
      count = Math.max(count, 2);
    } else if (threeDai.includes(normForMatch) || norm.includes("3dai") || norm === "3d") {
      count = Math.max(count, 3);
    } else if (fourDai.includes(normForMatch) || norm.includes("4dai") || norm === "4d") {
      count = Math.max(count, 4);
    } else if (norm === "1dai" || norm === "1d" || norm === "dai") {
      count = Math.max(count, 1);
    } else {
      aliases.push(normForMatch);
    }
  }
  if (aliases.length > 0) count = aliases.length;
  if (count === 0) count = 1;

  return { count, aliases };
}

const mapBetTypeToMultiplier = (type: string, region: string, isThreeDigit: boolean = false, isFourDigit: boolean = false) => {
  const norm = type.toLowerCase().replace(/đ/g, "d").replace(/\s/g, "");
  const isSouthOrCentral = region === "MN" || region === "MT";

  if (norm.includes("7lo") || norm === "7l") return 7;
  if (norm.includes("dauduoi") || norm.includes("dd")) return 2;
  if (norm === "dau") return 1;
  if (norm === "duoi") return 1;
  if (norm.includes("bao") || norm.includes("blo") || norm === "lo" || norm === "b") {
    if (isFourDigit) {
      return isSouthOrCentral ? 16 : 20;
    }
    if (isThreeDigit) {
      return isSouthOrCentral ? 17 : 23;
    }
    return isSouthOrCentral ? 18 : 27;
  }
  if (norm.includes("da") || norm.includes("xien") || norm === "x" || norm === "d" || norm === "dx") {
    return isSouthOrCentral ? 18 : 27;
  }
  if (norm.includes("xc") || norm.includes("xiuchu")) return isSouthOrCentral ? 2 : 4;
  if (norm.includes("bacang")) return isSouthOrCentral ? 17 : 23;
  return 1;
}

export const parseTicketInput = (rawText: string, region: string = "MN", aliasesConfig?: ParserAliasesConfig): ParseResult => {
  if (!rawText.trim()) return { isValid: false, totalPoints: 0, bets: [] };

  try {
    const lines = rawText.split("\n").filter(l => l.trim() !== "");
    let totalPoints = 0;
    const bets: ParsedBet[] = [];

    let currentStationTokens: string[] = ["1d"];
    let currentType = "bao";

    for (let line of lines) {
      // Strip region prefix at the start of the line (e.g. mb., mn., mt.)
      line = line.trim().replace(/^(?:mb|mn|mt)\b\.?\s*/gi, "");

      // Normalize common syntax shortcuts
      line = line.replace(/([1-4])\s*[dđ](?:ai|ài)?(?=\s|$|[.,;:\-_])/gi, "$1dai");
      line = line.replace(/\b7\s*l(?:o|ô)?\b/gi, "7lo");
      line = line.replace(/([0-9])\s+([nkd])\b/gi, "$1$2");
      // Reduce separators. Hyphens are preserved for number formats like '25-52'
      line = line.replace(/[.,;:]+(\s+|$)/g, " ");
      
      // Expand inline bets like b10n -> b 10n
      line = line.replace(/\bb([0-9]+(?:[.,][0-9]+)?(?:[nkcd])?)\b/gi, " b $1 ");
      line = line.replace(/\bda([0-9]+(?:[.,][0-9]+)?(?:[nkcd])?)\b/gi, " da $1 ");
      line = line.replace(/\bdx([0-9]+(?:[.,][0-9]+)?(?:[nkcd])?)\b/gi, " dx $1 ");
      line = line.replace(/\bd([0-9]+(?:[.,][0-9]+)?(?:[nkcd])?)\b/gi, " d $1 ");
      line = line.replace(/\bx([0-9]+(?:[.,][0-9]+)?(?:[nkcd])?)\b/gi, " x $1 ");
      line = line.replace(/\bdd([0-9]+(?:[.,][0-9]+)?(?:[nkcd])?)\b/gi, " dd $1 ");
      line = line.replace(/\bxc([0-9]+(?:[.,][0-9]+)?(?:[nkcd])?)\b/gi, " xc $1 ");
      line = line.replace(/\b7lo([0-9]+(?:[.,][0-9]+)?(?:[nkcd])?)\b/gi, " 7lo $1 ");
      
      const tokens = line.split(/\s+/).filter(Boolean);

      let tempStations: string[] = [];
      let pendingNumbers: string[] = [];
      let lastNumbers: string[] | null = null;

      for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        
        if (isStationAlias(t, aliasesConfig)) {
           tempStations.push(t);
        } else if (isBetType(t)) {
           if (tempStations.length > 0) {
              currentStationTokens = tempStations;
              tempStations = [];
           }
           currentType = t;
        } else if (isAmount(t) || (i === tokens.length - 1 && pendingNumbers.length > 0 && /^[0-9]+([.,][0-9]+)?$/.test(t))) {
           if (tempStations.length > 0) {
              currentStationTokens = tempStations;
              tempStations = [];
           }
           
           const amountStr = t;
           const rawAmount = amountStr.replace(/,/g, ".").replace(/[^0-9.]/g, "");
           const amountK = parseFloat(rawAmount) || 0;

           // Các nhóm cược sau trên cùng dòng dùng lại số đã ghi (vd: "dx1n b5n")
           const numbersRaw = pendingNumbers.length > 0 ? pendingNumbers : (lastNumbers || []);
           if (pendingNumbers.length > 0) {
              lastNumbers = [...pendingNumbers];
              pendingNumbers = [];
           }

           if (numbersRaw.length > 0 && amountK > 0) {
              const valStat = parseStationTokens(currentStationTokens, aliasesConfig);
              // Ensure splitting by hyphen safely to handle '25-52-46'
              const parsedNumbers = numbersRaw.flatMap(n => n.split(/[-_]+/).filter(Boolean));
              const isThreeDigit = parsedNumbers.some(num => num.length === 3);
              const isFourDigit = parsedNumbers.some(num => num.length === 4);
              const multiplier = mapBetTypeToMultiplier(currentType, region, isThreeDigit, isFourDigit);
              
              const typeLower = currentType.toLowerCase().replace(/đ/g, "d");
              const isDa = typeLower === "da" ||
                           typeLower.includes("xien") ||
                           typeLower === "x" ||
                           typeLower === "d" ||
                           typeLower === "dx";

              let numbersToSave = parsedNumbers;
              if (isDa) {
                 // Tạo các cặp đá xiên từ danh sách số
                 const pairs: string[] = [];
                 for (let idx1 = 0; idx1 < parsedNumbers.length; idx1++) {
                    for (let idx2 = idx1 + 1; idx2 < parsedNumbers.length; idx2++) {
                       pairs.push(`${parsedNumbers[idx1]}-${parsedNumbers[idx2]}`);
                    }
                 }
                 numbersToSave = pairs;
              }

              let points = 0;
              if (isDa) {
                 points = amountK * numbersToSave.length * 2 * valStat.count * multiplier;
              } else {
                 points = amountK * parsedNumbers.length * multiplier * valStat.count;
              }

              totalPoints += points;
              bets.push({
                 type: currentType,
                 numbers: numbersToSave,
                 amount: amountK,
                 multiplier: multiplier,
                 stationCount: valStat.count,
                 stationAliases: valStat.aliases,
                 isThreeDigit: isThreeDigit,
                 isFourDigit: isFourDigit
              });
           }
        } else {
           if (tempStations.length > 0) {
              currentStationTokens = tempStations;
              tempStations = [];
           }
           pendingNumbers.push(t);
        }
      }
    }

    return { isValid: true, totalPoints, bets };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return { isValid: false, error: message, totalPoints: 0, bets: [] };
  }
}
