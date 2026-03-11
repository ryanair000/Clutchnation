import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import '@/styles/globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartProvider } from '@/components/store/cart-provider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: {
    default: 'ClutchNation — Tournaments & Matches',
    template: '%s | ClutchNation',
  },
  description: 'Host and join tournaments and 1v1 matches for PlayStation gamers in Kenya. Compete, climb leaderboards, and prove you\'re the best.',
  keywords: ['tournament', 'PlayStation', 'Kenya', 'esports', 'gaming', 'competitive', 'FC26', 'NBA2K', 'COD'],
  openGraph: {
    type: 'website',
    title: 'ClutchNation — Tournaments & Matches',
    description: 'Host and join tournaments and 1v1 matches for PlayStation gamers in Kenya.',
    siteName: 'ClutchNation',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClutchNation — Tournaments & Matches',
    description: 'Host and join tournaments and 1v1 matches for PlayStation gamers in Kenya.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563EB',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://beuxwonfnbnjwcjpsqfg.supabase.co" />
        <link rel="preconnect" href="https://beuxwonfnbnjwcjpsqfg.supabase.co" />
      </head>
      <body className="flex min-h-full flex-col bg-surface-50 font-body text-ink">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white focus:outline-none"
        >
          Skip to main content
        </a>
        <CartProvider>
          <Header />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
