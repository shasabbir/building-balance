
import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/app-layout';
import { Toaster } from "@/components/ui/toaster";
import { DateProvider } from '@/contexts/date-context';
import { DataProvider } from '@/contexts/data-context';
import { ThemeProvider } from '@/components/theme-provider';
import { PinAuth } from '@/components/pin-auth';
import { LanguageProvider } from '@/contexts/language-context';

export const metadata: Metadata = {
  title: 'Building Balance',
  description: 'Manage your building finances with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:,"></link>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <PinAuth>
              <DateProvider>
                <DataProvider>
                  <AppLayout>
                    {children}
                  </AppLayout>
                </DataProvider>
              </DateProvider>
            </PinAuth>
          </LanguageProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
