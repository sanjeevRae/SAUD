'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Menu, Search, ShoppingCart, UserRound, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useCustomerAuth } from '@/context/CustomerAuthContext';
import type { Product } from '@/data/products';
import type { NoticeBanner } from '@/lib/storefront';

type NavbarProps = {
  notices?: NoticeBanner[];
};

const latestMenu = [
  { label: 'New This Week', href: '/main-product?sort=newest&title=New%20This%20Week' },
  { label: 'New This Month', href: '/main-product?sort=newest&title=New%20This%20Month' },
  { label: 'Trending New Products', href: '/main-product?sort=trending&title=Trending%20New%20Products' },
];

const categoryMenus: Record<string, { label: string; href: string }[]> = {
  Best: [
    { label: 'Top Selling Men', href: '/main-product?gender=men&sort=top-selling&title=Top%20Selling%20Men' },
    { label: 'Top Selling Women', href: '/main-product?gender=women&sort=top-selling&title=Top%20Selling%20Women' },
    { label: 'Top Selling Kids', href: '/main-product?gender=kids&sort=top-selling&title=Top%20Selling%20Kids' },
    { label: 'Most Loved Products', href: '/main-product?sort=loved&title=Most%20Loved%20Products' },
  ],
  Men: [
    'T-Shirts',
    'Shirts',
    'Polo Shirts',
    'Jeans',
    'Pants & Trousers',
    'Shorts',
    'Hoodies & Sweatshirts',
    'Jackets',
    'Coats',
    'Blazers',
    'Suits',
  ].map(label => ({ label, href: `/main-product?gender=men&q=${encodeURIComponent(label)}&title=${encodeURIComponent(`Men ${label}`)}` })),
  Women: [
    'Tops',
    'T-Shirts',
    'Shirts & Blouses',
    'Dresses',
    'Skirts',
    'Jeans',
    'Pants & Trousers',
    'Leggings',
    'Hoodies & Sweatshirts',
    'Jackets',
  ].map(label => ({ label, href: `/main-product?gender=women&q=${encodeURIComponent(label)}&title=${encodeURIComponent(`Women ${label}`)}` })),
};

const categoryMenuKeys = ['Best', 'Men', 'Women'] as const;

