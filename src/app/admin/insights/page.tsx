import Link from 'next/link';
import InsightDashboard from '@/components/admin/InsightDashboard';

type AdminInsightsPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AdminInsightsPage({ searchParams }: AdminInsightsPageProps) {
  const params = await searchParams;
  const adminToken = process.env.ADMIN_ACCESS_TOKEN;
  const isConfigured = Boolean(adminToken && adminToken !== 'change-this-admin-token');
  const isAllowed = isConfigured && params.token === adminToken;

  if (!isAllowed) {
    return (
      <main className="min-h-screen bg-[#f4f1ed] px-5 py-16 text-[#111]">
        <div className="mx-auto max-w-xl border border-[#ded8d0] bg-white p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f1f35]">ChitraTech Admin</p>
          <h1 className="mt-3 text-3xl font-semibold">Admin access required</h1>
          <p className="mt-3 text-sm text-[#666]">Open this page with `/admin?token=YOUR_TOKEN#insights`.</p>
          <Link href="/admin" className="mt-6 inline-flex bg-[#111] px-5 py-2.5 text-sm font-medium text-white">Back</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f2ee] px-5 py-8 text-[#111]">
      <div className="mx-auto max-w-7xl">
        <InsightDashboard token={params.token || ''} />
      </div>
    </main>
  );
}
