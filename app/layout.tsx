import { ErrorBoundary } from "@/components/error-boundary";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { DeviceProvider } from "@/lib/device-context";
import { LanguageProvider } from "@/lib/language-context";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evan's ClassTracker - Built by teachers for Teachers",
  description: "Bilingual English/Thai class tracker for teachers and schools - Built by teachers for Teachers",
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
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
