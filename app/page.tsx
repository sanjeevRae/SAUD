import type { Metadata } from 'next';
import Home from '@/views/Home';
import { getHomepageConfig } from '@/lib/storefront';

export const metadata: Metadata = {
  title: 'Saud Leather | Home',
  description: 'Discover featured products, curated collections, categories, and modern fashion essentials.',
};

export const revalidate = 60;

export default async function HomePage() {
  const homepage = await getHomepageConfig();
  return <Home homepage={homepage} />;
}
