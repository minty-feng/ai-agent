import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "ModelBridge — 企业级 AI 中台 SaaS 平台",
  description:
    "一站式接入 GPT-4o、Claude 3.5、Gemini 1.5、Llama 3 等主流大模型，提供 API、RAG、参数提取、智能客服等全栈 AI 能力。",
  keywords: ["AI", "大模型", "SaaS", "API", "LLM", "GPT", "Claude", "ModelBridge"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <Navbar />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
