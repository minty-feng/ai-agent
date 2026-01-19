import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import "../styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HackerRank Dashboard",
  description: "Practice coding, compete, and get hired",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-gray-50 font-sans text-slate-900 antialiased`}>
        <div className="min-h-screen bg-gray-50">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
