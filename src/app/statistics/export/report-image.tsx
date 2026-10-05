import type { CSSProperties } from "react"
import type { StatisticsReport } from "@/lib/statistics-report"

const colors = {
  background: "#eef2f7",
  surface: "#ffffff",
  ink: "#0f172a",
  muted: "#526176",
  border: "#cbd5e1",
  primary: "#4338ca",
  primarySoft: "#eef2ff",
  money: "#334155",
  moneySoft: "#f1f5f9",
  investment: "#b45309",
  investmentSoft: "#fffbeb",
  success: "#047857",
  successSoft: "#ecfdf5",
  danger: "#be123c",
  dangerSoft: "#fff1f2",
  prize: "#0369a1",
  prizeSoft: "#f0f9ff"
}

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center"
}

function formatNumber(value: number) {
  const absolute = Math.round(Math.abs(value))
  return absolute < 10000
    ? absolute.toString()
    : absolute.toLocaleString("vi-VN")
}

function Metric({
  label,
  labelHighlight,
  value,
  color = colors.ink,
  background = colors.moneySoft,
  borderColor = colors.border
}: {
  label: string
  labelHighlight?: string
  value: string
  color?: string
  background?: string
  borderColor?: string
}) {
  return (
    <div style={{
      display: "flex",
      flex: 1,
      minWidth: 0,
      flexDirection: "column",
      padding: "14px 16px",
      borderRadius: 12,
      background,
      border: `1px solid ${borderColor}`
    }}>
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: 5,
        marginBottom: 6,
        color: colors.muted,
        fontSize: 14,
        fontWeight: 600
      }}>
        <span>{label}</span>
        {labelHighlight && (
          <span style={{ color: colors.prize, fontSize: 20, fontWeight: 800 }}>
            {labelHighlight}
          </span>
        )}
      </div>
      <span style={{
        color,
        fontSize: 22,
        fontWeight: 800,
        letterSpacing: -0.25,
        fontVariantNumeric: "tabular-nums"
      }}>{value}</span>
    </div>
  )
}

