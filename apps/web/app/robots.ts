import { MetadataRoute } from 'next'
import { brand } from '@/lib/brand'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/member/', '/admin/', '/api/'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL ?? brand.url}/sitemap.xml`,
  }
}
