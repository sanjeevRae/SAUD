'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ChevronDown, Mail, MapPin, Minus, PackageCheck, Phone, Plus, RefreshCcw, ShoppingBag, Star, Trash2, UserRound, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/context/CartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  landmark: string;
  photo: string;
};

type OrderItem = {
  id?: string;
  name?: string;
  price?: number;
  image?: string;
  category?: string;
  quantity?: number;
  selectedSize?: string;
};

type CustomerOrder = {
  id: string;
  items?: OrderItem[];
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  deliveryLabel?: string;
  total?: number;
  status?: string;
  shippingAddress?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
};

type ReviewDraft = {
  rating: number;
  text: string;
};

type ProductReview = {
  id: string;
  productId?: string;
  productName?: string;
  userPhoto?: string;
  rating?: number;
  text?: string;
  createdAt?: string;
  updatedAt?: string;
};

const emptyForm: ProfileForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  area: '',
  landmark: '',
  photo: '',
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?';
}

function money(value?: number) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function customerNameFallback(order: CustomerOrder) {
  return order.shippingAddress?.fullName || 'Customer';
}

const statusLabels: Record<string, string> = {
  pending_cod: 'Pending COD',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export default function ProfileDashboard() {
  const { user, openLogin, updateProfile, authStatus } = useCustomerAuth();
  const { items, totalPrice, updateQuantity, removeFromCart, checkout, checkoutStatus } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [uploadStatus, setUploadStatus] = useState('');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersStatus, setOrdersStatus] = useState('');
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({});
  const [reviewStatus, setReviewStatus] = useState('');
  const [editingOrderId, setEditingOrderId] = useState('');
  const [orderDrafts, setOrderDrafts] = useState<Record<string, Record<string, string>>>({});
  const [orderActionStatus, setOrderActionStatus] = useState('');
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      area: user.area || '',
      landmark: user.landmark || '',
      photo: user.photo || '',
    });
  }, [user]);

  const loadOrdersAndReviews = useCallback(async () => {
    if (!user) return;
    setOrdersStatus('Loading your orders...');
    const [ordersResponse, reviewsResponse] = await Promise.all([
      fetch(`/api/customer?action=orders&userId=${encodeURIComponent(user.id)}`),
      fetch(`/api/customer?action=reviews&userId=${encodeURIComponent(user.id)}`),
    ]);
    const ordersData = await ordersResponse.json().catch(() => ({}));
    const reviewsData = await reviewsResponse.json().catch(() => ({}));
    setOrders(ordersData.orders ?? []);
    setReviews(reviewsData.reviews ?? []);
    setOrdersStatus(ordersResponse.ok ? '' : ordersData.error || 'Could not load orders.');
    if (!reviewsResponse.ok) setReviewStatus(reviewsData.error || 'Could not load reviews.');
  }, [user]);

  useEffect(() => {
    void loadOrdersAndReviews();
  }, [loadOrdersAndReviews]);

  const displayName = form.name.trim() || user?.name || 'Customer';
  const completion = useMemo(() => {
    const fields = [form.name, form.email || form.phone, form.address, form.city, form.area, form.photo];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form]);

  const reviewsByProduct = useMemo(() => {
    return Object.fromEntries(reviews.map(review => [String(review.productId || ''), review]).filter(([productId]) => productId));
  }, [reviews]);

  const setField = (key: keyof ProfileForm, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const uploadAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadStatus('Choose an image file.');
      return;
    }
    if (file.size > 700_000) {
      setUploadStatus('Use an image smaller than 700 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setField('photo', String(reader.result || ''));
      setUploadStatus('New profile image ready. Save changes to keep it.');
    };
    reader.onerror = () => setUploadStatus('Could not read image.');
    reader.readAsDataURL(file);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void updateProfile(form);
  };

  const updateReviewDraft = (key: string, update: Partial<ReviewDraft>) => {
    setReviewDrafts(current => ({ ...current, [key]: { ...(current[key] ?? { rating: 5, text: '' }), ...update } }));
  };

  const submitReview = async (order: CustomerOrder, item: OrderItem) => {
    if (!user || !item.id) return;
    const key = item.id;
    const draft = reviewDrafts[key] ?? { rating: 5, text: '' };
    setReviewStatus('Saving review...');
    const response = await fetch('/api/customer?action=reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user, productId: item.id, productName: item.name, rating: draft.rating, text: draft.text }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setReviewStatus(data.error || 'Could not save review.');
      return;
    }
    setReviews(current => {
      const next = current.filter(review => review.productId !== item.id);
      return [data.review, ...next];
    });
    setReviewDrafts(current => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setReviewStatus('Review saved. It will appear on the product page.');
  };

  const deleteReview = async (item: OrderItem) => {
    if (!user || !item.id) return;
    if (!confirm('Delete this review?')) return;
    setReviewStatus('Deleting review...');
    const response = await fetch(`/api/customer?action=reviews&userId=${encodeURIComponent(user.id)}&productId=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setReviewStatus(data.error || 'Could not delete review.');
      return;
    }
    setReviews(current => current.filter(review => review.productId !== item.id));
    setReviewDrafts(current => {
      const next = { ...current };
      delete next[item.id || ''];
      return next;
    });
    setReviewStatus('Review deleted.');
  };

  const canChangeOrder = (order: CustomerOrder) => ['pending_cod', 'processing'].includes(order.status || 'pending_cod');

  const startEditOrder = (order: CustomerOrder) => {
    setEditingOrderId(order.id);
    setOrderActionStatus('');
    setOrderDrafts(current => ({
      ...current,
      [order.id]: {
        fullName: order.shippingAddress?.fullName || '',
        phone: order.shippingAddress?.phone || '',
        email: order.shippingAddress?.email || '',
        city: order.shippingAddress?.city || '',
        area: order.shippingAddress?.area || '',
        address: order.shippingAddress?.address || '',
        landmark: order.shippingAddress?.landmark || '',
      },
    }));
  };

  const updateOrderDraft = (orderId: string, field: string, value: string) => {
    setOrderDrafts(current => ({ ...current, [orderId]: { ...(current[orderId] ?? {}), [field]: value } }));
  };

  const saveOrderDetails = async (order: CustomerOrder) => {
    if (!user) return;
    const draft = orderDrafts[order.id] ?? {};
    const required = ['fullName', 'phone', 'city', 'area', 'address'];
    if (required.some(field => !String(draft[field] || '').trim())) {
      setOrderActionStatus('Fill in name, phone, city, area, and address.');
      return;
    }
    setOrderActionStatus('Updating order details...');
    const response = await fetch('/api/customer?action=orders', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: user.id, orderId: order.id, intent: 'shipping', shippingAddress: draft }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setOrderActionStatus(data.error || 'Could not update order details.');
      return;
    }
    setOrders(current => current.map(item => item.id === order.id ? data.order : item));
    setEditingOrderId('');
    setOrderActionStatus('Order details updated.');
  };

  const cancelOrder = async (order: CustomerOrder) => {
    if (!user || !confirm('Cancel this order?')) return;
    setOrderActionStatus('Cancelling order...');
    const response = await fetch('/api/customer?action=orders', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: user.id, orderId: order.id, intent: 'cancel' }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setOrderActionStatus(data.error || 'Could not cancel order.');
      return;
    }
    setOrders(current => current.map(item => item.id === order.id ? data.order : item));
    setEditingOrderId('');
    setOrderActionStatus('Order cancelled.');
  };

  return (
    <div className="min-h-screen bg-[#f5f2ee] text-[#111]">
      <Navbar />
      <CartDrawer />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        {!user ? (
          <section className="border border-[#dedede] bg-white p-8 text-center shadow-sm">
            <h1 className="text-3xl font-semibold">Login to view your dashboard</h1>
            <button onClick={openLogin} className="mt-6 bg-[#111] px-6 py-3 text-sm font-semibold text-white">Login / Register</button>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="h-fit border border-[#e2ddd6] bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <div className="flex flex-col items-center text-center">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative h-32 w-32 overflow-hidden rounded-full bg-[#111] text-white ring-4 ring-[#f1ede7]" aria-label="Upload profile image">
                  {form.photo ? (
                    <img src={form.photo} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-4xl font-semibold">{initials(displayName)}</span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/65 py-2 text-xs font-semibold opacity-100 transition group-hover:bg-black/75">
                    <Camera size={14} /> Upload
                  </span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#8f1f35]">Customer profile</p>
                <h1 className="mt-2 text-3xl font-semibold">{displayName}</h1>
                <p className="mt-2 text-sm text-[#666]">{form.email || form.phone || 'Add contact info'}</p>
                {uploadStatus && <p className="mt-3 text-sm text-[#666]">{uploadStatus}</p>}
              </div>

              <div className="mt-6 border-t border-[#eee8e1] pt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Profile completion</span>
                  <span>{completion}%</span>
                </div>
                <div className="mt-2 h-2 bg-[#f1ede7]">
                  <div className="h-full bg-[#111]" style={{ width: `${completion}%` }} />
                </div>
              </div>
            </aside>

            <section className="space-y-6">
              <form onSubmit={submit} className="border border-[#e2ddd6] bg-white p-5 shadow-sm sm:p-6">
                <div className={`flex flex-col gap-3 ${isAccountOpen ? 'border-b border-[#eee8e1] pb-5' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setIsAccountOpen(current => !current)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                    aria-expanded={isAccountOpen}
                  >
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#8f1f35]">Account settings</span>
                      <span className="mt-1 block text-2xl font-semibold">Contact and shipping details</span>
                      <span className="mt-1 block text-sm text-[#666]">{completion}% complete / {form.city || 'No city set'}{form.area ? `, ${form.area}` : ''}</span>
                    </span>
                    <ChevronDown size={20} className={`shrink-0 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isAccountOpen && (
                  <>
                    <div className="mt-6 grid gap-5 lg:grid-cols-2">
                      <section className="grid gap-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold"><UserRound size={18} /> Contact info</h3>
                        <label className="grid gap-2 text-sm font-medium">
                          Full name
                          <input value={form.name} onChange={event => setField('name', event.target.value)} className="h-12 border border-[#dedede] bg-[#fbfaf8] px-4 text-sm outline-none focus:border-[#111]" />
                        </label>
                        <label className="grid gap-2 text-sm font-medium">
                          Email
                          <span className="relative block">
                            <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#777]" />
                            <input value={form.email} onChange={event => setField('email', event.target.value)} className="h-12 w-full border border-[#dedede] bg-[#fbfaf8] pl-11 pr-4 text-sm outline-none focus:border-[#111]" />
                          </span>
                        </label>
                        <label className="grid gap-2 text-sm font-medium">
                          Phone
                          <span className="relative block">
                            <Phone size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#777]" />
                            <input value={form.phone} onChange={event => setField('phone', event.target.value)} className="h-12 w-full border border-[#dedede] bg-[#fbfaf8] pl-11 pr-4 text-sm outline-none focus:border-[#111]" />
                          </span>
                        </label>
                    </section>

                      <section className="grid gap-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold"><MapPin size={18} /> Shipping address</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="grid gap-2 text-sm font-medium">
                            City
                            <input value={form.city} onChange={event => setField('city', event.target.value)} className="h-12 border border-[#dedede] bg-[#fbfaf8] px-4 text-sm outline-none focus:border-[#111]" />
                          </label>
                          <label className="grid gap-2 text-sm font-medium">
                            Area
                            <input value={form.area} onChange={event => setField('area', event.target.value)} className="h-12 border border-[#dedede] bg-[#fbfaf8] px-4 text-sm outline-none focus:border-[#111]" />
                          </label>
                        </div>
                        <label className="grid gap-2 text-sm font-medium">
                          Full delivery address
                          <textarea value={form.address} onChange={event => setField('address', event.target.value)} className="min-h-28 border border-[#dedede] bg-[#fbfaf8] px-4 py-3 text-sm outline-none focus:border-[#111]" />
                        </label>
                        <label className="grid gap-2 text-sm font-medium">
                          Landmark
                          <input value={form.landmark} onChange={event => setField('landmark', event.target.value)} className="h-12 border border-[#dedede] bg-[#fbfaf8] px-4 text-sm outline-none focus:border-[#111]" />
                        </label>
                      </section>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#eee8e1] pt-5">
                      <button className="bg-[#111] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8f1f35]">Save changes</button>
                      {authStatus && <p className="text-sm text-[#666]">{authStatus}</p>}
                    </div>
                  </>
                )}
              </form>

              <div className="border border-[#e2ddd6] bg-white p-5 shadow-sm sm:p-6">
                <div className={`flex flex-col gap-3 ${isCartOpen ? 'border-b border-[#eee8e1] pb-5' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(current => !current)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                    aria-expanded={isCartOpen}
                  >
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#8f1f35]">Cart</span>
                      <span className="mt-1 block text-2xl font-semibold">Cart management</span>
                      <span className="mt-1 block text-sm text-[#666]">{items.length ? `${items.length} item${items.length === 1 ? '' : 's'} / Rs. ${totalPrice.toFixed(2)}` : 'No items in cart'}</span>
                    </span>
                    <ChevronDown size={20} className={`shrink-0 transition-transform ${isCartOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isCartOpen && (
                  <>
                    {items.length === 0 ? (
                      <p className="mt-5 border border-dashed border-[#dedede] p-6 text-sm text-[#666]">No items in cart.</p>
                    ) : (
                      <div className="mt-5 space-y-3">
                        {items.map(item => (
                          <div key={`${item.id}-${item.selectedSize ?? 'default'}`} className="grid gap-4 border border-[#eee8e1] p-3 sm:grid-cols-[72px_1fr_auto] sm:items-center">
                            <img src={item.image} alt="" className="h-[72px] w-[72px] object-cover" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{item.name}</p>
                              <p className="mt-1 text-sm text-[#666]">Rs. {item.price.toFixed(2)} {item.selectedSize ? `/ Size ${item.selectedSize}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize)} className="grid h-9 w-9 place-items-center border border-[#dedede]" aria-label="Decrease quantity"><Minus size={15} /></button>
                              <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize)} className="grid h-9 w-9 place-items-center border border-[#dedede]" aria-label="Increase quantity"><Plus size={15} /></button>
                              <button onClick={() => removeFromCart(item.id, item.selectedSize)} className="grid h-9 w-9 place-items-center border border-[#dedede] text-[#8f1f35]" aria-label="Remove item"><Trash2 size={15} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 border-t border-[#eee8e1] pt-4">
                      <p className="text-sm">Subtotal Rs. {totalPrice.toFixed(2)}</p>
                      <p className="text-sm">Delivery Rs. 120.00</p>
                      <p className="mt-2 font-semibold">Total Rs. {(totalPrice + 120).toFixed(2)}</p>
                      <button onClick={() => void checkout()} className="mt-4 inline-flex items-center gap-2 bg-[#111] px-5 py-3 text-sm font-semibold text-white"><ShoppingBag size={16} /> Checkout COD</button>
                      {checkoutStatus && <p className="mt-3 text-sm text-[#666]">{checkoutStatus}</p>}
                    </div>
                  </>
                )}
              </div>

              <div id="orders" className="border border-[#e2ddd6] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 border-b border-[#eee8e1] pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f1f35]">Orders</p>
                    <h2 className="text-2xl font-semibold">Order status and details</h2>
                    <p className="text-sm text-[#666]">Track what you ordered, edit delivery details before shipment, or cancel eligible orders.</p>
                  </div>
                  <button type="button" onClick={() => void loadOrdersAndReviews()} className="inline-flex items-center gap-2 border border-[#dedede] px-4 py-2 text-sm font-semibold hover:border-[#111]">
                    <RefreshCcw size={15} /> Refresh status
                  </button>
                </div>

                {ordersStatus && <p className="mt-4 text-sm text-[#666]">{ordersStatus}</p>}
                {orderActionStatus && <p className="mt-4 text-sm text-[#666]">{orderActionStatus}</p>}
                {reviewStatus && <p className="mt-4 text-sm text-[#666]">{reviewStatus}</p>}

                <div className="mt-5 grid gap-4">
                  {orders.length === 0 && !ordersStatus && <p className="border border-dashed border-[#dedede] p-6 text-sm text-[#666]">No orders yet.</p>}
                  {orders.map(order => (
                    <article key={order.id} className="border border-[#eee8e1]">
                      <div className="flex flex-col gap-3 bg-[#fbfaf8] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{order.id}</p>
                          <p className="mt-1 text-sm text-[#666]">{formatDate(order.createdAt)} / {money(order.total)}</p>
                          {order.updatedAt && <p className="mt-1 text-xs text-[#777]">Last updated {formatDate(order.updatedAt)}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex w-fit items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white ${order.status === 'cancelled' || order.status === 'returned' ? 'bg-[#8f1f35]' : order.status === 'delivered' ? 'bg-[#166534]' : 'bg-[#111]'}`}>
                            <PackageCheck size={14} /> {statusLabels[order.status || ''] || order.status || 'Pending'}
                          </span>
                          {canChangeOrder(order) && (
                            <>
                              <button type="button" onClick={() => startEditOrder(order)} className="border border-[#dedede] bg-white px-3 py-1.5 text-xs font-semibold hover:border-[#111]">Change details</button>
                              <button type="button" onClick={() => void cancelOrder(order)} className="inline-flex items-center gap-1 border border-[#8f1f35] bg-white px-3 py-1.5 text-xs font-semibold text-[#8f1f35] hover:bg-[#8f1f35] hover:text-white"><XCircle size={13} /> Cancel</button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-4 p-4">
                        <div className="grid gap-4 border border-[#eee8e1] bg-[#fbfaf8] p-4 lg:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f1f35]">Delivery details</p>
                            {editingOrderId === order.id ? (
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {[
                                  ['fullName', 'Full name'],
                                  ['phone', 'Phone'],
                                  ['email', 'Email'],
                                  ['city', 'City'],
                                  ['area', 'Area'],
                                  ['landmark', 'Landmark'],
                                ].map(([field, label]) => (
                                  <input
                                    key={field}
                                    value={orderDrafts[order.id]?.[field] ?? ''}
                                    onChange={event => updateOrderDraft(order.id, field, event.target.value)}
                                    placeholder={label}
                                    className="h-11 border border-[#dedede] bg-white px-3 text-sm outline-none focus:border-[#111]"
                                  />
                                ))}
                                <textarea
                                  value={orderDrafts[order.id]?.address ?? ''}
                                  onChange={event => updateOrderDraft(order.id, 'address', event.target.value)}
                                  placeholder="Full delivery address"
                                  className="min-h-20 border border-[#dedede] bg-white px-3 py-2 text-sm outline-none focus:border-[#111] sm:col-span-2"
                                />
                                <div className="flex flex-wrap gap-2 sm:col-span-2">
                                  <button type="button" onClick={() => void saveOrderDetails(order)} className="bg-[#111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f1f35]">Save details</button>
                                  <button type="button" onClick={() => setEditingOrderId('')} className="border border-[#dedede] px-4 py-2 text-sm font-semibold hover:border-[#111]">Close</button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3 text-sm leading-6 text-[#555]">
                                <p className="font-semibold text-[#111]">{order.shippingAddress?.fullName || customerNameFallback(order)}</p>
                                <p>{order.shippingAddress?.phone || '-'}</p>
                                <p>{order.shippingAddress?.address || '-'}</p>
                                <p>{[order.shippingAddress?.area, order.shippingAddress?.city, order.shippingAddress?.landmark].filter(Boolean).join(', ') || '-'}</p>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f1f35]">Order total</p>
                            <div className="mt-3 space-y-2 text-sm">
                              <div className="flex justify-between gap-4"><span className="text-[#666]">Subtotal</span><span>{money(order.subtotal)}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-[#666]">Discount</span><span>- {money(order.discount)}</span></div>
                              <div className="flex justify-between gap-4"><span className="text-[#666]">{order.deliveryLabel || 'Delivery'}</span><span>{money(order.deliveryFee)}</span></div>
                              <div className="border-t border-[#eee8e1] pt-2 font-semibold"><div className="flex justify-between gap-4"><span>Total</span><span>{money(order.total)}</span></div></div>
                            </div>
                          </div>
                        </div>
                        {(order.items ?? []).map(item => {
                          const key = String(item.id || '');
                          const existingReview = reviewsByProduct[key];
                          const draft = reviewDrafts[key] ?? { rating: Number(existingReview?.rating || 5), text: String(existingReview?.text || '') };
                          return (
                            <div key={key} className="grid gap-4 border border-[#eee8e1] p-3 lg:grid-cols-[72px_1fr_320px]">
                              {item.image ? <img src={item.image} alt="" className="h-[72px] w-[72px] object-cover" /> : <span className="h-[72px] w-[72px] bg-[#eee9e2]" />}
                              <div className="min-w-0">
                                <p className="font-semibold">{item.name || 'Product'}</p>
                                <p className="mt-1 text-sm text-[#666]">{item.category || '-'}{item.selectedSize ? ` / Size ${item.selectedSize}` : ''}</p>
                                <p className="mt-1 text-sm text-[#666]">Qty {item.quantity || 0} / {money(item.price)}</p>
                              </div>
                              <div className="grid gap-2">
                                {existingReview && (
                                  <div className="border border-[#eee8e1] bg-[#fbfaf8] p-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8f1f35]">Your review</p>
                                    <p className="mt-2 text-sm leading-6 text-[#555]">{existingReview.text}</p>
                                    <p className="mt-2 text-xs text-[#777]">Last updated {formatDate(existingReview.updatedAt || existingReview.createdAt)}</p>
                                  </div>
                                )}
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map(value => (
                                    <button key={value} type="button" onClick={() => updateReviewDraft(key, { rating: value })} aria-label={`${value} star review`}>
                                      <Star size={17} className={value <= draft.rating ? 'fill-[#ffb000] text-[#ffb000]' : 'text-[#d1d5db]'} />
                                    </button>
                                  ))}
                                </div>
                                <textarea value={draft.text} onChange={event => updateReviewDraft(key, { text: event.target.value })} placeholder="Write your review..." className="min-h-20 border border-[#dedede] bg-[#fbfaf8] px-3 py-2 text-sm outline-none focus:border-[#111]" />
                                <div className="flex flex-wrap gap-2">
                                  <button type="button" onClick={() => void submitReview(order, item)} className="bg-[#111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f1f35]">{existingReview ? 'Update review' : 'Save review'}</button>
                                  {existingReview && <button type="button" onClick={() => void deleteReview(item)} className="border border-[#8f1f35] px-4 py-2 text-sm font-semibold text-[#8f1f35] hover:bg-[#8f1f35] hover:text-white">Delete</button>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
