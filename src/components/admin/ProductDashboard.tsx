'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/data/products';

type Props = { token: string };

function money(value?: number) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

export default function ProductDashboard({ token }: Props) {
  const [items, setItems] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Loading products...');

  const load = useCallback(async () => {
    setStatus('Loading products...');
    const response = await fetch('/api/admin?action=products', { headers: { 'x-customer-id': token } });
    const data = await response.json().catch(() => ({}));
    setItems(data.products ?? []);
    setStatus(response.ok ? '' : data.error || 'Could not load products.');
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter(product => [product.id, product.name, product.category, product.description, product.tag].filter(Boolean).join(' ').toLowerCase().includes(term));
  }, [items, query]);

  const totalStock = items.reduce((sum, product) => sum + Number(product.stock || 0), 0);
  const inventoryValue = items.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0), 0);
  const lowStock = items.filter(product => Number(product.stock || 0) <= 5).length;

  return (
    <section className="border border-[#e0dbd4] bg-white shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
      <div className="border-b border-[#eee8e1] p-5 md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f1f35]">Products dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">All product inventory</h1>
            <p className="mt-2 text-sm text-[#666]">Table view for image, title, category, cost, quantity, rating, and status.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin?userId=${encodeURIComponent(token)}#products`} className="border border-[#ded8d0] px-4 py-2 text-sm font-semibold hover:border-[#111]">Back to admin</Link>
            <Link href="/main-product" className="bg-[#111] px-4 py-2 text-sm font-semibold text-white">View shop</Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="border border-[#eee8e1] bg-[#faf8f5] p-4"><p className="text-2xl font-semibold">{items.length}</p><p className="text-xs uppercase tracking-[0.14em] text-[#777]">Products</p></div>
          <div className="border border-[#eee8e1] bg-[#faf8f5] p-4"><p className="text-2xl font-semibold">{totalStock}</p><p className="text-xs uppercase tracking-[0.14em] text-[#777]">Quantity</p></div>
          <div className="border border-[#eee8e1] bg-[#faf8f5] p-4"><p className="text-2xl font-semibold">{money(inventoryValue)}</p><p className="text-xs uppercase tracking-[0.14em] text-[#777]">Inventory value</p></div>
          <div className="border border-[#eee8e1] bg-[#faf8f5] p-4"><p className="text-2xl font-semibold">{lowStock}</p><p className="text-xs uppercase tracking-[0.14em] text-[#777]">Low stock</p></div>
        </div>
      </div>

      <div className="p-5 md:p-7">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products by title, ID, category..." className="h-11 w-full border border-[#ded8d0] bg-[#fbfaf8] px-4 text-sm outline-none focus:border-[#111] sm:max-w-md" />
          <p className="text-sm text-[#666]">{status || `${filtered.length} shown`}</p>
        </div>

        <div className="overflow-x-auto border border-[#eee8e1]">
          <table className="min-w-[980px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#111] text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">Image</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Cost</th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Sizes</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => {
                const stock = Number(product.stock || 0);
                return (
                  <tr key={product.id} className="border-b border-[#eee8e1] last:border-b-0 hover:bg-[#faf8f5]">
                    <td className="px-4 py-3">
                      {product.image ? (
                        <img src={product.image} alt="" className="h-14 w-14 bg-[#eee9e2] object-cover" />
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center bg-[#eee9e2] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#777]">No image</span>
                      )}
                    </td>
                    <td className="max-w-[260px] px-4 py-3"><p className="font-semibold text-[#111]">{product.name}</p><p className="mt-1 text-xs text-[#777]">ID: {product.id}</p></td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3 font-semibold">{money(product.price)}</td>
                    <td className="px-4 py-3">{stock}</td>
                    <td className="px-4 py-3">{Number(product.rating || 0).toFixed(1)}</td>
                    <td className="px-4 py-3">{product.sizes?.join(', ') || '-'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold ${stock > 5 ? 'bg-[#dcfce7] text-[#166534]' : stock > 0 ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#fee2e2] text-[#991b1b]'}`}>{stock > 5 ? 'Active' : stock > 0 ? 'Low stock' : 'Out'}</span></td>
                    <td className="px-4 py-3"><Link href={product.linkHref || `/product/${product.id}`} className="font-semibold underline underline-offset-4">Open</Link></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-[#777]">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
