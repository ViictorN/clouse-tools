import type { Metadata, Viewport } from 'next';
import { Inter, Inter_Tight, JetBrains_Mono, Newsreader } from 'next/font/google';
import './globals.css';
import { ClientLayout } from '@/components/ClientLayout';
import { SITE_URL } from '@/lib/site';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    url: SITE_URL,
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
    icon: '/icon-192.png',
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} ${newsreader.variable}`}
    >
      <head>
        <meta name="layoza-brand-allow" content="font:Inter" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('clouse-theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
