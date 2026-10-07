import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Roboto_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "XSKT Manager",
  description: "Hệ thống quản lý xổ số chuyên nghiệp",
  icons: {
    icon: "/icon.png",
  },
};

import { getSession } from "@/lib/auth";

import { ThemeProvider } from "@/components/theme-provider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const sessionUser = session?.user;
  const user = sessionUser && typeof sessionUser === "object"
    && typeof sessionUser.id === "string"
    && typeof sessionUser.username === "string"
    ? {
        id: sessionUser.id,
        username: sessionUser.username,
        role: typeof sessionUser.role === "string" ? sessionUser.role : undefined,
      }
    : undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakartaSans.variable} ${robotoMono.variable} antialiased bg-background text-foreground flex min-h-dvh flex-col md:h-screen md:flex-row md:overflow-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Sidebar user={user} />
          <main className="w-full min-w-0 flex-1 pt-14 pb-[calc(5rem+env(safe-area-inset-bottom))] md:h-full md:overflow-y-auto md:pt-0 md:pb-0">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
