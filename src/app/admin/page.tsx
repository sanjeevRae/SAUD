'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ProductAdmin from '@/components/admin/ProductAdmin';
import CmsAdmin from '@/components/admin/CmsAdmin';

const collections = [
  { name: 'Products', path: 'products', fields: 'Prices, images, stock, colors, SEO', count: 'Store' },
  { name: 'Notice Banner', path: 'homepage/noticeBanners/items', fields: 'Quote, message, schedule, countdown, CTA', count: 'CMS' },
  { name: 'Hero', path: 'homepage/heroBanners/items', fields: 'Title, copy, CTA buttons, hero image', count: 'Landing' },
  { name: 'Collections', path: 'homepage/collections/items', fields: 'Collection title and feature image', count: 'CMS' },
  { name: 'Categories', path: 'categories', fields: 'Name, stock count, category image', count: 'Browse' },
  { name: 'Testimonials', path: 'testimonials', fields: 'Customer story, rating, avatar', count: 'Social' },
];

const status = [
  ['Firestore', 'Configured in environment', 'Database writes'],
  ['Cloudinary', 'Configured in environment', 'Image library'],
  ['Upload preset', 'Configured in environment', 'Browser uploads'],
] as const;

export default function AdminPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  if (!token) {
    return (
      <main className="min-h-screen bg-[#f4f1ed] px-5 py-16 text-[#111111]">
        <div className="mx-auto max-w-xl border border-[#ded8d0] bg-white p-8 shadow-[0_20px_70px_rgba(0,0,0,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f1f35]">ChitraTech Admin</p>
          <h1 className="mt-3 text-3xl font-semibold">Admin access</h1>
          <p className="mt-3 text-sm leading-6 text-[#666666]">
            Open this page with `/admin?token=YOUR_TOKEN` after deployment.
          </p>
          <Link href="/" className="mt-6 inline-flex bg-[#111111] px-5 py-2.5 text-sm font-medium text-white">Back home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f2ee] text-[#111111]">
      <section className="bg-[#111111] px-5 pb-16 pt-8 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6b1bb]">ChitraTech Shop</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Store command center</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                Manage homepage visuals, product inventory, categories, customer stories, and upload-ready images from one dashboard.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/" className="border border-white/25 px-5 py-2.5 text-sm text-white transition hover:bg-white hover:text-black">View shop</Link>
              <Link href="#insights" className="border border-white/25 px-5 py-2.5 text-sm text-white transition hover:bg-white hover:text-black">View insight</Link>
              <Link href="#products" className="bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-[#f1d9df]">Products</Link>
            </div>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {status.map(([label, , helper]) => (
              <article key={label} className="border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</p>
                    <p className="mt-2 text-lg font-semibold">{helper}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold bg-[#d9f99d] text-[#365314]">
                    Ready
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-10 max-w-7xl px-5 pb-16">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {collections.map(item => (
            <article key={item.path} className="border border-[#e2ddd6] bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f1f35]">{item.count}</p>
              <h2 className="mt-3 text-xl font-semibold">{item.name}</h2>
              <p className="mt-2 text-xs text-[#777777]"><code>{item.path}</code></p>
              <p className="mt-4 text-sm leading-6 text-[#555555]">{item.fields}</p>
            </article>
          ))}
        </section>

        <div className="mt-8 space-y-8">
          <div id="insights" className="border border-[#e2ddd6] bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f1f35]">Insights</p>
            <p className="mt-2 text-sm leading-6 text-[#555555]">Orders analytics remain available, but use the main admin page links to avoid extra deployment functions on Vercel Hobby.</p>
            <Link href={`/admin/insights?token=${encodeURIComponent(token)}`} className="mt-4 inline-flex border border-[#ded8d0] bg-white px-4 py-2 text-sm font-semibold text-[#111] transition hover:border-[#111]">
              Open legacy insights page
            </Link>
          </div>
          <CmsAdmin token={token} />
          <div id="products">
            <ProductAdmin token={token} />
          </div>
        </div>
      </div>
    </main>
  );
}


