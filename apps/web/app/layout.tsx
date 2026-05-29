import type { Metadata, Viewport } from 'next';
import { brand } from '@/lib/brand';
import { getSiteConfig } from '@/lib/site-config';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { GA4Script } from '@/components/ui/GA4Script';
import './globals.css';

const FONT_URLS: Record<string, string> = {
  'Cormorant Garamond': 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap',
  'Playfair Display':   'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&display=swap',
  'EB Garamond':        'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap',
  'Montserrat':         'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
  'Raleway':            'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&display=swap',
};

export const metadata: Metadata = {
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  keywords: [...brand.keywords],
  authors: [{ name: brand.name }],
  creator: brand.name,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? brand.url),
  openGraph: {
    type: 'website',
    locale: brand.locale,
    siteName: brand.name,
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: brand.name,
    description: brand.tagline,
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    title: brand.shortName,
    statusBarStyle: 'black-translucent',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: brand.primaryColor,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteConfig = await getSiteConfig();
  const primaryColor = typeof siteConfig['brand.primaryColor'] === 'string'
    ? siteConfig['brand.primaryColor']
    : brand.primaryColor;
  const fontFamily = typeof siteConfig['brand.fontFamily'] === 'string'
    ? siteConfig['brand.fontFamily']
    : 'Cormorant Garamond';
  const fontUrl = FONT_URLS[fontFamily] ?? FONT_URLS['Cormorant Garamond'];

  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={brand.shortName} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={fontUrl} />
        <style>{`:root { --gold: ${primaryColor}; --font-primary: '${fontFamily}', Georgia, serif; }`}</style>
      </head>
      <body>
        {children}
        <CookieConsent />
        <GA4Script />
      </body>
    </html>
  );
}
