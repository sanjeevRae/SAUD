'use client';

import { FormEvent, useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/context/CartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

export default function ProfileDashboard() {
  const { user, openLogin, updateProfile, logout, authStatus } = useCustomerAuth();
  const { items, totalPrice, updateQuantity, removeFromCart, checkout, checkoutStatus } = useCart();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', photo: '' });

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '', photo: user.photo || '' });
  }, [user]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void updateProfile(form);
  };

  return (
    <div className="min-h-screen bg-white text-[#111]">
      <Navbar />
      <CartDrawer />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        {!user ? (
          <section className="border border-[#dedede] p-8 text-center"><h1 className="text-3xl font-semibold">Login to view your dashboard</h1><button onClick={openLogin} className="mt-6 bg-[#111] px-6 py-3 text-sm font-semibold text-white">Login / Register</button></section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="border border-[#dedede] p-6">
              <div className="flex items-center gap-4"><img src={form.photo || '/testimonial_01.jpg'} alt="" className="h-20 w-20 rounded-full object-cover" /><div><p className="text-xs uppercase tracking-[0.18em] text-[#8f1f35]">Profile</p><h1 className="text-3xl font-semibold">{user.name}</h1></div></div>
              <form onSubmit={submit} className="mt-6 grid gap-4">
                {(['name','email','phone','address','photo'] as const).map(key => <label key={key} className="grid gap-2 text-sm font-medium capitalize">{key}<input value={form[key]} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} className="border border-[#dedede] px-4 py-3 text-sm outline-none" /></label>)}
                <button className="bg-[#111] px-5 py-3 text-sm font-semibold text-white">Save profile</button>
                {authStatus && <p className="text-sm text-[#666]">{authStatus}</p>}
              </form>
              <button onClick={logout} className="mt-4 text-sm underline">Logout</button>
            </section>

            <section className="space-y-6">
              <div className="border border-[#dedede] p-6"><h2 className="text-2xl font-semibold">Cart management</h2>{items.length === 0 ? <p className="mt-3 text-sm text-[#666]">No items in cart.</p> : <div className="mt-4 space-y-3">{items.map(item => <div key={`${item.id}-${item.selectedSize ?? 'default'}`} className="flex items-center gap-3 border p-3"><img src={item.image} alt="" className="h-16 w-16 object-cover" /><div className="flex-1"><p className="font-semibold">{item.name}</p><p className="text-sm text-[#666]">Rs{item.price} {item.selectedSize ? `/ ${item.selectedSize}` : ''}</p></div><button onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize)} className="border px-3 py-1">-</button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize)} className="border px-3 py-1">+</button><button onClick={() => removeFromCart(item.id, item.selectedSize)} className="text-sm text-[#8f1f35]">Remove</button></div>)}</div>}<div className="mt-5 border-t pt-4"><p className="text-sm">Subtotal Rs{totalPrice.toFixed(2)}</p><p className="text-sm">Delivery Rs120.00</p><p className="mt-2 font-semibold">Total Rs{(totalPrice + 120).toFixed(2)}</p><button onClick={() => void checkout()} className="mt-4 bg-[#111] px-5 py-3 text-sm font-semibold text-white">Checkout COD</button>{checkoutStatus && <p className="mt-3 text-sm text-[#666]">{checkoutStatus}</p>}</div></div>
              <div className="border border-[#dedede] p-6"><h2 className="text-2xl font-semibold">History</h2><p className="mt-2 text-sm text-[#666]">Searches, product clicks, cart updates, and checkouts are saved in Firestore under your customer activity.</p></div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
