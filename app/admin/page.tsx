import Link from 'next/link';
import ProductAdmin from '@/components/admin/ProductAdmin';
import CmsAdmin from '@/components/admin/CmsAdmin';
import { getDocument } from '@/lib/firestoreAdmin';

export const dynamic = 'force-dynamic';

const collections = [
  { name: 'Products', path: 'products', fields: 'Prices, images, stock, colors, SEO', count: 'Store' },
  { name: 'Notice Banner', path: 'homepage/noticeBanners/items', fields: 'Quote, message, schedule, countdown, CTA', count: 'CMS' },
  { name: 'Hero', path: 'homepage/heroBanners/items', fields: 'Title, copy, CTA buttons, hero image', count: 'Landing' },
  { name: 'Collections', path: 'homepage/collections/items', fields: 'Collection title and feature image', count: 'CMS' },
  { name: 'Categories', path: 'categories', fields: 'Name, stock count, category image', count: 'Browse' }
];

type AdminPageProps = {
  searchParams: Promise<{ userId?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const userId = params.userId || '';
  const account = userId ? await getDocument<{ id: string; role?: string; name?: string }>('customers', userId) : null;
  const isAllowed = account?.role === 'admin';

  if (!isAllowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f1ed] px-5 text-[#111111]">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8f1f35]">404</p>
          <h1 className="mt-4 text-4xl font-semibold">Permission denied</h1>
          <p className="mt-4 text-sm leading-6 text-[#666666]">
            This page does not exist for your account or you do not have access to view it.
          </p>
          <Link href="/" className="mt-8 inline-flex bg-[#111111] px-5 py-2.5 text-sm font-medium" style={{ color: '#ffffff' }}>Back home</Link>
        </div>
      </main>
    );
  }

  const status = [
    ['Firestore', process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 'Database writes'],
    ['Cloudinary', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 'Image library'],
    ['Upload preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET, 'Browser uploads'],
  ];

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
              <Link href={`/admin/insights?userId=${encodeURIComponent(userId)}`} className="border border-white/25 px-5 py-2.5 text-sm text-white transition hover:bg-white hover:text-black">View insight</Link>
              <Link href="/main-product" className="bg-white px-5 py-2.5 text-sm font-medium transition hover:bg-[#f1d9df]" style={{ color: '#000000' }}>Products</Link>
            </div>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {status.map(([label, value, helper]) => (
              <article key={label} className="border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-white/45">{label}</p>
                    <p className="mt-2 text-lg font-semibold">{helper}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold ${value ? 'bg-[#d9f99d] text-[#365314]' : 'bg-[#fecaca] text-[#7f1d1d]'}`}>
                    {value ? 'Ready' : 'Missing'}
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
          <CmsAdmin token={userId} />
          <ProductAdmin token={userId} />
        </div>
      </div>
    </main>
  );
}

