'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '@/data/products';

type FeaturedProductsProps = {
  products?: Product[];
};

export default function FeaturedProducts({ products = [] }: FeaturedProductsProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach(product => {
      const category = product.category?.trim();
      if (!category) return;
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });

    const topCategories = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([category]) => category);

    return ['All', ...topCategories];
  }, [products]);
  const visibleProducts = useMemo(() => (
    activeCategory === 'All' ? products : products.filter(product => product.category === activeCategory)
  ), [activeCategory, products]);

  if (!products.length) return null;

  return (
    <section id="featured" className="bg-white px-3 py-12 sm:px-4 md:px-6 lg:px-10">
      <div className="mb-6 flex items-center justify-between gap-3 sm:mb-7">
        <h2 className="font-body text-xl font-semibold text-[#111111] sm:text-2xl">Featured Now</h2>
        <div className="flex gap-2">
          <button className="icon-button h-8 w-8 rounded-full border border-[#dedede] sm:h-9 sm:w-9" aria-label="Previous featured products"><ChevronLeft size={16} /></button>
          <button className="icon-button h-8 w-8 rounded-full border border-[#dedede] sm:h-9 sm:w-9" aria-label="Next featured products"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="mb-7 flex flex-nowrap gap-2 overflow-x-auto pb-1 font-body sm:mb-9 sm:flex-wrap sm:overflow-visible">
        {categories.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`font-body shrink-0 rounded-full border px-4 py-2 text-[11px] sm:px-5 sm:text-xs ${activeCategory === category ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#dedede] bg-white text-[#111111]'}`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-5 lg:grid-cols-4">
        {visibleProducts.slice(0, 4).map(product => (
          <Link key={product.id} href={product.linkHref || `/product/${product.id}`} className="group min-w-0 text-left font-body">
            <div className="mb-2 aspect-[4/5] overflow-hidden rounded-lg bg-[#f1f1f1] sm:mb-3 sm:rounded-xl">
              <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <p className="mb-1 truncate font-body text-[9px] uppercase tracking-[0.08em] text-[#777777] sm:text-[11px] sm:tracking-[0.1em]">{product.category}</p>
            <h3 className="line-clamp-2 min-h-[34px] font-body text-[11px] font-medium leading-snug text-[#111111] sm:min-h-[42px] sm:text-sm">{product.name}</h3>
            <p className="mt-1.5 font-body text-[12px] font-semibold text-[#111111] sm:mt-3 sm:text-sm">Rs{product.price.toFixed(2)}</p>
          </Link>
        ))}
      </div>
      <div className="mt-7 text-center sm:mt-10">
        <Link href="/main-product" className="inline-flex rounded-full bg-[#111111] px-5 py-2.5 text-xs font-medium !text-white sm:px-6 sm:py-3 font-body">
          <span className="!text-white">View All Product</span>
        </Link>
      </div>
    </section>
  );
}
