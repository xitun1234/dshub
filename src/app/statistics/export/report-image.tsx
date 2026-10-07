import type { CSSProperties } from "react"
import type { StatisticsReport } from "@/lib/statistics-report"

const BASE_IMAGE_WIDTH = 1080

// 2160px is the horizontal dimension of portrait 4K output. The height remains
// content-driven because reports can contain a variable number of rows.
export const STATISTICS_REPORT_IMAGE_WIDTH = 2160
export const STATISTICS_REPORT_IMAGE_SCALE = STATISTICS_REPORT_IMAGE_WIDTH / BASE_IMAGE_WIDTH
// ImageResponse can render text slightly taller than the line-based estimator.
// Keep enough room for the final summary block instead of clipping its last row.
export const STATISTICS_REPORT_IMAGE_HEIGHT_BUFFER = Math.round(
  180 * STATISTICS_REPORT_IMAGE_SCALE
)

const px = (value: number) => Math.round(value * STATISTICS_REPORT_IMAGE_SCALE)
const spacing = (vertical: number, horizontal: number) => `${px(vertical)}px ${px(horizontal)}px`

const colors = {
  background: "#f3f6fa",
  surface: "#ffffff",
  ink: "#172033",
  muted: "#526072",
  border: "#d3dce8",
  primary: "#264b8f",
  primarySoft: "#eaf0fa",
  money: "#354258",
  moneySoft: "#f0f3f7",
  investment: "#8a520d",
  investmentSoft: "#fff7e6",
  success: "#06705b",
  successSoft: "#e8f7f1",
  danger: "#b4234d",
  dangerSoft: "#fff0f3",
  prize: "#176b87",
  prizeSoft: "#eaf6fa"
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
      padding: spacing(16, 18),
      borderRadius: px(12),
      background,
      border: `1px solid ${borderColor}`
    }}>
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: px(5),
        marginBottom: px(7),
        color: colors.muted,
        fontSize: px(15),
        fontWeight: 700
      }}>
        <span>{label}</span>
        {labelHighlight && (
          <span style={{ color: colors.prize, fontSize: px(21), fontWeight: 800 }}>
            {labelHighlight}
          </span>
        )}
      </div>
      <span style={{
        color,
        fontSize: px(23),
        fontWeight: 800,
        letterSpacing: -0.4,
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
      padding: px(44),
      background: colors.background,
      color: colors.ink,
      fontFamily: "Arial, Helvetica, sans-serif"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        padding: spacing(32, 36),
        borderRadius: px(18),
        color: "white",
        background: "linear-gradient(135deg, #14213d, #1f3f78 55%, #264b8f)"
      }}>
        <div style={{ ...rowStyle, justifyContent: "space-between" }}>
          <span style={{ fontSize: px(23), fontWeight: 800, letterSpacing: px(1.1) }}>BÁO CÁO CHI TIẾT 3 MIỀN</span>
          <span style={{ fontSize: px(20), fontWeight: 700, color: "#ffffff" }}>Ngày {report.date}</span>
        </div>
        <span style={{ fontSize: px(17), color: "#dbeafe", marginTop: px(12), fontWeight: 600 }}>Xuất lúc {exportedAt}</span>
      </div>

      {report.regions.map(region => (
        <div key={region.key} style={{
          display: "flex",
          flexDirection: "column",
          marginTop: px(28),
          borderRadius: px(16),
          overflow: "hidden",
          background: colors.surface,
          border: `1px solid ${colors.border}`
        }}>
          <div style={{
            ...rowStyle,
            justifyContent: "space-between",
            padding: spacing(21, 27),
            background: colors.primarySoft,
            borderBottom: `1px solid ${colors.border}`
          }}>
            <div style={{ ...rowStyle, gap: px(12) }}>
              <span style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: px(50),
                height: px(34),
                borderRadius: px(8),
                color: "white",
                background: colors.primary,
                fontSize: px(18),
                fontWeight: 700
              }}>{region.key}</span>
              <span style={{ fontSize: px(26), fontWeight: 800 }}>{region.name}</span>
            </div>
            <span style={{
              display: "flex",
              alignItems: "center",
              padding: spacing(9, 15),
              borderRadius: px(9),
              color: region.settlement.label === "Thu" ? colors.success : colors.danger,
              background: region.settlement.label === "Thu" ? colors.successSoft : colors.dangerSoft,
              border: `1px solid ${region.settlement.label === "Thu" ? "#9dd9c4" : "#efbdc8"}`,
              fontSize: px(24),
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums"
            }}>
              {region.settlement.label} {formatNumber(region.settlement.amount)}k
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", padding: `0 ${px(27)}px ${px(27)}px` }}>
            {region.bills.map((bill, billIndex) => (
              <div key={bill.id} style={{
                display: "flex",
                flexDirection: "column",
                padding: `${px(25)}px 0`,
                borderBottom: `1px solid ${colors.border}`
              }}>
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  padding: spacing(6, 11),
                  borderRadius: px(7),
                  color: colors.primary,
                  background: colors.primarySoft,
                  fontSize: px(16),
                  fontWeight: 800,
                  marginBottom: px(11)
                }}>
                  PHƠI {billIndex + 1}
                </span>
                <div style={{
                  display: "flex",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  padding: spacing(20, 22),
                  borderRadius: px(11),
                  color: colors.ink,
                  background: "#f8fafc",
                  border: `1px solid ${colors.border}`,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: px(19),
                  fontWeight: 600,
                  lineHeight: 1.55
                }}>
                  {bill.rawContent}
                </div>
                <div style={{ ...rowStyle, gap: px(10), marginTop: px(15) }}>
                  <Metric
                    label="Tổng điểm"
                    value={`${formatNumber(bill.totalPoints)}n`}
                    color={colors.primary}
                    background={colors.primarySoft}
                    borderColor="#b8c8e6"
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
                    borderColor="#edd59a"
                  />
                  <Metric
                    label="Trúng"
                    labelHighlight={`${formatNumber(bill.totalWinningPoints)}n`}
                    value={`${formatNumber(bill.totalPrize)}k`}
                    color={colors.prize}
                    background={colors.prizeSoft}
                    borderColor="#b9dce7"
                  />
                  <Metric
                    label="Thu / Bù"
                    value={`${bill.settlement.label} ${formatNumber(bill.settlement.amount)}k`}
                    color={bill.settlement.label === "Thu" ? colors.success : colors.danger}
                    background={bill.settlement.label === "Thu" ? colors.successSoft : colors.dangerSoft}
                    borderColor={bill.settlement.label === "Thu" ? "#9dd9c4" : "#efbdc8"}
                  />
                </div>
              </div>
            ))}

            <div style={{ display: "flex", flexDirection: "column", marginTop: px(27) }}>
              <span style={{ color: colors.ink, fontSize: px(22), fontWeight: 800, marginBottom: px(13) }}>
                Danh sách số trúng {region.key}
              </span>
              {region.winningDetails.length === 0 ? (
                <div style={{
                  display: "flex",
                  padding: spacing(19, 21),
                  borderRadius: px(11),
                  color: colors.muted,
                  background: "#f8fafc",
                  fontSize: px(18),
                  fontWeight: 600
                }}>
                  Không có số trúng.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", border: `1px solid ${colors.border}`, borderRadius: px(11), overflow: "hidden" }}>
                  <div style={{ ...rowStyle, padding: spacing(14, 15), background: colors.primarySoft, color: colors.primary, fontSize: px(15), fontWeight: 800 }}>
                    <span style={{ width: px(220), flexShrink: 0 }}>ĐÀI</span>
                    <span style={{ width: px(110), flexShrink: 0 }}>SỐ</span>
                    <span style={{ width: px(130), flexShrink: 0 }}>KIỂU</span>
                    <span style={{ width: px(80), flexShrink: 0, textAlign: "center" }}>NHÁY</span>
                    <span style={{
                      display: "flex",
                      width: px(250),
                      flexShrink: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      color: colors.danger,
                      textAlign: "center"
                    }}>ĐIỂM TRÚNG</span>
                    <span style={{ flex: 1, minWidth: 0, paddingLeft: px(20), textAlign: "right" }}>TIỀN TRÚNG</span>
                  </div>
                  {region.winningDetails.map((detail, detailIndex) => (
                    <div key={`${detail.betNumber}-${detailIndex}`} style={{
                      ...rowStyle,
                      padding: spacing(14, 15),
                      background: detailIndex % 2 === 0 ? colors.surface : "#f8fafc",
                      borderTop: detailIndex === 0 ? "none" : `1px solid ${colors.border}`,
                      fontSize: px(17)
                    }}>
                      <span style={{ width: px(220), flexShrink: 0, color: colors.muted, fontWeight: 700 }}>{detail.stations.join(", ") || "-"}</span>
                      <span style={{ width: px(110), flexShrink: 0, color: colors.danger, fontSize: px(21), fontWeight: 800 }}>{detail.betNumber}</span>
                      <span style={{ width: px(130), flexShrink: 0, color: colors.money, fontWeight: 700, textTransform: "uppercase" }}>{detail.betType}</span>
                      <span style={{ width: px(80), flexShrink: 0, color: colors.danger, textAlign: "center", fontWeight: 800 }}>{detail.winQuantity}</span>
                      <span style={{
                        display: "flex",
                        width: px(250),
                        flexShrink: 0,
                        alignItems: "baseline",
                        justifyContent: "center",
                        gap: px(5),
                        color: colors.danger,
                        whiteSpace: "nowrap",
                        textAlign: "center",
                        fontSize: px(18),
                        fontVariantNumeric: "tabular-nums"
                      }}>
                        {detail.winQuantity > 1 ? (
                          <>
                            <span style={{ fontWeight: 700 }}>
                              {formatNumber(detail.pricePerUnit)}n x {detail.winQuantity}
                            </span>
                            <span style={{ fontWeight: 800 }}>
                              = {formatNumber(detail.points)}n
                            </span>
                          </>
                        ) : (
                          <span style={{ fontWeight: 800 }}>{formatNumber(detail.points)}n</span>
                        )}
                      </span>
                      <span style={{
                        flex: 1,
                        minWidth: 0,
                        paddingLeft: px(20),
                        textAlign: "right",
                        color: colors.prize,
                        fontSize: px(19),
                        fontWeight: 800,
                        fontVariantNumeric: "tabular-nums"
                      }}>{formatNumber(detail.prize)}k</span>
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
        marginTop: px(28),
        marginBottom: px(28),
        padding: spacing(27, 31),
        borderRadius: px(16),
        color: "white",
        background: "linear-gradient(135deg, #0f172a, #1e293b)"
      }}>
        <span style={{ color: "#bfdbfe", fontSize: px(17), fontWeight: 800, letterSpacing: px(1.2), marginBottom: px(12) }}>TỔNG</span>
        {report.regions.map(region => (
          <div key={region.key} style={{ ...rowStyle, justifyContent: "space-between", padding: `${px(11)}px 0`, fontSize: px(22) }}>
            <div style={{ ...rowStyle, fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: "#93c5fd", fontWeight: 800, marginRight: px(8) }}>{region.key}</span>
              <span style={{ color: "#f8fafc", fontWeight: 700 }}>{formatNumber(region.totalInvestment)}</span>
              <span style={{ color: "#a8b3c5", margin: `0 ${px(7)}px` }}>Trúng</span>
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
          marginTop: px(13),
          paddingTop: px(18),
          borderTop: "1px solid #475569",
          fontSize: px(30),
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
