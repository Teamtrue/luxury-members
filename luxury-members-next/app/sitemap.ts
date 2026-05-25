import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://luxurymembers.example';
  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/signup`, lastModified: new Date() },
    { url: `${base}/privacy`, lastModified: new Date() },
    { url: `${base}/terms`, lastModified: new Date() },
    { url: `${base}/refund-policy`, lastModified: new Date() },
    { url: `${base}/grievance`, lastModified: new Date() }
  ];
}
