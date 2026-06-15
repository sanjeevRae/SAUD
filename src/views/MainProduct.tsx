'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { products as fallbackProducts, type Product } from '@/data/products';

type MainProductProps = {
  products?: Product[];
  activeCategory?: string;
  query?: string;
};

export default function MainProduct({ products = fallbackProducts, activeCategory, query }: MainProductProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(query ?? '');
  const heading = activeCategory && activeCategory !== 'All products' ? activeCategory : query ? `Results for "${query}"` : 'Everything you need, in one place.';

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = searchValue.trim();
    router.push(value ? `/main-product?q=${encodeURIComponent(value)}` : '/main-product');
  };

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <Navbar />
      <CartDrawer />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-body text-xs uppercase tracking-[0.2em] text-[#8f1f35]">{activeCategory || 'All products'}</p>
            <h1 className="font-display mt-2 text-4xl font-semibold sm:text-5xl">{heading}</h1>
            <p className="mt-3 font-body text-sm text-[#666666]">{products.length} product{products.length === 1 ? '' : 's'} found from Firestore.</p>
          </div>
          <form onSubmit={submitSearch} className="flex w-full max-w-xl overflow-hidden rounded-full border border-[#dedede] bg-white shadow-sm">
            <input value={searchValue} onChange={event => setSearchValue(event.target.value)} placeholder="Search name, size, color, category..." className="min-w-0 flex-1 px-5 py-3 text-sm outline-none" />
            <button className="bg-[#111111] px-6 py-3 text-sm font-semibold text-white" type="submit">Search</button>
          </form>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-[#d9d9d9] px-6 py-16 text-center">
            <h2 className="font-body text-xl font-semibold">No products found</h2>
            <p className="font-body mt-2 text-sm text-[#666666]">Try a different search term, size, color, or category.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {products.map(product => (
              <Link key={product.id} href={product.linkHref || `/product/${product.id}`} className="group rounded-[28px] border border-[#ededed] p-4 transition-shadow hover:shadow-[0_18px_48px_rgba(0,0,0,0.08)]">
                <div className="aspect-[4/5] overflow-hidden rounded-[22px] bg-[#f5f5f5]">
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
                <div className="mt-4">
                  <p className="font-body text-xs uppercase tracking-[0.14em] text-[#8f1f35]">{product.category}</p>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <h2 className="font-body text-base font-semibold leading-tight">{product.name}</h2>
                    <span className="shrink-0 font-body text-sm font-semibold">Rs{Number(product.price).toFixed(2)}</span>
                  </div>
                  <p className="font-body mt-2 line-clamp-2 text-sm leading-6 text-[#666666]">{product.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(product.sizes ?? []).slice(0, 4).map(size => <span key={size} className="rounded-full border border-[#e5e5e5] px-3 py-1 text-xs text-[#555]">{size}</span>)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