export function StatisticsReportImage({ report }: { report: StatisticsReport }) {
  const exportedDate = new Date()
  const timeParts = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh"
  }).formatToParts(exportedDate)
  const dateParts = new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh"
  }).formatToParts(exportedDate)
  const getPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value || ""
  const exportedAt = `${getPart(timeParts, "hour")}:${getPart(timeParts, "minute")} ${getPart(dateParts, "day")}/${getPart(dateParts, "month")}/${getPart(dateParts, "year")}`

  return (
    <div style={{
      display: "flex",
      width: "100%",
      height: "100%",
      flexDirection: "column",
      padding: 44,
      background: colors.background,
      color: colors.ink,
      fontFamily: "sans-serif"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        padding: "30px 34px",
        borderRadius: 20,
        color: "white",
        background: "linear-gradient(135deg, #312e81, #4338ca 52%, #6d28d9)"
      }}>
        <div style={{ ...rowStyle, justifyContent: "space-between" }}>
          <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: 1.4 }}>BÁO CÁO CHI TIẾT 3 MIỀN</span>
          <span style={{ fontSize: 19, fontWeight: 700, color: "#ffffff" }}>Ngày {report.date}</span>
        </div>
        <span style={{ fontSize: 16, color: "#ddd6fe", marginTop: 12 }}>Xuất lúc {exportedAt}</span>
      </div>

      {report.regions.map(region => (
        <div key={region.key} style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 28,
          borderRadius: 18,
          overflow: "hidden",
          background: colors.surface,
          border: `1px solid ${colors.border}`
        }}>
          <div style={{
            ...rowStyle,
            justifyContent: "space-between",
            padding: "20px 26px",
            background: colors.primarySoft,
            borderBottom: `1px solid ${colors.border}`
          }}>
            <div style={{ ...rowStyle, gap: 12 }}>
              <span style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 32,
                borderRadius: 9,
                color: "white",
                background: colors.primary,
                fontSize: 17,
                fontWeight: 700
              }}>{region.key}</span>
              <span style={{ fontSize: 25, fontWeight: 700 }}>{region.name}</span>
            </div>
            <span style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 14px",
              borderRadius: 10,
              color: region.settlement.label === "Thu" ? colors.success : colors.danger,
              background: region.settlement.label === "Thu" ? colors.successSoft : colors.dangerSoft,
              border: `1px solid ${region.settlement.label === "Thu" ? "#a7f3d0" : "#fecdd3"}`,
              fontSize: 23,
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums"
            }}>
              {region.settlement.label} {formatNumber(region.settlement.amount)}k
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", padding: "0 26px 26px" }}>
            {region.bills.map((bill, billIndex) => (
              <div key={bill.id} style={{
                display: "flex",
                flexDirection: "column",
                padding: "24px 0",
                borderBottom: `1px solid ${colors.border}`
              }}>
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  padding: "5px 10px",
                  borderRadius: 8,
                  color: colors.primary,
                  background: colors.primarySoft,
                  fontSize: 15,
                  fontWeight: 800,
                  marginBottom: 10
                }}>
                  PHƠI {billIndex + 1}
                </span>
                <div style={{
                  display: "flex",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  padding: "18px 20px",
                  borderRadius: 12,
                  color: colors.ink,
                  background: "#f8fafc",
                  border: `1px solid ${colors.border}`,
                  fontFamily: "sans-serif",
                  fontSize: 18,
                  lineHeight: 1.5
                }}>
                  {bill.rawContent}
                </div>
                <div style={{ ...rowStyle, gap: 10, marginTop: 14 }}>
                  <Metric
                    label="Tổng điểm"
                    value={`${formatNumber(bill.totalPoints)}n`}
                    color={colors.primary}
                    background={colors.primarySoft}
                    borderColor="#c7d2fe"
                  />
                  <Metric
                    label="Tổng tiền"
                    value={`${formatNumber(bill.totalMoney)}k`}
                    color={colors.money}
                  />
                  <Metric
                    label="Tổng xác"
                    value={`${formatNumber(bill.totalInvestment)}k`}
                    color={colors.investment}
                    background={colors.investmentSoft}
                    borderColor="#fde68a"
                  />
                  <Metric
                    label="Trúng"
                    labelHighlight={`${formatNumber(bill.totalWinningPoints)}n`}
                    value={`${formatNumber(bill.totalPrize)}k`}
                    color={colors.prize}
                    background={colors.prizeSoft}
                    borderColor="#bae6fd"
                  />
                  <Metric
                    label="Thu / Bù"
                    value={`${bill.settlement.label} ${formatNumber(bill.settlement.amount)}k`}
                    color={bill.settlement.label === "Thu" ? colors.success : colors.danger}
                    background={bill.settlement.label === "Thu" ? colors.successSoft : colors.dangerSoft}
                    borderColor={bill.settlement.label === "Thu" ? "#a7f3d0" : "#fecdd3"}
                  />
                </div>
              </div>
            ))}

            <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
              <span style={{ color: colors.ink, fontSize: 21, fontWeight: 800, marginBottom: 12 }}>
                Danh sách số trúng {region.key}
              </span>
              {region.winningDetails.length === 0 ? (
                <div style={{
                  display: "flex",
                  padding: "18px 20px",
                  borderRadius: 12,
                  color: colors.muted,
                  background: "#f8fafc",
                  fontSize: 17
                }}>
                  Không có số trúng.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", border: `1px solid ${colors.border}`, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ ...rowStyle, padding: "13px 14px", background: colors.primarySoft, color: colors.primary, fontSize: 14, fontWeight: 800 }}>
                    <span style={{ width: 220 }}>ĐÀI</span>
                    <span style={{ width: 110 }}>SỐ</span>
                    <span style={{ width: 130 }}>KIỂU</span>
                    <span style={{ width: 80, textAlign: "center" }}>NHÁY</span>
                    <span style={{ flex: 1, textAlign: "right" }}>ĐIỂM TRÚNG</span>
                    <span style={{ flex: 1, textAlign: "right" }}>TIỀN TRÚNG</span>
                  </div>
                  {region.winningDetails.map((detail, detailIndex) => (
                    <div key={`${detail.betNumber}-${detailIndex}`} style={{
                      ...rowStyle,
                      padding: "13px 14px",
                      background: detailIndex % 2 === 0 ? colors.surface : "#f8fafc",
                      borderTop: detailIndex === 0 ? "none" : `1px solid ${colors.border}`,
                      fontSize: 16
                    }}>
                      <span style={{ width: 220, color: colors.muted, fontWeight: 600 }}>{detail.stations.join(", ") || "—"}</span>
                      <span style={{ width: 110, color: colors.primary, fontSize: 20, fontWeight: 800 }}>{detail.betNumber}</span>
                      <span style={{ width: 130, color: colors.money, fontWeight: 600, textTransform: "uppercase" }}>{detail.betType}</span>
                      <span style={{ width: 80, color: colors.primary, textAlign: "center", fontWeight: 800 }}>{detail.winQuantity}</span>
                      <span style={{ flex: 1, color: colors.ink, textAlign: "right", fontSize: 17, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{formatNumber(detail.points)}n</span>
                      <span style={{ flex: 1, textAlign: "right", color: colors.prize, fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{formatNumber(detail.prize)}k</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      <div style={{
        display: "flex",
        flexDirection: "column",
        marginTop: 28,
        marginBottom: 28,
        padding: "26px 30px",
        borderRadius: 18,
        color: "white",
        background: "linear-gradient(135deg, #0f172a, #1e293b)"
      }}>
        <span style={{ color: "#c7d2fe", fontSize: 16, fontWeight: 800, letterSpacing: 1.4, marginBottom: 12 }}>TỔNG </span>
        {report.regions.map(region => (
          <div key={region.key} style={{ ...rowStyle, justifyContent: "space-between", padding: "10px 0", fontSize: 21 }}>
            <div style={{ ...rowStyle, fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: "#a5b4fc", fontWeight: 800, marginRight: 8 }}>{region.key}</span>
              <span style={{ color: "#f8fafc", fontWeight: 700 }}>{formatNumber(region.totalInvestment)}</span>
              <span style={{ color: "#94a3b8", margin: "0 7px" }}>Trúng</span>
              <span style={{ color: "#7dd3fc", fontWeight: 800 }}>{formatNumber(region.totalPrize)}</span>
            </div>
            <span style={{
              color: region.settlement.label === "Thu" ? "#6ee7b7" : "#fda4af",
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums"
            }}>
              = {region.settlement.label} {formatNumber(region.settlement.amount)}
            </span>
          </div>
        ))}
        <div style={{
          ...rowStyle,
          justifyContent: "space-between",
          marginTop: 13,
          paddingTop: 18,
          borderTop: "1px solid #475569",
          fontSize: 29,
          fontWeight: 800
        }}>
          <span>Tổng {report.settlement.label}</span>
          <span style={{
            color: report.settlement.label === "Thu" ? "#6ee7b7" : "#fda4af",
            fontVariantNumeric: "tabular-nums"
          }}>
            {formatNumber(report.settlement.amount)}
          </span>
        </div>
      </div>
    </div>
  )
}
