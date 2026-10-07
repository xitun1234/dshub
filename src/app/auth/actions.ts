"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { login, logout } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function loginUser(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!username || !password) {
    return { error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." }
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, password: true, role: true }
  })

  if (
    !user
    || (user.role !== "admin" && user.role !== "user")
    || !(await bcrypt.compare(password, user.password))
  ) {
    return { error: "Tên đăng nhập hoặc mật khẩu không đúng." }
  }

  await login({ id: user.id, username: user.username, role: user.role })
  revalidatePath("/")
  redirect(user.role === "admin" ? "/admin" : "/")
}

export async function logoutUser() {
  await logout()
  redirect("/login")
}
