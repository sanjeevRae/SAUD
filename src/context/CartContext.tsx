'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '@/data/products';
import { useCustomerAuth } from '@/context/CustomerAuthContext';

type CartItem = Product & {
  quantity: number;
  selectedSize?: string;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (value: boolean) => void;
  addToCart: (product: Product, quantity?: number, selectedSize?: string) => void;
  removeFromCart: (productId: string, selectedSize?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
  clearCart: () => void;
  checkout: (details?: { deliveryFee?: number; deliveryLabel?: string; shippingAddress?: Record<string, string>; voucherCode?: string }) => Promise<void>;
  checkoutStatus: string;
  trackActivity: (type: string, data?: Record<string, unknown>) => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const cartKey = (userId: string) => `chitratech-cart-${userId}`;

function compactItems(items: CartItem[]) {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    category: item.category,
    quantity: item.quantity,
    selectedSize: item.selectedSize,
    linkHref: item.linkHref || `/product/${item.id}`,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, openLogin } = useCustomerAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState('');

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const trackActivity = useCallback((type: string, data: Record<string, unknown> = {}) => {
    if (!user) return;
    void fetch('/api/customer?action=activity', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user, type, data, path: window.location.pathname + window.location.search }),
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    try {
      const saved = window.localStorage.getItem(cartKey(user.id));
      setItems(saved ? JSON.parse(saved) as CartItem[] : []);
    } catch {
      setItems([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    window.localStorage.setItem(cartKey(user.id), JSON.stringify(items));
    void fetch('/api/customer?action=cart', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user, items: compactItems(items), totalItems, totalPrice }),
    });
  }, [items, totalItems, totalPrice, user]);

  const addToCart = useCallback((product: Product, quantity = 1, selectedSize?: string) => {
    if (!user) {
      openLogin();
      return;
    }

    setItems(current => {
      const existingIndex = current.findIndex(item => item.id === product.id && item.selectedSize === selectedSize);
      if (existingIndex >= 0) {
        const next = [...current];
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + quantity };
        return next;
      }
      return [...current, { ...product, quantity, selectedSize }];
    });
    trackActivity('add_to_cart', { productId: product.id, name: product.name, quantity, selectedSize });

  }, [openLogin, trackActivity, user]);

  const removeFromCart = useCallback((productId: string, selectedSize?: string) => {
    setItems(current => current.filter(item => !(item.id === productId && item.selectedSize === selectedSize)));
    trackActivity('remove_from_cart', { productId, selectedSize });
  }, [trackActivity]);

  const updateQuantity = useCallback((productId: string, quantity: number, selectedSize?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }
    setItems(current => current.map(item => item.id === productId && item.selectedSize === selectedSize ? { ...item, quantity } : item));
    trackActivity('update_cart_quantity', { productId, quantity, selectedSize });
  }, [removeFromCart, trackActivity]);

  const clearCart = useCallback(() => setItems([]), []);

  const checkout = useCallback(async (details: { deliveryFee?: number; deliveryLabel?: string; shippingAddress?: Record<string, string>; voucherCode?: string } = {}) => {
    if (!user) {
      openLogin();
      return;
    }
    if (!items.length) return;
    setCheckoutStatus('Placing Cash on Delivery order...');
    const response = await fetch('/api/customer?action=checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user, items: compactItems(items), subtotal: totalPrice, ...details }),
    });
    const data = await response.json();
    if (!response.ok) {
      setCheckoutStatus(data.error || 'Checkout failed.');
      return;
    }
    trackActivity('checkout_cod', { orderId: data.order?.id, total: data.order?.total });
    setItems([]);
    setCheckoutStatus(`Order placed. Cash on Delivery total: Rs${Number(data.order?.total ?? 0).toFixed(2)}`);
  }, [items, openLogin, totalPrice, trackActivity, user]);

  const value = useMemo(() => ({
    items,
    totalItems,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkout,
    checkoutStatus,
    trackActivity,
  }), [addToCart, checkout, checkoutStatus, clearCart, isCartOpen, items, removeFromCart, totalItems, totalPrice, trackActivity, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}


