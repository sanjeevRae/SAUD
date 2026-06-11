'use client';

import type { ReactNode } from 'react';
import { CustomerAuthProvider } from '@/context/CustomerAuthContext';
import { CartProvider } from '@/context/CartContext';
import LoginModal from '@/components/LoginModal';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        {children}
        <LoginModal />
      </CartProvider>
    </CustomerAuthProvider>
  );
}
