import { getSession, type SessionUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession()
  const sessionUser = session?.user as { id?: unknown; username?: unknown } | undefined
  if (typeof sessionUser?.id !== "string" || typeof sessionUser.username !== "string") {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, username: true, role: true }
  })

  if (!user || user.role !== "admin") {
    throw new Error("Forbidden")
  }

  return { ...user, role: "admin" }
}
