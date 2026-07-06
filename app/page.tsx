import type { Metadata } from 'next';
import Home from '@/views/Home';
import { getHomepageConfig } from '@/lib/storefront';

export const metadata: Metadata = {
  title: 'Premium Leather Goods and Fashion Essentials',
  description: 'Discover Saud Leather featured products, curated collections, fashion categories, bags, apparel, and everyday essentials.',
  alternates: {
    canonical: '/',
  },
};

export const revalidate = 60;

export default async function HomePage() {
  const homepage = await getHomepageConfig();
  return <Home homepage={homepage} />;
}
