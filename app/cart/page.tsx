import type { Metadata } from 'next';
import Cart from '@/views/Cart';

export const metadata: Metadata = {
  title: 'Cart | Saud Leather',
  description: 'Review your selected products and proceed to checkout.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartPage() {
  return <Cart />;
}
