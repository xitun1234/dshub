"use server";
// Force reload

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { login, logout } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function loginUser(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." };
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return { error: "Tên đăng nhập hoặc mật khẩu không đúng." };
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return { error: "Tên đăng nhập hoặc mật khẩu không đúng." };
  }

  await login({ id: user.id, username: user.username });
  
  revalidatePath("/");
  redirect("/");
}

export async function registerUser(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!username || !password) {
    return { error: "Vui lòng nhập đầy đủ thông tin." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    return { error: "Tên đăng nhập đã tồn tại." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      name,
    },
  });

  await login({ id: user.id, username: user.username });
  
  revalidatePath("/");
  redirect("/");
}

export async function logoutUser() {
  await logout();
  redirect("/login");
}

export async function seedAdmin() {
    const existing = await prisma.user.findUnique({ where: { username: 'nghia' }});
    if (existing) return { message: "Admin already exists" };

    const seedPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!seedPassword) return { message: "SEED_ADMIN_PASSWORD is not configured" };

    const hashedPassword = await bcrypt.hash(seedPassword, 10);
    await prisma.user.create({
        data: {
            username: 'nghia',
            password: hashedPassword,
            name: 'Nghĩa Admin',
            role: 'admin'
        }
    });
    return { success: true, message: "Admin seeded successfully" };
}
