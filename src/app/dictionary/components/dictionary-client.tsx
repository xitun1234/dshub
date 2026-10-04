"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Search, 
  Save, 
  RotateCcw, 
  Check, 
  AlertCircle,
  HelpCircle,
  Hash,
  MapPin
} from "lucide-react"
import { updateStationAliases, resetToDefault } from "../actions"
import { StationData } from "@/lib/stations"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function DictionaryClient({ initialStations }: { initialStations: StationData[] }) {
  const [stations, setStations] = useState<StationData[]>(initialStations)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"MN" | "MT" | "MB" | "CHUNG">("MN")
  
  // Track modified values per station ID
  const [localAliases, setLocalAliases] = useState<Record<string, string>>({})
  // Track saving state per station ID
  const [savingId, setSavingId] = useState<string | null>(null)
  // Track success flash per station ID
  const [successId, setSuccessId] = useState<string | null>(null)
  // Track error state per station ID
  const [errorId, setErrorId] = useState<string | null>(null)
  
  const [isPending, startTransition] = useTransition()

  // Handle local change in input
  const handleInputChange = (id: string, value: string) => {
    setLocalAliases(prev => ({ ...prev, [id]: value }))
    // Reset success status if editing again
    if (successId === id) setSuccessId(null)
    if (errorId === id) setErrorId(null)
  }

  // Handle save action
  const handleSave = async (id: string) => {
    const rawVal = localAliases[id] !== undefined 
      ? localAliases[id] 
      : stations.find(s => s.id === id)?.aliases || ""
      
    setSavingId(id)
    setErrorId(null)
    setSuccessId(null)
    
    const result = await updateStationAliases(id, rawVal)
    
    setSavingId(null)
    if (result.success) {
      setSuccessId(id)
      // Update local state value
      setStations(prev => prev.map(s => s.id === id ? { ...s, aliases: rawVal } : s))
      // Clear success notification after 3 seconds
      setTimeout(() => {
        setSuccessId(prev => prev === id ? null : prev)
      }, 3000)
    } else {
      setErrorId(id)
    }
  }

  // Reset all stations to default settings
  const handleReset = () => {
    startTransition(async () => {
      const result = await resetToDefault()
      if (result.success) {
        // Fetch new defaults or reload page
        window.location.reload()
      }
    })
  }

  // Filter stations based on tab and search query
  const filteredStations = stations.filter(s => {
    const matchesTab = s.region === activeTab
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.aliases.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  // Get display text for tabs
  const getTabLabel = (tab: typeof activeTab) => {
    switch (tab) {
      case "MN": return "Miền Nam"
      case "MT": return "Miền Trung"
      case "MB": return "Miền Bắc"
      case "CHUNG": return "Phím Tắt / Đài Chung"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Từ Điển Tên Miền / Nhà Đài
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Quản lý và tùy chỉnh các từ viết tắt của đài để công cụ nhận diện phơi số chính xác.
          </p>
        </div>
        
        {/* Reset button with confirmation dialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              className="border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 flex items-center gap-2 font-bold shrink-0 self-start sm:self-center"
              disabled={isPending}
            >
              <RotateCcw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
              ĐẶT LẠI MẶC ĐỊNH
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card-bg border-border text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-500">
                <AlertCircle className="w-6 h-6" />
                Xác nhận đặt lại mặc định?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Hành động này sẽ xóa toàn bộ các từ viết tắt tự cấu hình hiện tại và khôi phục lại các cài đặt viết tắt mặc định ban đầu của toàn bộ 3 miền.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">Hủy bỏ</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleReset} 
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Xác Nhận Đặt Lại
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Guide details */}
      <Card className="bg-primary-surface/10 border border-primary-border shadow-sm">
        <CardContent className="p-4 flex gap-3 text-sm">
          <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-foreground/80 font-medium">
            <p className="font-bold text-foreground">Hướng dẫn cấu hình viết tắt:</p>
            <p>• Các từ viết tắt cách nhau bởi dấu phẩy <code className="bg-foreground/5 px-1.5 py-0.5 rounded text-primary font-mono text-xs">,</code></p>
            <p>• Viết thường, không dấu, không khoảng trắng (Ví dụ với Bến Tre: <code className="bg-foreground/5 px-1.5 py-0.5 rounded text-teal-400 font-mono text-xs">bt, bentre, btre</code>)</p>
            <p>• Trong tab <span className="font-bold text-primary">Phím Tắt / Đài Chung</span>, bạn có thể chỉnh sửa các từ đại diện cho nhóm đài (Ví dụ: đặt <code className="bg-foreground/5 px-1.5 py-0.5 rounded text-teal-400 font-mono text-xs">cặp</code> là từ viết tắt của 2 đài)</p>
          </div>
        </CardContent>
      </Card>

      {/* Search and Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Region Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {(["MN", "MT", "MB", "CHUNG"] as const).map(tab => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all text-sm flex items-center gap-2 ${
                  isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "bg-card/70 hover:bg-primary-surface text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {tab === "CHUNG" ? <Hash className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                {getTabLabel(tab)}
              </button>
            )
          })}
        </div>

        {/* Search input */}
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm đài hoặc viết tắt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card-bg/50 border-border/50 text-foreground focus-visible:ring-primary h-10 rounded-xl"
          />
        </div>
      </div>

      {/* Grid of station cards */}
      {filteredStations.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground border border-border border-dashed rounded-2xl bg-card/60">
          Không tìm thấy nhà đài nào phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map(station => {
            const id = station.id
            const currentVal = localAliases[id] !== undefined ? localAliases[id] : station.aliases
            const hasChanged = currentVal !== station.aliases
            const isSaving = savingId === id
            const isSuccess = successId === id
            const isError = errorId === id

            return (
              <Card 
                key={id} 
                className={`bg-card border-border shadow-lg transition-all relative overflow-hidden hvr-lift ${
                  isSuccess ? 'ring-2 ring-emerald-500/30' : ''
                } ${isError ? 'ring-2 ring-rose-500/30' : ''}`}
              >
                <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center justify-between bg-foreground/[0.01]">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    {station.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-foreground/5 border-border/30">
                    {station.region === "CHUNG" ? "Chung" : `Miền ${station.region}`}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-semibold">Các từ viết tắt:</label>
                    <div className="flex gap-2">
                      <Input 
                        value={currentVal}
                        onChange={(e) => handleInputChange(id, e.target.value)}
                        placeholder="Ví dụ: bt, bentre, btre"
                        className="bg-foreground/5 border-border/50 text-foreground text-sm h-10 focus-visible:ring-primary rounded-lg flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (hasChanged || currentVal !== "")) {
                            e.preventDefault()
                            handleSave(id)
                          }
                        }}
                      />
                      
                      <Button
                        size="icon"
                        variant={hasChanged ? "premium" : "outline"}
                        className={`h-10 w-10 shrink-0 rounded-lg transition-all ${
                          isSuccess 
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white border-none" 
                          : isError 
                          ? "bg-rose-500 hover:bg-rose-600 text-white border-none"
                          : ""
                        }`}
                        onClick={() => handleSave(id)}
                        disabled={isSaving || (!hasChanged && !isSuccess && !isError)}
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isSuccess ? (
                          <Check className="w-4 h-4 animate-in zoom-in-50 duration-300" />
                        ) : isError ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Status labels */}
                  {isSuccess && (
                    <p className="text-[11px] font-bold text-emerald-500 animate-in fade-in slide-in-from-top-1">
                      ✓ Đã lưu thay đổi thành công!
                    </p>
                  )}
                  {isError && (
                    <p className="text-[11px] font-bold text-rose-500 animate-in fade-in slide-in-from-top-1">
                      ✗ Lỗi xảy ra khi lưu. Vui lòng thử lại.
                    </p>
                  )}
                  {!isSuccess && !isError && hasChanged && (
                    <p className="text-[11px] font-semibold text-primary animate-in fade-in">
                      ● Có thay đổi chưa lưu
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
