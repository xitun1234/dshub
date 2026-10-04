import { getStations } from "@/lib/stations"
import { DictionaryClient } from "./components/dictionary-client"

export const metadata = {
  title: "Từ điển tên miền | XSKT Manager",
  description: "Cấu hình từ viết tắt và ký tự đại diện cho các đài xổ số miền Nam, Trung, Bắc và đài chung.",
}

export default async function DictionaryPage() {
  const stations = await getStations()

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <DictionaryClient initialStations={stations} />
    </div>
  )
}
