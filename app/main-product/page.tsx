import MainProduct from '@/views/MainProduct';
import { getProductsByQuery } from '@/lib/storefront';

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
