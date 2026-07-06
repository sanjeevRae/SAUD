import type { MetadataRoute } from 'next';
import { products } from '@/data/products';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://saud-leather.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const productRoutes = products.map(product => ({
    url: `${siteUrl}${product.canonicalPath || `/product/${product.id}`}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/main-product`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...productRoutes,
  ];
}
