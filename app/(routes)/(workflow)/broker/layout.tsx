// app/(workflow)/realtor/dashboard/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { HelpCircle, Settings } from "lucide-react";
import "../../../globals.css"; // adjust import path if needed
import { ThemeProvider } from "@/components/theme-provider";

export const metadata = {
  title: "OnRoad - Broker Dashboard",
};

export default function BrokerLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <header className="border-b border-gray-300">
            <div className="max-w-7xl mx-auto h-10 px-4 flex items-center justify-between">
              <Link href="/">
                <Image
                  src="/favicon.ico"
                  alt="Favicon"
                  width={1741}
                  height={559}
                  className="cursor-pointer h-6 w-auto"
                />
              </Link>
              <div className="text-sm font-semibold">OnRoad</div>
              <div className="flex items-center gap-3">
                <Link href="/settings">
                  <Settings size={20} className="cursor-pointer hover:text-primary transition-colors" />
                </Link>
                <Link href="/realtor/support">
                  <HelpCircle size={20} className="cursor-pointer hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>
          </header>

          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
