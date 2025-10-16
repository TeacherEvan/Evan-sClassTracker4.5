import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { LanguageProvider } from "@/lib/language-context";
import { ErrorBoundary } from "@/components/error-boundary";
import { DeviceProvider } from "@/lib/device-context";

export const metadata: Metadata = {
  title: "Class Tracker - Notification System",
  description: "Bilingual English/Thai class tracker for teachers and schools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorBoundary>
          <ConvexClientProvider>
            <DeviceProvider>
              <LanguageProvider>{children}</LanguageProvider>
            </DeviceProvider>
          </ConvexClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
