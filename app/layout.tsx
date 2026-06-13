import { ErrorBoundary } from "@/components/error-boundary";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { DataProvider } from "@/lib/data-context";
import { DeviceProvider } from "@/lib/device-context";
import { LanguageProvider } from "@/lib/language-context";
import { Providers } from "./providers";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Class Tracker - Notification System",
  description: "Bilingual English/Thai class tracker for teachers and schools",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ErrorBoundary>
          <ConvexClientProvider>
            <DeviceProvider>
              <DataProvider>
                <LanguageProvider>
                  <Providers>{children}</Providers>
                </LanguageProvider>
              </DataProvider>
            </DeviceProvider>
          </ConvexClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
