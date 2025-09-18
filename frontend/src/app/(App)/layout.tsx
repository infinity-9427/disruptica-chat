import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "../globals.css";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import { AuthProvider } from "@/contexts/AuthContext";

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
    <html lang="en" suppressHydrationWarning >
      <body className={`${poppins.className} antialiased`}>
        <AuthProvider>
          <Header  />
          {/* Offset for fixed header */}
          <div className="pt-16 min-h-dvh">{children}</div>
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 5000,
              style: {
                fontSize: '14px',
                padding: '12px 16px',
                minHeight: '48px',
                maxWidth: '350px',
              },
            }}
            closeButton
          />
        </AuthProvider>
      </body>
    </html>
  );
}
