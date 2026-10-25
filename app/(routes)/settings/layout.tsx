import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";
import Image from "next/image";
import { Settings } from "lucide-react";
import "../../globals.css";

export const metadata = {
  title: "Settings - OnRoad",
  description: "Manage your account settings and preferences",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="border-b">
            <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Image
                    src="/favicon.ico"
                    alt="OnRoad Logo"
                    width={1741}
                    height={559}
                    className="cursor-pointer h-8 w-auto"
                  />
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </div>
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
} 