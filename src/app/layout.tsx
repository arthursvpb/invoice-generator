import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { ThemeProvider } from '@/components/theme-provider';
import { StoreHydrator } from '@/components/store-hydrator';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';

const generalSans = localFont({
  src: [
    { path: '../../public/fonts/general-sans/GeneralSans-300.woff2', weight: '300', style: 'normal' },
    { path: '../../public/fonts/general-sans/GeneralSans-400.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/general-sans/GeneralSans-500.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/general-sans/GeneralSans-600.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/general-sans/GeneralSans-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-general-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500'],
  display: 'swap',
});

const appName = 'Invoice Generator';
const appDescription =
  'Local-first invoice and cancellation generator for contractors. Offline-capable, no backend, your data stays on your device.';
const canonicalUrl = 'https://invoice.arthurvasconcellos.com';

export const metadata: Metadata = {
  metadataBase: new URL(canonicalUrl),
  title: {
    default: `${appName} - AV LABS`,
    template: '%s · AV LABS',
  },
  description: appDescription,
  applicationName: appName,
  authors: [{ name: 'Arthur Vasconcellos' }],
  creator: 'Arthur Vasconcellos',
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'AV LABS',
    title: `${appName} - AV LABS`,
    description: appDescription,
    url: canonicalUrl,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${appName} - AV LABS`,
    description: appDescription,
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Invoice',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f3' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1d20' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${generalSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-background text-foreground min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StoreHydrator />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
        <Script
          src="https://cdn.delivr.ai/pixels/793e1a3e-6d4b-4949-9b73-2b7428a95e19/p.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
