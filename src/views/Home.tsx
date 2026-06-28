'use client';

import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import Hero from '@/sections/Hero';
import FeaturedProducts from '@/sections/FeaturedProducts';
import Collection from '@/sections/Collection';
import Products from '@/sections/Products';
import Categories from '@/sections/Categories';
import WhyChooseUs from '@/sections/WhyChooseUs';
import Testimonials from '@/sections/Testimonials';
import type { HomepageConfig } from '@/lib/storefront';

type HomeProps = {
  homepage?: HomepageConfig;
};

export default function Home({ homepage }: HomeProps) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar notices={homepage?.noticeBanners} />
      <CartDrawer />
      <main>
        <Hero banners={homepage?.heroBanners} />
        <FeaturedProducts products={homepage?.featuredProducts} />
        <Collection collections={homepage?.collections} />
        <Products products={homepage?.latestProducts} />
        <Categories categories={homepage?.categories} />
        <WhyChooseUs />
        <Testimonials testimonials={homepage?.testimonials} />
      </main>
      <Footer />
    </div>
  );
}
