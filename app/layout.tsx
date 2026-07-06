import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://saud-leather.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Saud Leather | Premium Leather Goods and Fashion Essentials',
    template: '%s | Saud Leather',
  },
  description: 'Shop Saud Leather for premium leather goods, curated fashion essentials, bags, apparel, and everyday accessories.',
  applicationName: 'Saud Leather',
  keywords: ['Saud Leather', 'leather goods', 'fashion essentials', 'bags', 'apparel', 'Nepal fashion'],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Saud Leather | Premium Leather Goods and Fashion Essentials',
    description: 'Shop Saud Leather for premium leather goods, curated fashion essentials, bags, apparel, and everyday accessories.',
    url: '/',
    siteName: 'Saud Leather',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        alt: 'Saud Leather logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saud Leather | Premium Leather Goods and Fashion Essentials',
    description: 'Shop Saud Leather for premium leather goods, curated fashion essentials, bags, apparel, and everyday accessories.',
    images: ['/logo.png'],
  },
  verification: {
    google: 'QDjIc0JmoAKdkmGRguwIJf7lzqBj7GLiUGkHa2kSfkY',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
