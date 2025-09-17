import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "../globals.css";
import { Toaster } from "sonner";
import Header from "@/components/Header";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "AI Chat",
  description: "AI-powered chat tool",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <Header  />
        {/* Offset for fixed header */}
        <div className="pt-16 min-h-dvh">{children}</div>
      </body>
    </html>
  );
}
