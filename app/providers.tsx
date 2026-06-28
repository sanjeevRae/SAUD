'use client';

import type { ReactNode } from 'react';
import { CustomerAuthProvider } from '@/context/CustomerAuthContext';
import { CartProvider } from '@/context/CartContext';
import LoginModal from '@/components/LoginModal';
import { Toaster } from '@/components/ui/sonner';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        {children}
        <LoginModal />
        <Toaster richColors position="top-right" closeButton />
      </CartProvider>
    </CustomerAuthProvider>
  );
}
