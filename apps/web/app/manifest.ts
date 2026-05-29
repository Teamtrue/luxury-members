import { MetadataRoute } from 'next'
import { brand } from '@/lib/brand'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} — ${brand.tagline}`,
    short_name: brand.shortName,
    description: brand.description,
    start_url: '/member',
    display: 'standalone',
    background_color: brand.backgroundColor,
    theme_color: brand.primaryColor,
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    categories: ['finance', 'shopping', 'lifestyle'],
    lang: 'en-IN',
    dir: 'ltr',
    scope: '/',
    prefer_related_applications: false,
  }
}
