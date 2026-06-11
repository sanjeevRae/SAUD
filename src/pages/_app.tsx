import type { AppProps } from 'next/app';
import { CustomerAuthProvider } from '@/context/CustomerAuthContext';
import { CartProvider } from '@/context/CartContext';
import LoginModal from '@/components/LoginModal';
import '@/index.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CustomerAuthProvider>
      <CartProvider>
        <Component {...pageProps} />
        <LoginModal />
      </CartProvider>
    </CustomerAuthProvider>
  );
}
