export const CUSTOMER_DEFAULTS = {
  role: "KHACH",
  isActive: true,
  ratePay: 0.72,
  ratePay3: 0.72,
  ratePay4: 0.72,
  rateWin: 71,
  rateWin3: 610,
  rateWin4: 5100,
  rateWinDaMNMT: 510,
  rateWinDaMB: 610
} as const

export type CustomerRole = "KHACH" | "THAU"
