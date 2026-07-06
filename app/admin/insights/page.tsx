import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import Link from 'next/link';
import { getDocument } from '@/lib/firestoreAdmin';

const InsightDashboard = nextDynamic(() => import('@/components/admin/InsightDashboard'), {
  loading: () => (
   <section className="overflow-hidden border border-[#e0dbd4] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
      <div className="border-b border-[#eee8e1] bg-[#fbfaf8] p-5 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f1f35]">Store insight</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Loading analytics...</h1>
        <p className="mt-2 text-sm text-[#666]">Preparing charts, orders, and sales overview.</p>
      </div>
      <div className="grid gap-4 bg-[#f5f2ee] p-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse border border-[#e4ded6] bg-white" />
        ))}
      </div>
    </section>
  ),
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Insights',
  robots: {
    index: false,
    follow: false,
  },
};

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
      <main className="grid min-h-screen place-items-center bg-[#f4f1ed] px-5 text-[#111111]">
        <div className="mx-auto max-w-xl text-center">
           <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8f1f35]">404</p>
          <h1 className="mt-4 text-4xl font-semibold">Permission denied</h1>
          <p className="mt-4 text-sm leading-6 text-[#666666]">
            This page does not exist for your account or you do not have access to view it.
          </p>
          <Link href="/" className="mt-8 inline-flex bg-[#111111] px-5 py-2.5 text-sm font-medium text-white">Back home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f2ee] px-5 py-8 text-[#111111] md:px-7">
      <div className="mx-auto max-w-7xl">
        <InsightDashboard token={userId} />
      </div>
    </main>
  );
}
