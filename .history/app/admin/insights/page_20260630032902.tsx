import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { getDocument } from '@/lib/firestoreAdmin';

const InsightDashboard = nextDynamic(() => import('@/components/admin/InsightDashboard'), {
  loading: () => (
    <section className="admin-panel">
      <div className="admin-panel-header p-5 md:p-7">
        <p className="admin-eyebrow">Store insight</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Loading analytics...</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">Preparing charts, orders, and sales overview.</p>
      </div>
      <div className="grid gap-4 bg-[var(--bg)] p-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="admin-card h-28 animate-pulse" />
        ))}
      </div>
    </section>
  ),
});

export const dynamic = 'force-dynamic';

type AdminInsightsPageProps = {
  searchParams: Promise<{ userId?: string }>;
};

export default async function AdminInsightsPage({ searchParams }: AdminInsightsPageProps) {
  const params = await searchParams;
  const userId = params.userId || '';
  const account = userId ? await getDocument<{ id: string; role?: string }>('customers', userId) : null;
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

  return (
    <main className="admin-shell px-5 py-8 md:px-7">
      <div className="mx-auto max-w-7xl">
        <InsightDashboard token={userId} />
      </div>
    </main>
  );
}
