import type { Metadata } from 'next';
import Home from '@/pages/Home';
import { getHomepageConfig } from '@/lib/storefront';

export const metadata: Metadata = {
  title: 'ChitraTech Shop | Home',
  description: 'Discover featured products, curated collections, categories, and modern fashion essentials.',
};

export default async function HomePage() {
  const homepage = await getHomepageConfig();
  return <Home homepage={homepage} />;
}