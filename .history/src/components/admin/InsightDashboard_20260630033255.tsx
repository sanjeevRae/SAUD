'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Boxes, CalendarDays, CheckCircle2, Clock3, Printer, ReceiptText, RefreshCcw, Search, ShoppingBag, Truck, Users, XCircle } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type OrderItem = {
  id?: string;
  name?: string;
  price?: number;
  image?: string;
  category?: string;
  quantity?: number;
  selectedSize?: string;
};

type Order = {
  id: string;
  user?: { id?: string; name?: string; email?: string; phone?: string };
  items?: OrderItem[];
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  deliveryLabel?: string;
  total?: number;
  paymentMethod?: string;
  status?: string;
  shippingAddress?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
};

type ProductStat = {
  id: string;
  name: string;
  image: string;
  category: string;
  quantity: number;
  revenue: number;
};

type RangeKey = 'today' | 'yesterday' | 'week' | 'month' | 'all';

const rangeOptions: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
];

const statusOptions = [
  { value: 'pending_cod', label: 'Pending COD' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
];

const statusLabels = Object.fromEntries(statusOptions.map(item => [item.value, item.label]));
const closedStatuses = new Set(['cancelled', 'returned']);
const chartPrimary = '#0F7B5C';
const chartPrimarySoft = '#E3F1EA';
const chartMuted = '#5B6168';
const chartBorder = '#E4E0D6';
const chartAccent = '#E8A23D';
const chartDanger = '#C1453A';
const chartSuccess = '#2E9469';

function money(value?: number) {
  return `Rs. ${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function parsedDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateLabel(value?: string) {
  const date = parsedDate(value);
  if (!date) return value || 'Unknown date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fullDate(value?: string) {
  const date = parsedDate(value);
  if (!date) return value || 'Unknown date';
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function rangeBounds(range: RangeKey) {
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (range === 'today') return { start: today, end: tomorrow };
  if (range === 'yesterday') {
    const start = new Date(today);
    start.setDate(start.getDate() - 1);
    return { start, end: today };
  }
  if (range === 'week') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start, end: tomorrow };
  }
  if (range === 'month') {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { start, end: tomorrow };
  }
  return { start: null, end: null };
}

function inRange(order: Order, range: RangeKey) {
  if (range === 'all') return true;
  const date = parsedDate(order.createdAt);
  if (!date) return false;
  const { start, end } = rangeBounds(range);
  return Boolean(start && end && date >= start && date < end);
}

function orderQuantity(order: Order) {
  return (order.items ?? []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function liveOrders(orders: Order[]) {
  return orders.filter(order => !closedStatuses.has(order.status || ''));
}

function dailySeries(orders: Order[]) {
  const byDay = new Map<string, { key: string; date: string; orders: number; revenue: number; returns: number; cancelled: number }>();
  orders.forEach(order => {
    const date = parsedDate(order.createdAt);
    const key = date ? dateKey(date) : 'unknown';
    const current = byDay.get(key) ?? { key, date: date ? dateLabel(order.createdAt) : 'Unknown', orders: 0, revenue: 0, returns: 0, cancelled: 0 };
    current.orders += 1;
    if (order.status === 'returned') current.returns += 1;
    if (order.status === 'cancelled') current.cancelled += 1;
    if (!closedStatuses.has(order.status || '')) current.revenue += Number(order.total || 0);
    byDay.set(key, current);
  });
  return Array.from(byDay.values()).sort((a, b) => a.key.localeCompare(b.key)).slice(-30);
}

function productStats(orders: Order[]) {
  const stats = new Map<string, ProductStat>();
  orders.forEach(order => {
    (order.items ?? []).forEach(item => {
      const id = String(item.id || item.name || 'unknown');
      const current = stats.get(id) ?? {
        id,
        name: String(item.name || 'Unnamed product'),
        image: String(item.image || ''),
        category: String(item.category || 'General'),
        quantity: 0,
        revenue: 0,
      };
      const quantity = Number(item.quantity || 0);
      current.quantity += quantity;
      current.revenue += Number(item.price || 0) * quantity;
      stats.set(id, current);
    });
  });
  return Array.from(stats.values()).sort((a, b) => b.revenue - a.revenue);
}

function categoryStats(products: ProductStat[]) {
  const stats = new Map<string, { name: string; value: number }>();
  products.forEach(product => {
    const current = stats.get(product.category) ?? { name: product.category, value: 0 };
    current.value += product.revenue;
    stats.set(product.category, current);
  });
  return Array.from(stats.values()).sort((a, b) => b.value - a.value).slice(0, 5);
}

function customerName(order: Order) {
  return order.user?.name || order.shippingAddress?.fullName || 'Customer';
}

function customerContact(order: Order) {
  return order.user?.email || order.shippingAddress?.email || order.user?.phone || order.shippingAddress?.phone || '-';
}

function statusClass(value?: string) {
  if (value === 'delivered') return 'admin-status admin-status-success';
  if (value === 'cancelled' || value === 'returned') return 'admin-status admin-status-danger';
  return 'admin-status admin-status-attention';
}

function printOrder(order: Order) {
  const rows = (order.items ?? []).map(item => `
    <tr>
      <td>${item.name || 'Product'}${item.selectedSize ? ` / Size ${item.selectedSize}` : ''}</td>
      <td>${item.category || '-'}</td>
      <td>${item.quantity || 0}</td>
      <td>${money(item.price)}</td>
      <td>${money(Number(item.price || 0) * Number(item.quantity || 0))}</td>
    </tr>
  `).join('');
  const address = order.shippingAddress ?? {};
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return false;
  printWindow.document.write(`
    <html>
      <head>
        <title>Order ${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111; padding: 32px; }
          h1 { margin: 0 0 6px; font-size: 26px; }
          .muted { color: #666; font-size: 13px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
          .box { border: 1px solid #ddd; padding: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th { background: #111; color: white; text-align: left; }
          th, td { border: 1px solid #ddd; padding: 10px; font-size: 13px; }
          .total { margin-top: 20px; text-align: right; font-size: 18px; font-weight: 700; }
          @media print { button { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Order ${order.id}</h1>
        <p class="muted">${fullDate(order.createdAt)} | ${statusLabels[order.status || ''] || order.status || 'Pending'} | ${order.paymentMethod || 'Cash on Delivery'}</p>
        <div class="grid">
          <div class="box">
            <strong>Customer</strong>
            <p>${customerName(order)}</p>
            <p class="muted">${customerContact(order)}</p>
          </div>
          <div class="box">
            <strong>Shipping address</strong>
            <p>${address.address || '-'}</p>
            <p class="muted">${[address.area, address.city, address.landmark].filter(Boolean).join(', ') || '-'}</p>
          </div>
        </div>
        <table>
          <thead><tr><th>Product</th><th>Category</th><th>Qty</th><th>Price</th><th>Line total</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="5">No products.</td></tr>'}</tbody>
        </table>
        <div class="total">Total: ${money(order.total)}</div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
  return true;
}

export default function InsightDashboard({ token }: { token: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<RangeKey>('today');
  const [status, setStatus] = useState('Loading orders...');
  const [updatingId, setUpdatingId] = useState('');

  const load = useCallback(async () => {
    setStatus('Loading orders...');
    const response = await fetch('/api/admin?action=orders', { headers: { 'x-customer-id': token } });
    const data = await response.json().catch(() => ({}));
    setOrders(data.orders ?? []);
    setStatus(response.ok ? '' : data.error || 'Could not load orders.');
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const rangedOrders = useMemo(() => orders.filter(order => inRange(order, range)), [orders, range]);
  const activeRangedOrders = useMemo(() => liveOrders(rangedOrders), [rangedOrders]);

  const filteredOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rangedOrders;
    return rangedOrders.filter(order => [
      order.id,
      order.status,
      customerName(order),
      customerContact(order),
      order.shippingAddress?.city,
      order.shippingAddress?.area,
      ...(order.items ?? []).map(item => item.name),
    ].filter(Boolean).join(' ').toLowerCase().includes(term));
  }, [rangedOrders, query]);

  const rangeCounts = useMemo(() => Object.fromEntries(rangeOptions.map(item => [item.key, orders.filter(order => inRange(order, item.key)).length])) as Record<RangeKey, number>, [orders]);

  const metrics = useMemo(() => {
    const revenue = activeRangedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const quantity = activeRangedOrders.reduce((sum, order) => sum + orderQuantity(order), 0);
    const customers = new Set(rangedOrders.map(order => order.user?.id || order.user?.email || order.shippingAddress?.phone).filter(Boolean)).size;
    const cancelled = rangedOrders.filter(order => order.status === 'cancelled').length;
    const returned = rangedOrders.filter(order => order.status === 'returned').length;
    const delivered = rangedOrders.filter(order => order.status === 'delivered').length;
    const pending = rangedOrders.filter(order => order.status === 'pending_cod').length;
    return { revenue, quantity, customers, cancelled, returned, delivered, pending };
  }, [activeRangedOrders, rangedOrders]);

  const series = useMemo(() => dailySeries(rangedOrders), [rangedOrders]);
  const products = useMemo(() => productStats(activeRangedOrders), [activeRangedOrders]);
  const categories = useMemo(() => categoryStats(products), [products]);
  const maxOrders = Math.max(...series.map(item => item.orders), 1);
  const bestDay = series.reduce((best, item) => item.orders > best.orders ? item : best, { date: 'No data', orders: 0, revenue: 0, key: '', returns: 0, cancelled: 0 });

  const updateOrderStatus = async (order: Order, nextStatus: string) => {
    if (order.status === nextStatus) return;
    setUpdatingId(order.id);
    setStatus(`Updating ${order.id}...`);
    const response = await fetch('/api/admin?action=orders', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-customer-id': token },
      body: JSON.stringify({ id: order.id, status: nextStatus }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(data.error || 'Could not update order.');
      setUpdatingId('');
      return;
    }
    setOrders(current => current.map(item => item.id === order.id ? data.order : item));
    setStatus('Order status updated.');
    setUpdatingId('');
  };

  const onPrint = (order: Order) => {
    const opened = printOrder(order);
    if (!opened) setStatus('Popup blocked. Allow popups to print order details.');
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-header p-5 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="admin-eyebrow">Store insight</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Orders and analytics</h1>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">Review checkout orders, print order details, track sales, and manage pending, delivered, returned, and cancelled orders.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin?userId=${encodeURIComponent(token)}`} className="admin-button-secondary px-4 py-2 text-sm font-semibold">Back to admin</Link>
            <button onClick={() => void load()} className="admin-button-secondary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"><RefreshCcw size={15} /> Refresh</button>
            <Link href="/main-product" className="admin-button-primary px-4 py-2 text-sm font-semibold">View shop</Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {rangeOptions.map(item => (
            <button key={item.key} onClick={() => setRange(item.key)} className={`border px-4 py-2 text-sm font-semibold transition ${range === item.key ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--ink)]' : 'admin-button-secondary'}`}>
              {item.label}
              <span className={`admin-mono ml-2 rounded-[6px] px-2 py-0.5 text-xs ${range === item.key ? 'bg-white text-[var(--primary)]' : 'bg-[var(--surface-sunken)] text-[var(--ink-muted)]'}`}>{rangeCounts[item.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 bg-[var(--bg)] p-5 md:grid-cols-2 md:p-7 xl:grid-cols-4">
        {[
          { label: 'Net revenue', value: money(metrics.revenue), helper: 'Excludes returned/cancelled', icon: ReceiptText },
          { label: 'Products sold', value: metrics.quantity.toLocaleString(), helper: 'Active order quantity', icon: Boxes },
          { label: 'Customers', value: metrics.customers.toLocaleString(), helper: `${rangedOrders.length} orders in period`, icon: Users },
          { label: 'Pending COD', value: metrics.pending.toLocaleString(), helper: 'Needs follow-up', icon: Clock3 },
          { label: 'Delivered', value: metrics.delivered.toLocaleString(), helper: 'Completed orders', icon: CheckCircle2 },
          { label: 'Cancelled', value: metrics.cancelled.toLocaleString(), helper: 'Stopped before delivery', icon: XCircle },
          { label: 'Returned', value: metrics.returned.toLocaleString(), helper: 'Returned by customer', icon: RefreshCcw },
          { label: 'Best day', value: bestDay.date, helper: `${bestDay.orders} orders`, icon: CalendarDays },
        ].map(item => (
          <article key={item.label} className="admin-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="admin-eyebrow">{item.label}</p>
                <p className="admin-kpi-number mt-3 truncate">{item.value}</p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">{item.helper}</p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]"><item.icon size={18} /></span>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-5 p-5 md:p-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.6fr)]">
        <article className="admin-card p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="admin-eyebrow">Analytics</p>
              <h2 className="mt-1 text-xl font-semibold">Net revenue trend</h2>
            </div>
            <span className="admin-status admin-status-success gap-1"><ArrowUpRight size={14} /> {rangeOptions.find(item => item.key === range)?.label}</span>
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor={chartPrimary} stopOpacity={0.34} />
                    <stop offset="95%" stopColor={chartPrimary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartBorder} vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: chartMuted, fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: chartMuted, fontSize: 12 }} />
                <Tooltip formatter={(value: number | string) => typeof value === 'number' ? money(value) : value} contentStyle={{ border: `1px solid ${chartBorder}`, borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke={chartPrimary} strokeWidth={3} fill="url(#revenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="admin-eyebrow">Most active day</p>
              <h2 className="mt-1 text-xl font-semibold">{bestDay.date}</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{bestDay.orders} orders, {money(bestDay.revenue)}</p>
            </div>
            <CalendarDays className="text-[var(--primary)]" size={20} />
          </div>
          <div className="mt-6 flex h-56 items-end gap-3">
            {series.map(item => (
              <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-44 w-full items-end rounded-md bg-[var(--surface-sunken)]">
                  <div className="w-full rounded-t-md bg-[var(--primary)]" style={{ height: `${Math.max(8, (item.orders / maxOrders) * 100)}%` }} />
                </div>
                <span className="max-w-full truncate text-xs text-[var(--ink-muted)]">{item.date}</span>
              </div>
            ))}
            {series.length === 0 && <p className="self-center text-sm text-[var(--ink-muted)]">No orders in this period.</p>}
          </div>
        </article>
      </div>

      <div className="grid gap-5 px-5 pb-5 md:px-7 md:pb-7 xl:grid-cols-[minmax(0,1fr)_390px]">
        <article className="admin-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="admin-eyebrow">Order management</p>
              <h2 className="mt-1 text-xl font-semibold">Checkout orders</h2>
            </div>
            <label className="flex h-11 items-center gap-2 border border-[var(--border)] bg-white px-3 text-sm">
              <Search size={16} className="text-[var(--ink-muted)]" />
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search orders..." className="h-full min-w-0 bg-transparent outline-none" />
            </label>
          </div>
          <p className="mt-3 text-sm text-[var(--ink-muted)]">{status || `${filteredOrders.length} orders shown for ${rangeOptions.find(item => item.key === range)?.label.toLowerCase()}`}</p>

          <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-[1160px] border-collapse text-left text-sm">
              <thead className="bg-[var(--surface-sunken)] text-[var(--ink)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Products</th>
                  <th className="px-4 py-3 font-semibold">Qty</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Delivery</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-b border-[var(--border)] align-top last:border-b-0">
                    <td className="px-4 py-4"><p className="admin-mono font-semibold">{order.id}</p><p className="mt-1 text-xs text-[var(--ink-muted)]">{fullDate(order.createdAt)}</p></td>
                    <td className="px-4 py-4"><p className="font-semibold">{customerName(order)}</p><p className="mt-1 text-xs text-[var(--ink-muted)]">{customerContact(order)}</p></td>
                    <td className="px-4 py-4">
                      <div className="grid gap-2">
                        {(order.items ?? []).map(item => (
                          <div key={`${order.id}-${item.id}-${item.selectedSize}`} className="flex items-center gap-3">
                            {item.image ? <img src={item.image} alt="" className="h-10 w-10 rounded-md bg-[var(--surface-sunken)] object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-md bg-[var(--surface-sunken)]"><ShoppingBag size={15} /></span>}
                            <span className="min-w-0"><span className="block max-w-[260px] truncate font-medium">{item.name || 'Product'}</span><span className="block text-xs text-[var(--ink-muted)]">{item.category || '-'}{item.selectedSize ? ` / Size ${item.selectedSize}` : ''} x {item.quantity || 0}</span></span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="admin-mono px-4 py-4 font-semibold">{orderQuantity(order)}</td>
                    <td className="admin-mono px-4 py-4 font-semibold">{money(order.total)}</td>
                    <td className="px-4 py-4">
                      <span className={statusClass(order.status)}>{statusLabels[order.status || ''] || order.status || 'Pending'}</span>
                      <select disabled={updatingId === order.id} value={order.status || 'pending_cod'} onChange={event => void updateOrderStatus(order, event.target.value)} className="mt-2 block h-9 w-36 border border-[var(--border)] bg-white px-2 text-xs outline-none disabled:opacity-60">
                        {statusOptions.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-4"><p className="inline-flex items-center gap-1"><Truck size={14} /> {order.deliveryLabel || 'Delivery'}</p><p className="mt-1 text-xs text-[var(--ink-muted)]">{order.shippingAddress?.city || '-'}{order.shippingAddress?.area ? `, ${order.shippingAddress.area}` : ''}</p></td>
                    <td className="px-4 py-4">
                      <button onClick={() => onPrint(order)} className="admin-button-primary inline-flex h-9 items-center gap-2 px-3 text-xs font-semibold">
                        <Printer size={14} /> Print
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-[var(--ink-muted)]">No orders found for this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <div className="grid gap-5">
          <article className="admin-card p-5">
            <p className="admin-eyebrow">Best selling products</p>
            <div className="mt-4 grid gap-4">
              {products.slice(0, 5).map(product => (
                <div key={product.id} className="grid grid-cols-[48px_1fr_auto] items-center gap-3">
                  {product.image ? <img src={product.image} alt="" className="h-12 w-12 rounded-md bg-[var(--surface-sunken)] object-cover" /> : <span className="h-12 w-12 rounded-md bg-[var(--surface-sunken)]" />}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="admin-mono mt-1 text-xs text-[var(--ink-muted)]">{product.quantity} sold</p>
                  </div>
                  <p className="admin-mono text-sm font-semibold">{money(product.revenue)}</p>
                </div>
              ))}
              {products.length === 0 && <p className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-[var(--ink-muted)]">Best sellers appear after active checkout orders are placed.</p>}
            </div>
          </article>

          <article className="admin-card p-5">
            <p className="admin-eyebrow">Category revenue</p>
            <div className="mt-4 h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={3}>
                    {categories.map((item, index) => <Cell key={item.name} fill={[chartPrimary, chartSuccess, chartAccent, '#6BAF96', '#A9D4C4'][index % 5]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number | string) => typeof value === 'number' ? money(value) : value} contentStyle={{ border: `1px solid ${chartBorder}`, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="admin-card p-5">
            <p className="admin-eyebrow">Order outcome</p>
            <div className="mt-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series}>
                  <CartesianGrid stroke={chartBorder} vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: chartMuted, fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: chartMuted, fontSize: 11 }} />
                  <Tooltip contentStyle={{ border: `1px solid ${chartBorder}`, borderRadius: 8 }} />
                  <Bar dataKey="orders" fill={chartPrimary} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="cancelled" fill={chartDanger} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="returns" fill={chartAccent} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
