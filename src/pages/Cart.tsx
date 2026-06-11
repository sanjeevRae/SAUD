'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/context/CartContext';

export default function Cart() {
  const { items, totalPrice, updateQuantity, removeFromCart, checkout, checkoutStatus } = useCart();

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <Navbar />
      <CartDrawer />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        <div className="mb-8">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-[#8f1f35]">Shopping cart</p>
          <h1 className="font-display mt-2 text-4xl font-semibold sm:text-5xl">Review your selections.</h1>
        </div>

        {items.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-[#d9d9d9] bg-[#fafafa] px-6 py-14 text-center">
            <h2 className="font-body text-lg font-semibold">Your cart is empty</h2>
            <p className="font-body mt-2 text-sm text-[#666666]">Add a few pieces you love and come back here to check out.</p>
            <Link href="/" className="font-body mt-6 inline-flex rounded-full bg-[#111111] px-6 py-3 text-sm font-semibold text-white">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              {items.map(item => (
                <div key={`${item.id}-${item.selectedSize ?? 'default'}`} className="flex flex-col gap-4 rounded-[28px] border border-[#ededed] p-4 sm:flex-row sm:items-center sm:p-5">
                  <img src={item.image} alt={item.name} className="h-28 w-28 rounded-[22px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-body text-lg font-semibold">{item.name}</h2>
                        <p className="font-body mt-1 text-sm text-[#666666]">Rs{item.price}</p>
                        {item.selectedSize ? <p className="font-body mt-1 text-xs text-[#888888]">Size: {item.selectedSize}</p> : null}
                      </div>
                      <button onClick={() => removeFromCart(item.id, item.selectedSize)} className="font-body text-sm text-[#777777] underline underline-offset-4">
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-4 rounded-full border border-[#e2e2e2] px-4 py-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize)} className="font-body text-sm">
                        âˆ’
                      </button>
                      <span className="font-body text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize)} className="font-body text-sm">
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-[32px] bg-[#f8f8f8] p-6 sm:p-8">
              <h2 className="font-body text-lg font-semibold">Order summary</h2>
              <div className="mt-6 space-y-4 font-body text-sm">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>Rs{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery</span>
                  <span>Rs120.00</span>
                </div>
                <div className="h-px bg-[#dfdfdf]" />
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total COD</span>
                  <span>Rs{(totalPrice + 120).toFixed(2)}</span>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-[#dedede] bg-white p-4 font-body text-sm">
                <p className="font-semibold">Payment method</p>
                <p className="mt-1 text-[#666]">Cash on Delivery. Delivery charge Rs120.</p>
              </div>
              <button onClick={() => void checkout()} className="font-body mt-8 w-full rounded-full bg-[#111111] px-5 py-3 text-sm font-semibold text-white">
                Place COD order
              </button>
              {checkoutStatus && <p className="mt-3 text-sm text-[#666]">{checkoutStatus}</p>}
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}




