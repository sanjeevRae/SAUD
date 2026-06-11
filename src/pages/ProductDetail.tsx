'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgePercent, ChevronDown, Clock, Package, Search, ShoppingCart, Star, Truck } from 'lucide-react';
import { products, type Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';

const shippingItems = [
  { label: 'Discount', value: 'Disc 50%', icon: BadgePercent },
  { label: 'Package', value: 'Regular Package', icon: Package },
  { label: 'Delivery Time', value: '3-4 Working Days', icon: Clock },
  { label: 'Estimation Arrive', value: '10 - 12 October 2024', icon: Truck },
];

const sizes = ['S', 'M', 'L', 'XL'];
const ratingBreakdown = [
  { stars: 5, count: 80 },
  { stars: 4, count: 12 },
  { stars: 3, count: 7 },
  { stars: 2, count: 3 },
  { stars: 1, count: 1 },
];

type ProductDetailProps = {
  product?: Product;
  productId?: string;
  relatedProducts?: Product[];
};

export default function ProductDetail({ product: productProp, productId, relatedProducts: relatedProductsProp }: ProductDetailProps) {
  const router = useRouter();
  const { addToCart, totalItems, setIsCartOpen, trackActivity } = useCart();
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const product = useMemo(
    () => productProp ?? products.find(item => item.id === productId) ?? products[0],
    [productId, productProp],
  );

  const relatedProducts = useMemo(
    () => relatedProductsProp ?? products.filter(item => item.id !== product.id).slice(0, 4),
    [product.id, relatedProductsProp],
  );

  const images = useMemo(() => {
    const baseImages = [product.image, ...(product.images ?? [])].filter(Boolean);
    return [...Array(5)].map((_, index) => baseImages[index] || baseImages[index % baseImages.length]);
  }, [product]);

  const searchResults = useMemo(
    () =>
      products
        .filter(item =>
          [item.name, item.category, item.description]
            .join(' ')
            .toLowerCase()
            .includes(searchQuery.trim().toLowerCase()),
        )
        .slice(0, 6),
    [searchQuery],
  );

  const categoryGroups = [
    {
      title: 'Men Category',
      items: ['T-Shirts', 'Shirts', 'Hoodies & Sweatshirts', 'Jackets', 'Coats', 'Blazers', 'Suits', 'Jeans', 'Pants & Trousers', 'Shorts', 'Activewear', 'Innerwear', 'Sleepwear', 'Footwear', 'Accessories'],
    },
    {
      title: 'Women Category',
      items: ['Tops', 'T-Shirts', 'Shirts & Blouses', 'Dresses', 'Skirts', 'Jeans', 'Pants & Trousers', 'Leggings', 'Hoodies & Sweatshirts', 'Jackets', 'Coats', 'Ethnic Wear', 'Activewear', 'Lingerie', 'Sleepwear', 'Footwear', 'Accessories'],
    },
  ];

  useEffect(() => {
    trackActivity('product_view', { productId: product.id, name: product.name, category: product.category });
  }, [product.category, product.id, product.name, trackActivity]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (categoryMenuRef.current && !categoryMenuRef.current.contains(target)) {
        setIsCategoryMenuOpen(false);
      }

      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <CartDrawer />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 sm:mb-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            
            <button onClick={() => router.push('/')} className="font-body text-lg font-semibold text-[#111111] sm:text-2xl">
              ChitraTech Shop
            </button>
            <div className="font-body flex items-center gap-4 text-xs sm:gap-7 sm:text-sm">
              <div ref={searchBoxRef} className="relative">
                <button
                  aria-label="Search"
                  onClick={() => setIsSearchOpen(current => !current)}
                  className="icon-button"
                >
                  <Search size={16} />
                </button>
                {isSearchOpen && (
                  <div className="absolute right-0 top-9 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-[#e7e7e7] bg-white p-3 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                    <div className="flex items-center gap-3 rounded-xl border border-[#e5e5e5] bg-[#fafafa] px-3 py-2.5">
                      <Search size={16} className="text-[#777777]" />
                      <input
                        value={searchQuery}
                        onChange={event => setSearchQuery(event.target.value)}
                        placeholder="Search products..."
                        className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-[#9a9a9a]"
                      />
                    </div>

                    <div className="mt-3 max-h-72 overflow-y-auto">
                      {searchQuery.trim().length === 0 ? (
                        <p className="font-body px-2 py-4 text-sm text-[#777777]">Start typing to search products.</p>
                      ) : searchResults.length === 0 ? (
                        <p className="font-body px-2 py-4 text-sm text-[#777777]">No matching products found.</p>
                      ) : (
                        <div className="space-y-2">
                          {searchResults.map(item => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery('');
                                trackActivity('product_click', { productId: item.id, name: item.name, source: 'product_search' });
                                router.push(item.linkHref || `/product/${item.id}`);
                              }}
                              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[#f6f6f6]"
                            >
                              <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                              <span className="min-w-0">
                                <span className="font-body block truncate text-sm font-semibold text-[#111111]">{item.name}</span>
                                <span className="font-body block text-xs text-[#777777]">{item.category} â€¢ Rs{item.price}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setIsCartOpen(true)} className="icon-button relative">
                <ShoppingCart size={16} />
                {totalItems > 0 && <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-[#111111] px-1 text-[10px] text-white">{totalItems}</span>}
              </button>
            </div>
          </div>

          <div className="font-body flex flex-wrap items-center gap-2 text-xs text-[#777777] sm:text-sm">
            <Link href="/" className="hover:text-[#111111]">Home</Link>
            <span>/</span>
            <Link href="/main-product" className="hover:text-[#111111]">Products</Link>
            <span>/</span>
            <span className="text-[#111111]">{product.name}</span>
          </div>
        </header>

        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="flex items-start gap-3 sm:gap-5">
            <div className="flex w-[64px] shrink-0 flex-col gap-3 overflow-y-auto sm:w-[88px] lg:w-[104px]">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => setSelectedImage(index)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[#f4f4f4] transition-colors outline-none focus:outline-none focus-visible:outline-none sm:h-24 sm:w-24 sm:rounded-xl sm:border-4 lg:h-28 lg:w-[104px] ${selectedImage === index ? 'border-[#111111]' : 'border-[#e1e1e1]'}`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden rounded-[32px] bg-[#f4f4f4]">
              <img src={images[selectedImage]} alt={product.name} className="h-full w-full object-cover" />
            </div>
          </div>

          <div>
            <div ref={categoryMenuRef} className="relative inline-flex">
              <button
                onClick={() => setIsCategoryMenuOpen(current => !current)}
                className="font-body inline-flex items-center gap-2 rounded-full border border-[#dfdfdf] px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#8f1f35] transition-colors hover:border-[#8f1f35]/40"
              >
                Categories
                <ChevronDown size={14} className={`transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryMenuOpen && (
                <div className="absolute left-0 top-[calc(100%+0.75rem)] z-20 w-[min(42rem,calc(100vw-2rem))] rounded-3xl border border-[#ececec] bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.12)] sm:p-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {categoryGroups.map(group => (
                      <div key={group.title}>
                        <h3 className="font-body mb-3 text-sm font-semibold uppercase tracking-[0.8em] text-[#111111]">
                          {group.title}
                        </h3>
                        <ul className="space-y-2">
                          {group.items.map(item => (
                            <li key={item}>
                              <button className="font-body text-sm text-[#666666] transition-colors hover:text-[#111111]">
                                {item}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <h1 className="font-body mt-3 text-2xl font-semibold sm:text-3xl">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <div className="flex gap-1 text-[#ffb000]">
                {[...Array(5)].map((_, index) => (
                  <Star key={index} size={15} className="fill-current" />
                ))}
              </div>
              <span className="font-body text-xs text-[#777777] sm:text-sm">{product.rating}/5 rating</span>
            </div>
            <p className="font-body mt-4 text-base font-semibold sm:text-lg">Rs{product.price}</p>
            <p className="font-body mt-4 text-xs leading-6 text-[#666666] sm:text-sm sm:leading-7">{product.description}</p>

            <div className="mt-7">
              <p className="font-body mb-3 text-xs font-semibold sm:text-sm">Select size</p>
              <div className="flex flex-wrap gap-2.5">
                {sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`font-body rounded-full border px-3.5 py-2 text-xs sm:px-4 sm:text-sm ${selectedSize === size ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#d9d9d9] text-[#111111]'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="font-body inline-flex items-center gap-3 rounded-full border border-[#e2e2e2] px-3.5 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm">
                <button onClick={() => setQuantity(current => Math.max(1, current - 1))}>-</button>
                <span className="font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(current => current + 1)}>+</button>
              </div>
              <button
                onClick={() => addToCart(product, quantity, selectedSize)}
                className="font-body rounded-full bg-[#111111] px-5 py-2.5 text-xs font-semibold text-white sm:px-6 sm:py-3 sm:text-sm"
              >
                Add to cart
              </button>
            </div>

            <div className="mt-8 space-y-3">
              <article className="rounded-xl border border-[#e6e6e6] p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-body font-medium">Description & Fit</h3>
                  <ChevronDown size={16} />
                </div>
                <p className="font-body text-sm leading-relaxed text-[#777777]">
                  {product.description} Loose but refined silhouette, soft inner feel, and versatile styling for casual or elevated days.
                </p>
              </article>

              <article className="rounded-xl border border-[#e6e6e6] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-body font-medium">Shipping</h3>
                  <ChevronDown size={16} />
                </div>
                <div className="font-body grid gap-4 text-xs sm:grid-cols-2">
                  {shippingItems.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-[#111111]">
                        <Icon size={14} strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[#777777]">{label}</span>
                        <strong className="break-words">{value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-14">
          <h2 className="mb-6 font-body text-lg font-semibold text-[#111111]">Rating & Reviews</h2>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-start">
            <div className="grid gap-6 sm:grid-cols-[170px_1fr] sm:items-center">
              <div>
                <div className="font-body text-7xl font-semibold leading-none tracking-tight text-[#111111] sm:text-8xl">
                  {product.rating.toFixed(1).replace('.', ',')}
                  <span className="ml-2 align-baseline text-lg font-normal text-[#9a9a9a]">/ 5</span>
                </div>
                <p className="font-body mt-3 text-xs text-[#8a8a8a]">({product.reviewCount ?? 50} New Reviews)</p>
              </div>
              <div className="space-y-2.5">
                {ratingBreakdown.map(item => (
                  <div key={item.stars} className="grid grid-cols-[34px_1fr_22px] items-center gap-2">
                    <span className="font-body flex items-center gap-1 text-xs font-semibold text-[#111111]">
                      {item.stars}
                      <Star size={11} className="fill-[#ffb000] text-[#ffb000]" />
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-[#f0f0f0]">
                      <span className="block h-full rounded-full bg-[#111111]" style={{ width: `${Math.max(8, item.count)}%` }} />
                    </span>
                    <span className="font-body text-xs text-[#111111]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <article className="rounded-2xl border border-[#eeeeee] p-5 shadow-[0_14px_45px_rgba(0,0,0,0.04)]">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <strong className="font-body block text-sm">Alex Mathio</strong>
                  <div className="mt-2 flex gap-1 text-[#ffb000]">
                    {[...Array(5)].map((_, index) => <Star key={index} size={15} className="fill-current" />)}
                  </div>
                </div>
                <span className="font-body text-[11px] text-[#777777]">13 Oct 2024</span>
              </div>
              <p className="font-body mb-4 text-xs leading-relaxed text-[#777777]">
                ChitraTech Shop&apos;s dedication to sustainability and ethical practices resonates strongly with today&apos;s consumers.
              </p>
              <img src="/testimonial_02.jpg" alt="Alex Mathio" className="!h-12 !w-12 rounded-full object-cover object-center" />
            </article>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <h2 className="mb-8 text-center font-body text-2xl font-normal sm:mb-10 sm:text-4xl">You might also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {relatedProducts.map(item => (
              <button key={item.id} onClick={() => { trackActivity('product_click', { productId: item.id, name: item.name, source: 'related_products' }); router.push(item.linkHref || `/product/${item.id}`); }} className="font-body text-left">
                <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-[#eeeeee]">
                  <img src={item.image} alt={item.name} className="!h-full !w-full max-w-none object-cover object-center" />
                </div>
                <h3 className="font-body mb-1 text-xs font-semibold leading-snug sm:text-sm">{item.name}</h3>
                <p className="font-body text-xs sm:text-sm">Rs{item.price}</p>
              </button>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


