'use client';

import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, totalPrice, updateQuantity, removeFromCart, checkout, checkoutStatus } = useCart();

  if (!isCartOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/35" onClick={() => setIsCartOpen(false)}>
      <aside
        className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#ececec] px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} />
            <h2 className="font-body text-lg font-semibold">Your cart</h2>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="rounded-full bg-[#f5f5f5] p-2" aria-label="Close cart">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {items.length === 0 ? (
            <div className="rounded-2xl bg-[#fafafa] p-6 text-center">
              <p className="font-body text-sm text-[#666666]">Your cart is empty.</p>
            </div>
          ) : (
            items.map(item => (
              <div key={`${item.id}-${item.selectedSize ?? 'default'}`} className="flex gap-3 rounded-2xl border border-[#ececec] p-3">
                <img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-body text-sm font-semibold text-[#111111]">{item.name}</h3>
                      <p className="mt-1 font-body text-xs text-[#777777]">Rs{item.price}</p>
                      {item.selectedSize ? (
                        <p className="mt-1 font-body text-xs text-[#777777]">Size: {item.selectedSize}</p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id, item.selectedSize)}
                      className="font-body text-xs text-[#777777]"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] px-2 py-1">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize)} aria-label="Decrease quantity">
                      <Minus size={14} />
                    </button>
                    <span className="font-body min-w-6 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize)} aria-label="Increase quantity">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[#ececec] px-5 py-4">
          <div className="mb-3 flex items-center justify-between font-body text-sm">
            <span>Subtotal</span>
            <strong>Rs{totalPrice.toFixed(2)}</strong>
          </div>
          <div className="mb-3 flex items-center justify-between font-body text-sm">
            <span>Delivery</span>
            <strong>Rs120.00</strong>
          </div>
          <div className="mb-4 flex items-center justify-between font-body text-sm font-semibold">
            <span>Total COD</span>
            <strong>Rs{(totalPrice + 120).toFixed(2)}</strong>
          </div>
          <button onClick={() => void checkout()} className="font-body w-full rounded-full bg-[#111111] px-4 py-3 text-sm font-semibold text-white">
            Cash on Delivery
          </button>
          {checkoutStatus && <p className="mt-3 text-xs text-[#666]">{checkoutStatus}</p>}
        </div>      </aside>
    </div>
  );
}




