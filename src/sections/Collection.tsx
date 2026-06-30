'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, MoveUpRight } from 'lucide-react';
import { collections as fallbackCollections, type Collection as StoreCollection } from '@/data/products';

const getCollectionStrip = (collections: StoreCollection[]) => [
  ...collections,
  { id: '6', title: 'Evening Minimal', image: '/product_07.jpg', linkHref: '/main-product?collection=evening-minimal' },
  { id: '7', title: 'Soft Street', image: '/product_08.jpg', linkHref: '/main-product?collection=soft-street' },
];

type CollectionProps = {
  collections?: StoreCollection[];
};

export default function Collection({ collections = fallbackCollections }: CollectionProps) {
  const collectionStrip = getCollectionStrip(collections);
  const wrapIndex = (index: number) => ((index % collectionStrip.length) + collectionStrip.length) % collectionStrip.length;
  const [activeIndex, setActiveIndex] = useState(3);
  const active = collectionStrip[activeIndex] ?? collectionStrip[0];
  const navigate = (direction: 'prev' | 'next') => {
    setActiveIndex(previous => wrapIndex(direction === 'prev' ? previous - 1 : previous + 1));
  };

  const getOffset = (index: number) => {
    let offset = index - activeIndex;
    if (offset > collectionStrip.length / 2) offset -= collectionStrip.length;
    if (offset < -collectionStrip.length / 2) offset += collectionStrip.length;
    return offset;
  };

  const getTranslateX = (offset: number) => {
    if (offset === 0) return '-50%';
    const direction = offset > 0 ? '+' : '-';
    const slots = Array.from({ length: Math.abs(offset) }, () => `${direction} clamp(210px, 21vw, 285px)`).join(' ');
    return `calc(-50% ${slots})`;
  };

  const getMobileSlot = (offset: number) => {
    const slots: Record<number, { left: string; width: string; height: string; opacity: number; scale: number; zIndex: number; pointerEvents: 'auto' | 'none' }> = {
      [-2]: { left: '-10%', width: 'min(34vw, 132px)', height: '255px', opacity: 0, scale: 0.9, zIndex: 1, pointerEvents: 'none' },
      [-1]: { left: '12%', width: 'min(34vw, 132px)', height: '255px', opacity: 0.42, scale: 0.94, zIndex: 4, pointerEvents: 'auto' },
      [0]: { left: '50%', width: 'min(78vw, 310px)', height: '360px', opacity: 1, scale: 1, zIndex: 10, pointerEvents: 'none' },
      [1]: { left: '88%', width: 'min(34vw, 132px)', height: '255px', opacity: 0.42, scale: 0.94, zIndex: 4, pointerEvents: 'auto' },
      [2]: { left: '110%', width: 'min(34vw, 132px)', height: '255px', opacity: 0, scale: 0.9, zIndex: 1, pointerEvents: 'none' },
    };
    return slots[offset];
  };

  return (
    <section id="collection" className="overflow-hidden bg-white px-4 py-20 md:px-6 md:py-24 lg:px-10">
      <div className="mb-8 flex items-end justify-between gap-5 md:mb-16 md:items-start">
        <div>
          <p className="eyebrow mb-3 md:mb-5">Collection.</p>
          <h2 className="font-body max-w-[270px] text-3xl font-semibold leading-tight text-[#111111] md:max-w-none md:text-4xl">
            Saud Leather: The Collection
          </h2>
        </div>
        <Link href="/main-product" className="hidden items-center gap-3 border border-[#8f1f35] px-5 py-3 text-xs text-[#8f1f35] md:flex">
          Explore more <MoveUpRight size={15} />
        </Link>
      </div>

      <div className="relative mx-auto h-[390px] md:hidden">
        {collectionStrip.map((collection, index) => {
          const offset = getOffset(index);
          const activeCard = offset === 0;
          const slot = getMobileSlot(offset);
          if (!slot) return null;
          return (
            <button
              key={collection.id}
              onClick={() => offset !== 0 && setActiveIndex(wrapIndex(activeIndex + offset))}
              aria-current={activeCard}
              className="absolute top-1/2 overflow-hidden rounded-[22px] bg-[#eeeeee] outline-none transition-all duration-700"
              style={{
                left: slot.left,
                width: slot.width,
                height: slot.height,
                opacity: slot.opacity,
                zIndex: slot.zIndex,
                pointerEvents: slot.pointerEvents,
                transform: `translate(-50%, -50%) scale(${slot.scale})`,
                boxShadow: activeCard ? '0 24px 60px rgba(0,0,0,0.14)' : 'none',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <img src={collection.image} alt={collection.title} className="h-full w-full object-cover" />
              {activeCard && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-5 pb-5 pt-20 text-left text-white">
                  <span className="block text-lg font-semibold">{collection.title}</span>
                  <span className="mt-1 block text-xs text-white/80">Tap side cards to browse</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="relative mx-auto hidden h-[430px] max-w-7xl md:block md:h-[520px]">
        {collectionStrip.map((collection, index) => {
          const offset = getOffset(index);
          const distance = Math.abs(offset);
          const activeCard = offset === 0;
          if (!(offset >= -2 && offset <= 3)) return null;
          const width = activeCard ? 'min(330px, 62vw)' : distance === 1 ? 'clamp(185px, 18vw, 225px)' : 'clamp(165px, 16vw, 205px)';
          const height = activeCard ? '430px' : distance === 1 ? 'clamp(220px, 21vw, 260px)' : 'clamp(190px, 18vw, 230px)';
          return (
            <button
              key={collection.id}
              onClick={() => setActiveIndex(index)}
              className="absolute top-1/2 overflow-hidden bg-[#eeeeee] shadow-sm transition-all duration-700"
              style={{
                left: '50%',
                width,
                height,
                zIndex: 10 - distance,
                opacity: activeCard ? 1 : distance === 1 ? 0.9 : 0.48,
                transform: `translate(${getTranslateX(offset)}, -50%) scale(${activeCard ? 1 : distance === 1 ? 0.98 : 0.92})`,
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <img src={collection.image} alt={collection.title} className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex justify-center gap-2 md:hidden">
        {collectionStrip.map((collection, index) => (
          <button key={collection.id} onClick={() => setActiveIndex(index)} aria-label={`Show ${collection.title}`} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-7 bg-[#111111]' : 'w-1.5 bg-[#d6d6d6]'}`} />
        ))}
      </div>
      <div className="mt-6 text-center">
        <h3 className="mb-2 text-lg font-semibold text-[#111111]">{active.title} Collection</h3>
        <Link href={active.linkHref || `/main-product?collection=${encodeURIComponent(active.title)}`} className="border-b border-[#111111] text-lg leading-none text-[#111111]">See Detail</Link>
      </div>
      <div className="mt-8 flex justify-center gap-4 md:gap-6">
        <button onClick={() => navigate('prev')} aria-label="Previous collection" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dedede] transition-colors hover:bg-[#111111] hover:text-white"><ArrowLeft size={22} /></button>
        <button onClick={() => navigate('next')} aria-label="Next collection" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dedede] transition-colors hover:bg-[#111111] hover:text-white"><ArrowRight size={22} /></button>
      </div>
    </section>
  );
}

