import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/admin-auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin()
  } catch {
    redirect("/auth/logout")
  }

  return children
}