export default function Navbar({ notices = [] }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [activeCategoryMenu, setActiveCategoryMenu] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [countdown, setCountdown] = useState('22h37m54s');
  const [fallbackCountdownTarget] = useState(() => Date.now() + (22 * 60 * 60 + 37 * 60 + 54) * 1000);
  const { totalItems, trackActivity } = useCart();
  const { user, openLogin, logout } = useCustomerAuth();
  const isAdmin = user?.role === 'admin';
  const accountRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const now = Date.now();
  const activeNotice = notices.find(notice => {
    if (notice.enabled === false) return false;
    const startsAt = notice.startsAt ? Date.parse(notice.startsAt) : 0;
    const endsAt = notice.endsAt ? Date.parse(notice.endsAt) : Number.POSITIVE_INFINITY;
    return now >= startsAt && now <= endsAt;
  }) ?? notices.find(notice => notice.enabled !== false);
  const countdownTarget = activeNotice?.countdownTo ? Date.parse(activeNotice.countdownTo) : fallbackCountdownTarget;
  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Profile';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '?';

  const renderProfileAvatar = (className = 'h-8 w-8') => user?.photo ? (
    <img src={user.photo} alt={displayName} className={`${className} rounded-full object-cover ring-1 ring-[#e5e5e5]`} />
  ) : (
    <span className={`${className} inline-flex items-center justify-center rounded-full bg-[#f3f3f3] text-[11px] font-semibold text-[#111111] ring-1 ring-[#e5e5e5]`}>
      {user ? initials : '?'}
    </span>
  );
  const openProductsMenu = (href: string, label: string) => {
    setIsShopOpen(false);
    setActiveCategoryMenu(null);
    setIsMobileMenuOpen(false);
    trackActivity('navbar_menu_click', { label, href });
    router.push(href);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
      setIsShopOpen(false);
      setActiveCategoryMenu(null);
      setIsAccountOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isAccountOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setIsAccountOpen(false);
    };
    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isAccountOpen]);

  useEffect(() => {
    const saleEndsAt = Number.isFinite(countdownTarget) ? countdownTarget : Date.now();

    const updateCountdown = () => {
      const timeLeft = Math.max(0, saleEndsAt - Date.now());
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      setCountdown(`${hours}h${String(minutes).padStart(2, '0')}m${String(seconds).padStart(2, '0')}s`);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [countdownTarget]);

  useEffect(() => {
    if (!isSearchOpen) return;

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length > 0 && trimmedQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError('');
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError('');
      try {
        const params = new URLSearchParams({ limit: '6' });
        if (trimmedQuery) params.set('q', trimmedQuery);
        params.set('action', 'search');
        const response = await fetch(`/api/products?${params.toString()}`, { signal: controller.signal });
        const data = await response.json();
        setSearchResults(data.products ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchResults([]);
          setSearchError(error instanceof Error ? error.message : 'Search failed.');
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isSearchOpen, searchQuery]);
  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
  };

  const openSearch = () => {
    setIsMobileMenuOpen(false);
    setIsShopOpen(false);
    setActiveCategoryMenu(null);
    setIsAccountOpen(false);
    setIsSearchOpen(true);
  };

  const openSearchResults = (query = searchQuery) => {
    const value = query.trim();
    closeSearch();
    if (value) trackActivity('search', { query: value });
    router.push(value ? `/main-product?q=${encodeURIComponent(value)}` : '/main-product');
  };

  const openProduct = (product: Product) => {
    closeSearch();
    trackActivity('product_click', { productId: product.id, name: product.name, source: 'navbar_search' });
    router.push(product.linkHref || `/product/${product.id}`);
  };

  return (
    <>
      {isHome && (
        <div className={`bg-[#1d1d1d] py-2.5 text-center text-white transition-transform duration-300 ${isScrolled && !isMobileMenuOpen ? '-translate-y-full' : 'translate-y-0'}`}>
          <span className="text-sm tracking-[0.01em] sm:text-base">
{activeNotice?.quote ? <span className="mr-2 italic">&quot;{activeNotice.quote}&quot;</span> : null}
            {activeNotice?.message || 'Get 50% Off This Summer Sale. Grab It Fast!'} <strong className="ml-1 inline-block">{countdown}</strong>
          </span>
        </div>
      )}

      <header className={`relative z-[120] overflow-visible bg-white/95 backdrop-blur ${isHome ? '' : ''} border-b border-[#ececec]`}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between overflow-visible px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(current => !current)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e5e5]"
              aria-label="Open menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <Link href="/" className="font-serif text-2xl font-semibold text-[#111111]">
            SAUD Leather
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <div className="relative hidden md:block">
              <button
                onClick={() => {
                  setActiveCategoryMenu(null);
                  setIsShopOpen(current => !current);
                }}
                className="flex items-center gap-1 text-xs font-medium text-[#111111]"
              >
                Latest Collection <ChevronDown size={13} />
              </button>

              {isShopOpen && (
                <div className="absolute left-0 top-full z-[130] mt-3 w-56 rounded-xl border border-[#dedede] bg-white py-2 shadow-lg">
                  {latestMenu.map(item => (
                    <button
                      key={item.label}
                      onClick={() => openProductsMenu(item.href, item.label)}
                      className="block w-full px-4 py-2 text-left text-xs text-[#111111] hover:bg-[#f5f5f5]"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {categoryMenuKeys.map(item => (
              <div key={item} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => {
                    setIsShopOpen(false);
                    setActiveCategoryMenu(current => (current === item ? null : item));
                  }}
                  className="flex items-center gap-1 text-xs font-medium text-[#111111]"
                >
                  {item} <ChevronDown size={13} />
                </button>
                {activeCategoryMenu === item && (
                  <div className="absolute left-0 top-full z-[130] mt-3 w-[420px] rounded-xl border border-[#dedede] bg-white p-4 shadow-lg">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {categoryMenus[item].map(menuItem => (
                        <button
                          key={menuItem.label}
                          onClick={() => openProductsMenu(menuItem.href, menuItem.label)}
                          className="text-left text-sm text-[#111111] transition-colors hover:text-[#8f1f35]"
                        >
                          {menuItem.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={openSearch}
              className="hidden items-center gap-2 p-1 text-xs font-medium text-[#111111] md:inline-flex"
            >
              <Search size={15} strokeWidth={1.8} />
              Search
            </button>
            <button
              onClick={() => router.push('/cart')}
              className="hidden items-center gap-2 p-1 text-xs font-medium text-[#111111] md:flex"
              aria-label="Cart"
            >
              <ShoppingCart size={16} strokeWidth={1.8} />
              <span>({totalItems})</span>
            </button>
            {user ? (
              <div ref={accountRef} className="relative hidden md:block">
                <button
                  onClick={() => {
                    setIsShopOpen(false);
                    setActiveCategoryMenu(null);
                    setIsAccountOpen(current => !current);
                  }}
                  className="flex items-center gap-2 p-1 text-xs font-medium text-[#111111]"
                  aria-expanded={isAccountOpen}
                  aria-haspopup="menu"
                >
                  {renderProfileAvatar('h-8 w-8')}
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown size={13} />
                </button>
                {isAccountOpen && (
                  <div className="absolute right-0 top-full z-[140] mt-3 w-56 border border-[#dedede] bg-white p-2 shadow-lg" role="menu">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setIsAccountOpen(false);
                          router.push(`/admin?userId=${encodeURIComponent(user.id)}`);
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-[#f5f5f5]"
                        role="menuitem"
                      >
                        <UserRound size={16} /> Admin dashboard
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setIsAccountOpen(false);
                        router.push('/profile');
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-[#f5f5f5]"
                      role="menuitem"
                    >
                      <UserRound size={16} /> View profile
                    </button>
                    <button
                      onClick={() => {
                        setIsAccountOpen(false);
                        logout();
                        router.push('/');
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-[#8f1f35] hover:bg-[#fff7f7]"
                      role="menuitem"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={openLogin} className="hidden items-center gap-2 p-1 text-xs font-medium text-[#111111] md:flex">
                {renderProfileAvatar('h-8 w-8')}
                Login / Register
              </button>
            )}
            <button onClick={() => user ? setIsAccountOpen(current => !current) : openLogin()} className="md:hidden" aria-label="Profile">
              {renderProfileAvatar('h-8 w-8')}
            </button>
            <button onClick={openSearch} className="md:hidden" aria-label="Search">
              <Search size={18} />
            </button>
            <button onClick={() => router.push('/cart')} className="relative md:hidden" aria-label="Cart">
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#111111] px-1 text-[10px] text-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </nav>

        {user && isAccountOpen && (
          <div className="absolute right-4 top-full z-[140] mt-2 w-56 border border-[#dedede] bg-white p-2 shadow-lg md:hidden" role="menu" onMouseDown={event => event.stopPropagation()}>
            {isAdmin && (
              <button
                onClick={() => {
                  setIsAccountOpen(false);
                  router.push(`/admin?userId=${encodeURIComponent(user.id)}`);
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-[#f5f5f5]"
                role="menuitem"
              >
                <UserRound size={16} /> Admin dashboard
              </button>
            )}
            <button
              onClick={() => {
                setIsAccountOpen(false);
                router.push('/profile');
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-[#f5f5f5]"
              role="menuitem"
            >
              <UserRound size={16} /> View profile
            </button>
            <button
              onClick={() => {
                setIsAccountOpen(false);
                logout();
                router.push('/');
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-[#8f1f35] hover:bg-[#fff7f7]"
              role="menuitem"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}

        {isMobileMenuOpen && (
          <div className="border-t border-[#ececec] bg-white px-4 py-4 md:hidden">
            <div className="grid gap-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f1f35]">Latest Collection</p>
                <div className="grid gap-2">
                  {latestMenu.map(item => (
                    <button key={item.label} onClick={() => openProductsMenu(item.href, item.label)} className="text-left text-sm text-[#111111]">{item.label}</button>
                  ))}
                </div>
              </div>
              {categoryMenuKeys.map(item => (
                <div key={item}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8f1f35]">{item}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryMenus[item].map(menuItem => (
                      <button key={menuItem.label} onClick={() => openProductsMenu(menuItem.href, menuItem.label)} className="text-left text-sm text-[#111111]">
                        {menuItem.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {isSearchOpen && (
        <div className="fixed inset-0 z-[300] bg-black/40 p-0 backdrop-blur-[2px]" onClick={closeSearch}>
          <div
            className="mx-auto mt-16 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
            onClick={event => event.stopPropagation()}
          >
            <form className="flex items-center gap-3 border-b border-[#ececec] px-4 py-4 sm:px-5" onSubmit={event => { event.preventDefault(); openSearchResults(); }}>
              <Search size={18} className="text-[#777777]" strokeWidth={1.7} />
              <input
                autoFocus
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search products, categories, styles..."
                className="h-10 flex-1 border-0 bg-transparent text-sm text-[#111111] outline-none placeholder:text-[#999999]"
              />
              <button
                type="button"
                onClick={closeSearch}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f5f5f5] text-[#111111]"
                aria-label="Close search"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </form>

            <div className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#777777]">
                  {searchQuery.trim() ? 'Search results' : 'Popular picks'}
                </p>
                <span className="text-xs text-[#999999]">{isSearching ? 'Searching...' : `${searchResults.length} items`}</span>
              </div>

              <div className="space-y-2">
                {searchError && <p className="rounded-2xl bg-[#fff7ed] px-4 py-3 text-xs text-[#9a3412]">{searchError}</p>}
                {searchResults.length > 0 ? (
                  searchResults.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => openProduct(product)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[#f8f8f8]"
                    >
                      <img src={product.image} alt={product.name} className="h-14 w-14 rounded-2xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-body text-sm font-semibold text-[#111111]">{product.name}</p>
                        <p className="mt-1 truncate font-body text-xs text-[#777777]">{product.category} / {product.description}</p>
                      </div>
                      <span className="font-body text-sm font-semibold text-[#111111]">Rs{Number(product.price).toFixed(2)}</span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#fafafa] px-4 py-8 text-center">
                    <p className="font-body text-sm font-medium text-[#111111]">No products found</p>
                    <p className="mt-1 font-body text-xs text-[#777777]">Try a different keyword, category, size, color, or style.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}















