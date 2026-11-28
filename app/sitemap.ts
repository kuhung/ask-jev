import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://askjev.kuhung.me/',
      lastModified: new Date('2026-11-28'),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
