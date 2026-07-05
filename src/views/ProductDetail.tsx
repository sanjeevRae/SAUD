'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarClock, ChevronDown, Clock, Package, Star, Truck } from 'lucide-react';
import { products, type Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

const fallbackSizes = ['S', 'M', 'L', 'XL'];

type ProductDetailProps = {
  product?: Product;
  productId?: string;
  relatedProducts?: Product[];
};

type ProductReview = {
  id: string;
  userName?: string;
  userPhoto?: string;
  rating?: number;
  text?: string;
  createdAt?: string;
};

function formatReviewDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function reviewInitials(name?: string) {
  return String(name || 'Customer')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?';
}

function addBusinessDays(value: Date, days: number) {
  const date = new Date(value);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date;
}

function formatDeliveryDate(value: Date) {
  return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProductDetail({ product: productProp, productId, relatedProducts: relatedProductsProp }: ProductDetailProps) {
  const router = useRouter();
  const { addToCart, trackActivity } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewStatus, setReviewStatus] = useState('Loading reviews...');
  const [loadedProduct, setLoadedProduct] = useState<Product | null>(productProp ?? null);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  const product = useMemo(
    () => loadedProduct ?? productProp ?? products.find(item => item.id === productId) ?? products[0],
    [loadedProduct, productId, productProp],
  );

  const relatedProducts = useMemo(
    () => relatedProductsProp ?? products.filter(item => item.id !== product.id).slice(0, 4),
    [product.id, relatedProductsProp],
  );
  const availableSizes = useMemo(() => (
    product.sizes?.length ? product.sizes : fallbackSizes
  ), [product.sizes]);

  const images = useMemo(() => {
    const baseImages = [product.image, ...(product.images ?? [])].filter(Boolean);
    return [...Array(5)].map((_, index) => baseImages[index] || baseImages[index % baseImages.length]);
  }, [product]);

  const reviewSummary = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map(stars => ({ stars, count: reviews.filter(review => Number(review.rating || 0) === stars).length }));
    const total = reviews.length;
    const average = total ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / total : 0;
    const maxCount = Math.max(...counts.map(item => item.count), 1);
    return { counts, total, average, maxCount };
  }, [reviews]);

  const shippingItems = useMemo(() => {
    const earliest = addBusinessDays(currentDate, 3);
    const latest = addBusinessDays(currentDate, 4);
    return [
      { label: 'Current Date & Time', value: currentDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }), icon: CalendarClock },
      { label: 'Package', value: 'Regular Package', icon: Package },
      { label: 'Delivery Time', value: '3-4 Working Days', icon: Clock },
      { label: 'Estimated Arrival', value: `${formatDeliveryDate(earliest)} - ${formatDeliveryDate(latest)}`, icon: Truck },
    ];
  }, [currentDate]);

  const categoryGroups = [
    {
      title: 'Men Category',
      gender: 'men',
      items: ['T-Shirts', 'Shirts', 'Hoodies & Sweatshirts', 'Jackets', 'Coats', 'Blazers', 'Suits', 'Jeans', 'Pants & Trousers', 'Shorts', 'Activewear', 'Innerwear', 'Sleepwear', 'Footwear', 'Accessories'],
    },
    {
      title: 'Women Category',
      gender: 'women',
      items: ['Tops', 'T-Shirts', 'Shirts & Blouses', 'Dresses', 'Skirts', 'Jeans', 'Pants & Trousers', 'Leggings', 'Hoodies & Sweatshirts', 'Jackets', 'Coats', 'Ethnic Wear', 'Activewear', 'Lingerie', 'Sleepwear', 'Footwear', 'Accessories'],
    },
  ];

  const openCategory = (gender: string, item: string) => {
    setIsCategoryMenuOpen(false);
    trackActivity('product_detail_category_click', { gender, category: item });
    router.push(`/main-product?gender=${encodeURIComponent(gender)}&q=${encodeURIComponent(item)}&title=${encodeURIComponent(`${gender === 'men' ? 'Men' : 'Women'} ${item}`)}`);
  };

  useEffect(() => {
    setLoadedProduct(productProp ?? null);
  }, [productProp]);

  useEffect(() => {
    if (productProp || !productId) return;

    let cancelled = false;
    const loadProduct = async () => {
      const response = await fetch(`/api/products?action=detail&productId=${encodeURIComponent(productId)}`);
      const data = await response.json().catch(() => ({}));
      if (!cancelled && response.ok && data.product) setLoadedProduct(data.product);
    };

    void loadProduct();
    return () => {
      cancelled = true;
    };
  }, [productId, productProp]);

  useEffect(() => {
    trackActivity('product_view', { productId: product.id, name: product.name, category: product.category });
  }, [product.category, product.id, product.name, trackActivity]);

  useEffect(() => {
    setSelectedSize(current => availableSizes.includes(current) ? current : availableSizes[0] || '');
  }, [availableSizes]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDate(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadReviews = async () => {
      setReviewStatus('Loading reviews...');
      const response = await fetch(`/api/products?action=reviews&productId=${encodeURIComponent(product.id)}`);
      const data = await response.json().catch(() => ({}));
      setReviews(data.reviews ?? []);
      setReviewStatus(response.ok ? '' : data.error || 'Could not load reviews.');
    };
    void loadReviews();
  }, [product.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (categoryMenuRef.current && !categoryMenuRef.current.contains(target)) {
        setIsCategoryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <header className="mb-6 sm:mb-7">
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
                              <button onClick={() => openCategory(group.gender, item)} className="font-body text-sm text-[#666666] transition-colors hover:text-[#111111]">
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
                  <Star key={index} size={15} className={reviewSummary.total && index < Math.round(reviewSummary.average) ? 'fill-current' : ''} />
                ))}
              </div>
              <span className="font-body text-xs text-[#777777] sm:text-sm">{reviewSummary.total ? `${reviewSummary.average.toFixed(1)}/5 rating` : 'No reviews yet'}</span>
            </div>
            <p className="font-body mt-4 text-base font-semibold sm:text-lg">Rs{product.price}</p>
            <p className="font-body mt-4 text-xs leading-6 text-[#666666] sm:text-sm sm:leading-7">{product.description}</p>

            <div className="mt-7">
              <p className="font-body mb-3 text-xs font-semibold sm:text-sm">Select size</p>
              <div className="flex flex-wrap gap-2.5">
                {availableSizes.map(size => (
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
                  {reviewSummary.total ? reviewSummary.average.toFixed(1).replace('.', ',') : '0,0'}
                  <span className="ml-2 align-baseline text-lg font-normal text-[#9a9a9a]">/ 5</span>
                </div>
                <p className="font-body mt-3 text-xs text-[#8a8a8a]">({reviewSummary.total} Reviews)</p>
              </div>
              <div className="space-y-2.5">
                {reviewSummary.counts.map(item => (
                  <div key={item.stars} className="grid grid-cols-[34px_1fr_22px] items-center gap-2">
                    <span className="font-body flex items-center gap-1 text-xs font-semibold text-[#111111]">
                      {item.stars}
                      <Star size={11} className="fill-[#ffb000] text-[#ffb000]" />
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-[#f0f0f0]">
                      <span className="block h-full rounded-full bg-[#111111]" style={{ width: `${item.count ? Math.max(8, (item.count / reviewSummary.maxCount) * 100) : 0}%` }} />
                    </span>
                    <span className="font-body text-xs text-[#111111]">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {reviewStatus && <p className="rounded-2xl border border-[#eeeeee] p-5 text-sm text-[#777777]">{reviewStatus}</p>}
              {!reviewStatus && reviews.length === 0 && <p className="rounded-2xl border border-[#eeeeee] p-5 text-sm text-[#777777]">No reviews yet.</p>}
              {reviews.map(review => (
                <article key={review.id} className="rounded-2xl border border-[#eeeeee] p-5 shadow-[0_14px_45px_rgba(0,0,0,0.04)]">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <strong className="font-body block text-sm">{review.userName || 'Customer'}</strong>
                      <div className="mt-2 flex gap-1 text-[#ffb000]">
                        {[...Array(5)].map((_, index) => <Star key={index} size={15} className={index < Number(review.rating || 0) ? 'fill-current' : 'text-[#d1d5db]'} />)}
                      </div>
                    </div>
                    <span className="font-body text-[11px] text-[#777777]">{formatReviewDate(review.createdAt)}</span>
                  </div>
                  <p className="font-body mb-4 text-xs leading-relaxed text-[#777777]">{review.text}</p>
                  {review.userPhoto ? (
                    <img src={review.userPhoto} alt={review.userName || 'Customer'} className="!h-12 !w-12 rounded-full object-cover object-center" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#111] text-sm font-semibold text-white">{reviewInitials(review.userName)}</span>
                  )}
                </article>
              ))}
            </div>
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



