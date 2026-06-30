'use client';

import { useState } from 'react';

type SeedResponse = {
  ok?: boolean;
  uploadedAssets?: number;
  counts?: Record<string, number>;
  error?: string;
};

export default function SeedStorefrontButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeedResponse | null>(null);

  const seed = async () => {
    if (!confirm('Push current local content to Firestore and upload local images to Cloudinary?')) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin?action=seed', { method: 'POST', headers: { 'x-customer-id': token } });
      const data = await response.json();
      setResult(response.ok ? data : { error: data.error || 'Seed failed.' });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Seed failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border border-[#e0dbd4] bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.06)] md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f1f35]">Content seed</p>
          <h2 className="mt-2 text-2xl font-semibold">Push current storefront to Firebase</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#666]">
            Uploads local public images to Cloudinary, then writes hero, products, featured products, collections, categories, and testimonials to Firestore.
          </p>
        </div>
        <button onClick={seed} disabled={loading} className="bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f1f35] disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? 'Pushing content...' : 'Push current content'}
        </button>
      </div>
      {result && (
        <div className={`mt-4 p-4 text-sm ${result.error ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#ecfdf5] text-[#166534]'}`}>
          {result.error ? result.error : `Seed complete. Uploaded ${result.uploadedAssets ?? 0} assets.`}
          {result.counts && <p className="mt-2 text-xs">{Object.entries(result.counts).map(([key, value]) => `${key}: ${value}`).join(' / ')}</p>}
        </div>
      )}
    </section>
  );
}
