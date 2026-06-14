'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCart } from '@/context/CartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

const deliveryOptions = [
  { id: 'pickup', label: 'Collection point pickup', detail: 'Pick up from a nearby partner point.', fee: 0, eta: '2-4 working days' },
  { id: 'standard', label: 'Standard delivery', detail: 'Doorstep delivery for regular orders.', fee: 90, eta: '3-5 working days' },
  { id: 'priority', label: 'Priority delivery', detail: 'Faster doorstep handling where available.', fee: 150, eta: '1-2 working days' },
];

export default function Cart() {
  const { user, openLogin } = useCustomerAuth();
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, checkout, checkoutStatus } = useCart();
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [voucherCode, setVoucherCode] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(deliveryOptions[1].id);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    city: user?.city || '',
    area: user?.area || '',
    address: user?.address || '',
    landmark: user?.landmark || '',
  });
  const [formError, setFormError] = useState('');


  useEffect(() => {
    setShippingAddress(current => ({
      ...current,
      fullName: current.fullName || user?.name || '',
      phone: current.phone || user?.phone || '',
      email: current.email || user?.email || '',
      city: current.city || user?.city || '',
      area: current.area || user?.area || '',
      address: current.address || user?.address || '',
      landmark: current.landmark || user?.landmark || '',
    }));
  }, [user]);
  const delivery = deliveryOptions.find(option => option.id === selectedDelivery) ?? deliveryOptions[1];
  const discount = useMemo(() => voucherCode.trim().toUpperCase() === 'CHITRA10' ? Math.round(totalPrice * 0.1) : 0, [totalPrice, voucherCode]);
  const total = Math.max(0, totalPrice - discount + delivery.fee);

  const updateAddress = (field: keyof typeof shippingAddress, value: string) => {
    setShippingAddress(current => ({ ...current, [field]: value }));
  };

  const proceedToCheckout = () => {
    if (!user) {
      openLogin();
      return;
    }
    if (!items.length) return;
    setStep('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const placeOrder = async () => {
    setFormError('');
    const requiredFields: Array<keyof typeof shippingAddress> = ['fullName', 'phone', 'city', 'area', 'address'];
    const missing = requiredFields.some(field => !shippingAddress[field].trim());
    if (missing) {
      setFormError('Fill in name, phone, city, area, and address.');
      return;
    }

    await checkout({
      deliveryFee: delivery.fee,
      deliveryLabel: delivery.label,
      shippingAddress,
      voucherCode: voucherCode.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#111111]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#666]">Shopping cart</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{step === 'cart' ? 'Review your cart' : 'Checkout'}</h1>
          </div>
          <Link href="/main-product" className="text-sm font-semibold underline underline-offset-4">Continue shopping</Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-xl font-semibold">Your cart is empty</h2>
            <p className="mt-2 text-sm text-[#666]">Add products before checkout.</p>
            <Link href="/main-product" className="mt-6 inline-flex rounded-full bg-[#111] px-6 py-3 text-sm font-semibold text-white">Shop products</Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
            <section className="space-y-4">
              {step === 'checkout' && (
                <div className="bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center justify-between gap-4 border-b border-[#ededed] pb-4">
                    <h2 className="text-lg font-semibold">Shipping Address</h2>
                    <button onClick={() => setStep('cart')} className="text-sm font-semibold underline underline-offset-4">Edit cart</button>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <input value={shippingAddress.fullName} onChange={event => updateAddress('fullName', event.target.value)} placeholder="Full name" className="h-12 border border-[#dedede] px-4 text-sm outline-none focus:border-[#111]" />
                    <input value={shippingAddress.phone} onChange={event => updateAddress('phone', event.target.value)} placeholder="Phone number" className="h-12 border border-[#dedede] px-4 text-sm outline-none focus:border-[#111]" />
                    <input value={shippingAddress.email} onChange={event => updateAddress('email', event.target.value)} placeholder="Email address" className="h-12 border border-[#dedede] px-4 text-sm outline-none focus:border-[#111]" />
                    <input value={shippingAddress.city} onChange={event => updateAddress('city', event.target.value)} placeholder="City" className="h-12 border border-[#dedede] px-4 text-sm outline-none focus:border-[#111]" />
                    <input value={shippingAddress.area} onChange={event => updateAddress('area', event.target.value)} placeholder="Area / locality" className="h-12 border border-[#dedede] px-4 text-sm outline-none focus:border-[#111]" />
                    <input value={shippingAddress.landmark} onChange={event => updateAddress('landmark', event.target.value)} placeholder="Landmark optional" className="h-12 border border-[#dedede] px-4 text-sm outline-none focus:border-[#111]" />
                    <textarea value={shippingAddress.address} onChange={event => updateAddress('address', event.target.value)} placeholder="Full delivery address" className="min-h-24 border border-[#dedede] px-4 py-3 text-sm outline-none focus:border-[#111] sm:col-span-2" />
                  </div>
                </div>
              )}

              {step === 'checkout' && (
                <div className="bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-semibold">Delivery Method</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {deliveryOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedDelivery(option.id)}
                        className={`min-h-36 border p-4 text-left transition ${selectedDelivery === option.id ? 'border-[#111] bg-[#fafafa]' : 'border-[#dedede] bg-white hover:border-[#999]'}`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold">{option.label}</span>
                          <span className="text-sm font-semibold">{option.fee ? `Rs. ${option.fee}` : 'Free'}</span>
                        </span>
                        <span className="mt-3 block text-xs leading-5 text-[#666]">{option.detail}</span>
                        <span className="mt-3 block text-xs font-semibold text-[#111]">{option.eta}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#ededed] px-5 py-4 sm:px-6">
                  <p className="text-sm font-semibold">Items ({totalItems})</p>
                  <p className="text-sm text-[#666]">Cash on Delivery available</p>
                </div>

                {items.map(item => (
                  <div key={`${item.id}-${item.selectedSize ?? 'default'}`} className="grid gap-4 border-b border-[#ededed] px-5 py-5 last:border-b-0 sm:grid-cols-[120px_1fr_auto] sm:px-6">
                    <img src={item.image} alt={item.name} className="h-28 w-28 bg-[#f3f3f3] object-cover" />
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold leading-6 sm:text-lg">{item.name}</h2>
                      <p className="mt-1 text-sm text-[#666]">{item.category}{item.selectedSize ? ` / Size ${item.selectedSize}` : ''}</p>
                      <p className="mt-3 text-lg font-semibold">Rs. {Number(item.price).toFixed(2)}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize)} className="grid h-9 w-9 place-items-center border border-[#dedede] hover:border-[#111]" aria-label="Decrease quantity"><Minus size={15} /></button>
                        <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize)} className="grid h-9 w-9 place-items-center border border-[#dedede] hover:border-[#111]" aria-label="Increase quantity"><Plus size={15} /></button>
                        <button onClick={() => removeFromCart(item.id, item.selectedSize)} className="ml-2 grid h-9 w-9 place-items-center border border-[#dedede] text-[#666] hover:border-[#111] hover:text-[#111]" aria-label="Remove item"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#777]">Line total</p>
                      <p className="mt-2 text-lg font-semibold">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="h-fit bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
              <h2 className="text-xl font-semibold">Order Summary</h2>

              <div className="mt-5 flex gap-2">
                <input value={voucherCode} onChange={event => setVoucherCode(event.target.value)} placeholder="Enter voucher code" className="h-12 min-w-0 flex-1 border border-[#dedede] px-4 text-sm outline-none focus:border-[#111]" />
                <button className="h-12 bg-[#111] px-5 text-sm font-semibold text-white">Apply</button>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between gap-4"><span className="text-[#666]">Subtotal ({totalItems} items)</span><span>Rs. {totalPrice.toFixed(2)}</span></div>
                <div className="flex justify-between gap-4"><span className="text-[#666]">Voucher discount</span><span>{discount ? `- Rs. ${discount.toFixed(2)}` : 'Rs. 0.00'}</span></div>
                <div className="flex justify-between gap-4"><span className="text-[#666]">Delivery fee</span><span>{delivery.fee ? `Rs. ${delivery.fee.toFixed(2)}` : 'Free'}</span></div>
                <div className="border-t border-[#ededed] pt-4">
                  <div className="flex justify-between gap-4 text-lg font-semibold"><span>Total</span><span>Rs. {total.toFixed(2)}</span></div>
                  <p className="mt-1 text-right text-xs text-[#777]">All available charges shown before order placement.</p>
                </div>
              </div>

              {step === 'cart' ? (
                <button onClick={proceedToCheckout} className="mt-7 h-12 w-full bg-[#111] text-sm font-semibold uppercase tracking-[0.04em] text-white">Proceed to checkout ({totalItems})</button>
              ) : (
                <button onClick={() => void placeOrder()} className="mt-7 h-12 w-full bg-[#111] text-sm font-semibold uppercase tracking-[0.04em] text-white">Place COD order</button>
              )}

              {formError && <p className="mt-3 text-sm font-semibold text-[#8f1f35]">{formError}</p>}
              {checkoutStatus && <p className="mt-3 text-sm text-[#666]">{checkoutStatus}</p>}

              <div className="mt-5 space-y-3 border-t border-[#ededed] pt-5 text-sm text-[#666]">
                <p className="flex gap-2"><ShieldCheck size={17} className="mt-0.5 text-[#111]" /> Secure checkout with Cash on Delivery.</p>
                <p className="flex gap-2"><MapPin size={17} className="mt-0.5 text-[#111]" /> Delivery details are confirmed before order placement.</p>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

