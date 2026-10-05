"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteCustomer } from "../actions"
import { useTransition } from "react"

export function DeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button 
      variant="destructive" 
      size="icon"
      className="h-11 w-11"
      aria-label="Xóa khách hàng"
      disabled={isPending}
      onClick={() => {
        if (confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
          startTransition(() => {
            deleteCustomer(id)
          })
        }
      }}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  )
}
