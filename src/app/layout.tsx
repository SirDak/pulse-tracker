import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DataProvider } from '@/context/DataContext';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'Pulse Tracker — Strain & Recovery',
  description: 'Personal health tracker with Whoop-style strain and recovery scoring, macro nutrition tracking, and workout logging.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-512.svg',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pulse',
  },
};

export const viewport: Viewport = {
  themeColor: '#0D1117',
  width: 'device-width',
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
      <body>
        <DataProvider>
          <main style={{
            minHeight: '100dvh',
            paddingBottom: '5rem',
          }}>
            {children}
          </main>
          <BottomNav />
        </DataProvider>
      </body>
    </html>
  );
}
