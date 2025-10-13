import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { LanguageProvider } from "@/lib/language-context";
import { ErrorBoundary } from "@/components/error-boundary";

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
            <LanguageProvider>{children}</LanguageProvider>
          </ConvexClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
