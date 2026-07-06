import type { Metadata } from 'next';
import MainProduct from '@/views/MainProduct';
import { getProductsByQuery } from '@/lib/storefront';

export const metadata: Metadata = {
  title: 'Shop Products',
  description: 'Browse Saud Leather products, including leather goods, fashion essentials, bags, apparel, and curated collections.',
  alternates: {
    canonical: '/main-product',
  },
  openGraph: {
    title: 'Shop Products | Saud Leather',
    description: 'Browse Saud Leather products, leather goods, bags, apparel, and curated collections.',
    url: '/main-product',
  },
};

type MainProductRouteProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    gender?: string;
    sort?: string;
    title?: string;
  }>;
};

export default async function MainProductRoute({ searchParams }: MainProductRouteProps) {
  const params = await searchParams;
  const products = await getProductsByQuery({
    q: params.q,
    category: params.category,
    gender: params.gender,
    sort: params.sort,
    limit: 64,
  });

  return (
    <MainProduct
      products={products}
      activeCategory={params.title || params.category || params.gender}
      query={params.q}
    />
  );
}
