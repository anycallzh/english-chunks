import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ConfigInitializer } from "@/components/ConfigInitializer"; // 添加导入
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "英语块 - 轻松学习地道英语表达",
  description: "通过学习英语表达块，提升你的英语口语水平",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <ConfigInitializer /> {/* 添加这一行 */}
        <Navbar />
        {children}
      </body>
    </html>
  );
}
