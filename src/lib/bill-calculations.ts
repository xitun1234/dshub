type PayRates = {
  ratePay: number
  ratePay3: number
  ratePay4: number
}

type InvestmentDetail = {
  betNumber: string
  betType: string
  stationCount: number
  multiplier: number
  pricePerUnit: number
}

export function isDaBetType(betType: string) {
  const normalized = betType.toLowerCase().replace(/đ/g, "d")
  return normalized === "da" ||
    normalized.includes("xien") ||
    normalized === "x" ||
    normalized === "d" ||
    normalized === "dx"
}

function getPayRate(detail: InvestmentDetail, rates: PayRates) {
  const numbers = detail.betNumber.split("-")
  if (numbers.some(number => number.length === 4)) return rates.ratePay4
  if (numbers.some(number => number.length === 3)) return rates.ratePay3
  return rates.ratePay
}

export function calculateTotalInvestment(details: InvestmentDetail[], rates: PayRates) {
  return details.reduce((total, detail) => {
    const pointMultiplier = isDaBetType(detail.betType) ? 2 : 1
    const points = detail.pricePerUnit * detail.stationCount * detail.multiplier * pointMultiplier
    return total + (points * getPayRate(detail, rates))
  }, 0)
}
