import InsightDashboard from '@/components/admin/InsightDashboard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type AdminInsightsPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AdminInsightsPage({ searchParams }: AdminInsightsPageProps) {
  const params = await searchParams;
  const adminToken = process.env.ADMIN_ACCESS_TOKEN;
  const isConfigured = Boolean(adminToken && adminToken !== 'change-this-admin-token');
  const token = params.token || '';
  const isAllowed = isConfigured && token === adminToken;

  if (!isAllowed) {
    return (
      <main className="min-h-screen bg-[#f4f1ed] px-5 py-16 text-[#111111]">
        <div className="mx-auto max-w-xl border border-[#ded8d0] bg-white p-8 shadow-[0_20px_70px_rgba(0,0,0,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f1f35]">ChitraTech Admin</p>
          <h1 className="mt-3 text-3xl font-semibold">Insight access</h1>
          <p className="mt-3 text-sm leading-6 text-[#666666]">
            Set `ADMIN_ACCESS_TOKEN` in `.env.local`, then open `/admin/insights?token=YOUR_TOKEN`.
          </p>
          {!isConfigured && <p className="mt-4 bg-[#fff7ed] p-3 text-sm text-[#9a3412]">Admin token is still missing or placeholder.</p>}
          <div className="mt-6 flex gap-3">
            <Link href="/admin" className="inline-flex border border-[#ded8d0] px-5 py-2.5 text-sm font-medium text-[#111111]">Admin</Link>
            <Link href="/" className="inline-flex bg-[#111111] px-5 py-2.5 text-sm font-medium text-white">Back home</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f2ee] px-5 py-8 text-[#111111] md:px-7">
      <div className="mx-auto max-w-7xl">
        <InsightDashboard token={token} />
      </div>
    </main>
  );
}
