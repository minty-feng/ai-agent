import type { Metadata } from "next";
import "../styles/globals.css";

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
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
