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
      <main className="admin-shell grid min-h-screen place-items-center px-5">
        <div className="mx-auto max-w-xl text-center">
          <p className="admin-eyebrow">404</p>
          <h1 className="mt-4 text-4xl font-semibold">Permission denied</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">
            This page does not exist for your account or you do not have access to view it.
          </p>
          <Link href="/" className="admin-button-primary mt-8 inline-flex px-5 py-2.5 text-sm font-medium">Back home</Link>
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
    <main className="admin-shell">
      <section className="border-b border-[var(--border)] bg-[var(--surface)] px-5 pb-16 pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="admin-eyebrow">Saud Leather</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Store command center</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-muted)]">
                Manage homepage visuals, product inventory, categories, customer stories, and upload-ready images from one dashboard.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/" className="admin-button-secondary px-5 py-2.5 text-sm font-medium">View shop</Link>
              <Link href={`/admin/insights?userId=${encodeURIComponent(userId)}`} className="admin-button-primary px-5 py-2.5 text-sm font-medium">View insight</Link>
              <Link href="/main-product" className="admin-button-secondary px-5 py-2.5 text-sm font-medium">Products</Link>
            </div>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {status.map(([label, value, helper]) => (
              <article key={label} className="admin-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="admin-eyebrow">{label}</p>
                    <p className="mt-2 text-lg font-semibold">{helper}</p>
                  </div>
                  <span className={`admin-status ${value ? 'admin-status-success' : 'admin-status-danger'}`}>
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
            <article key={item.path} className="admin-card p-5">
              <p className="admin-eyebrow">{item.count}</p>
              <h2 className="mt-3 text-xl font-semibold">{item.name}</h2>
              <p className="admin-mono mt-2 text-xs text-[var(--ink-muted)]"><code>{item.path}</code></p>
              <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">{item.fields}</p>
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
