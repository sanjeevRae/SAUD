import InsightDashboard from '@/components/admin/InsightDashboard';
import Link from 'next/link';
import { getDocument } from '@/lib/firestoreAdmin';

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
