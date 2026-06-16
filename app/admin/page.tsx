import Link from 'next/link';
import ProductAdmin from '@/components/admin/ProductAdmin';
import CmsAdmin from '@/components/admin/CmsAdmin';

export const dynamic = 'force-dynamic';

const collections = [
  { name: 'Products', path: 'products', fields: 'Prices, images, stock, colors, SEO', count: 'Store' },
  { name: 'Notice Banner', path: 'homepage/noticeBanners/items', fields: 'Quote, message, schedule, countdown, CTA', count: 'CMS' },
  { name: 'Hero', path: 'homepage/heroBanners/items', fields: 'Title, copy, CTA buttons, hero image', count: 'Landing' },
  { name: 'Collections', path: 'homepage/collections/items', fields: 'Collection title and feature image', count: 'CMS' },
  { name: 'Categories', path: 'categories', fields: 'Name, stock count, category image', count: 'Browse' },
  { name: 'Testimonials', path: 'testimonials', fields: 'Customer story, rating, avatar', count: 'Social' },
];

type AdminPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const adminToken = process.env.ADMIN_ACCESS_TOKEN;
  const isConfigured = Boolean(adminToken && adminToken !== 'change-this-admin-token');
  const isAllowed = isConfigured && params.token === adminToken;

  if (!isAllowed) {
    return (
      <main className="min-h-screen bg-[#f4f1ed] px-5 py-16 text-[#111111]">
        <div className="mx-auto max-w-xl border border-[#ded8d0] bg-white p-8 shadow-[0_20px_70px_rgba(0,0,0,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f1f35]">ChitraTech Admin</p>
          <h1 className="mt-3 text-3xl font-semibold">Admin access</h1>
          <p className="mt-3 text-sm leading-6 text-[#666666]">
            Set `ADMIN_ACCESS_TOKEN` in `.env.local`, then open `/admin?token=YOUR_TOKEN`.
          </p>
          {!isConfigured && <p className="mt-4 bg-[#fff7ed] p-3 text-sm text-[#9a3412]">Admin token is still missing or placeholder.</p>}
          <Link href="/" className="mt-6 inline-flex bg-[#111111] px-5 py-2.5 text-sm font-medium text-white">Back home</Link>
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
              <Link href={`/admin/insights?token=${encodeURIComponent(params.token || '')}`} className="border border-white/25 px-5 py-2.5 text-sm text-white transition hover:bg-white hover:text-black">View insight</Link>
              <Link href="/main-product" className="bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-[#f1d9df]">Products</Link>
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
          <CmsAdmin token={params.token || ''} />
          <ProductAdmin token={params.token || ''} />
        </div>
      </div>
    </main>
  );
}

