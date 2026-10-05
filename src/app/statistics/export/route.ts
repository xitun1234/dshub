import { createElement } from "react"
import { ImageResponse } from "next/og"
import { requireUser } from "@/lib/auth"
import {
  estimateStatisticsReportHeight,
  getStatisticsReport
} from "@/lib/statistics-report"
import { StatisticsReportImage } from "./report-image"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MAX_IMAGE_HEIGHT = 12000

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
}

export async function GET(request: Request) {
  let user
  try {
    user = await requireUser()
  } catch {
    return new Response("Vui lòng đăng nhập để xuất báo cáo.", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get("customer")?.trim() || ""
  const date = searchParams.get("date")?.trim() || ""

  if (!customerId || !isValidDate(date)) {
    return new Response("Khách hàng hoặc ngày thống kê không hợp lệ.", { status: 400 })
  }

  try {
    const report = await getStatisticsReport(user.id, customerId, date)
    if (!report) {
      return new Response("Không tìm thấy khách hàng.", { status: 404 })
    }
    if (report.regions.length === 0) {
      return new Response("Khách hàng chưa có phơi trong ngày đã chọn.", { status: 404 })
    }

    const height = estimateStatisticsReportHeight(report)
    if (height > MAX_IMAGE_HEIGHT) {
      return new Response(
        "Báo cáo có quá nhiều dữ liệu để xuất thành một ảnh. Vui lòng rút gọn số phơi.",
        { status: 413 }
      )
    }

    return new ImageResponse(
      createElement(StatisticsReportImage, { report }),
      {
        width: 1080,
        height,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          "Content-Disposition": `inline; filename="thong-ke-${date}.png"`
        }
      }
    )
  } catch (error: unknown) {
    console.error("Không thể xuất ảnh thống kê:", error)
    return new Response("Không thể tạo ảnh thống kê. Vui lòng thử lại.", { status: 500 })
  }
}
