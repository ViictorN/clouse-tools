import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ClientLayout } from '@/components/ClientLayout';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://clouse.app'),
  title: {
    default: 'Clouse Tools — 67 Free, Fast, Private Online Tools',
    template: '%s · Clouse Tools',
  },
  description:
    '67 free, private, client-side tools designed with the utmost craft. Zero tracking, zero ads, zero accounts required.',
  keywords: [
    'developer tools',
    'calculators',
    'unit converter',
    'json formatter',
    'base64',
    'qr code generator',
    'word counter',
    'online utilities',
    'private tools',
  ],
  authors: [{ name: 'Victor Gomes' }],
  creator: 'Victor Gomes',
  publisher: 'Clouse Tools',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clouse.app',
    title: 'Clouse Tools — 67 Free, Fast, Private Online Tools',
    description:
      '67 free, private, client-side tools designed with the utmost craft. Zero tracking, zero ads, zero accounts required.',
    siteName: 'Clouse Tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clouse Tools — 67 Free, Fast, Private Online Tools',
    description:
      '67 free, private, client-side tools designed with the utmost craft. Zero tracking, zero ads, zero accounts required.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0b0e',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
