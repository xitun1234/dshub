"use client";

import { useState } from "react";
import { registerUser } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await registerUser(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <Card className="w-full max-w-md border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <CardHeader className="space-y-2 pb-8 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Tạo Tài Khoản
          </CardTitle>
          <CardDescription className="text-slate-400">
            Đăng kí để bắt đầu sử dụng hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Tên hiển thị</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Nguyễn Văn Nghĩa"
                  required
                  className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500 transition-all h-11"
                />
              </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Tên đăng nhập</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="nghia"
                required
                className="bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500 transition-all h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" university-id="password" className="text-slate-300">Mật khẩu</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-slate-950/50 border-white/10 text-white focus:border-indigo-500 focus:ring-indigo-500 transition-all h-11"
              />
            </div>
            {error && (
              <div className="p-3 text-sm font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-900/20 border-none transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Đang xử lý...
                </span>
              ) : (
                "Đăng kí ngay"
              )}
            </Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-sm text-slate-500">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Đăng nhập
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

