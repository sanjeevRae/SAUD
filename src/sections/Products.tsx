'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, MoveUpRight } from 'lucide-react';
import { products as fallbackProducts, type Product } from '@/data/products';


const productSlots = [-3, -2, -1, 0, 1, 2, 3];

type ProductsProps = { products?: Product[] };

export default function Products({ products = fallbackProducts }: ProductsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  if (!products.length) return null;

  const wrapIndex = (index: number) => ((index % products.length) + products.length) % products.length;
  const safeActiveIndex = wrapIndex(activeIndex);
  const activeProduct = products[safeActiveIndex];

  const go = (direction: 'prev' | 'next') => setActiveIndex(previous => wrapIndex(direction === 'prev' ? previous - 1 : previous + 1));

  const getOffset = (index: number) => {
    let offset = index - safeActiveIndex;
    if (offset > products.length / 2) offset -= products.length;
    if (offset < -products.length / 2) offset += products.length;
    return offset;
  };

  const getSlotStyle = (offset: number) => {
    const slots: Record<number, { left: string; opacity: number; scale: number; zIndex: number; blur: number; pointerEvents: 'auto' | 'none' }> = {
      [-3]: { left: 'calc(50% - clamp(640px, 45vw, 820px))', opacity: 0.12, scale: 1, zIndex: 2, blur: 0.4, pointerEvents: 'auto' },
      [-2]: { left: 'calc(50% - clamp(455px, 32vw, 590px))', opacity: 0.36, scale: 1, zIndex: 3, blur: 0.1, pointerEvents: 'auto' },
      [-1]: { left: 'calc(50% - clamp(255px, 18vw, 335px))', opacity: 0.34, scale: 1, zIndex: 4, blur: 0, pointerEvents: 'auto' },
      [0]: { left: '52%', opacity: 1, scale: 1, zIndex: 20, blur: 0, pointerEvents: 'none' },
      [1]: { left: 'calc(50% + clamp(310px, 22vw, 420px))', opacity: 0.34, scale: 1, zIndex: 5, blur: 0, pointerEvents: 'auto' },
      [2]: { left: 'calc(50% + clamp(510px, 36vw, 660px))', opacity: 0.34, scale: 1, zIndex: 3, blur: 0.1, pointerEvents: 'auto' },
      [3]: { left: 'calc(50% + clamp(700px, 49vw, 860px))', opacity: 0.12, scale: 1, zIndex: 2, blur: 0.4, pointerEvents: 'auto' },
    };
    return slots[offset];
  };

  const getMobileSlotStyle = (offset: number) => {
    const slots: Record<number, { left: string; width: string; height: string; opacity: number; scale: number; zIndex: number; pointerEvents: 'auto' | 'none' }> = {
      [-2]: { left: '-10%', width: 'min(34vw, 132px)', height: '245px', opacity: 0, scale: 0.9, zIndex: 1, pointerEvents: 'none' },
      [-1]: { left: '12%', width: 'min(34vw, 132px)', height: '245px', opacity: 0.42, scale: 0.94, zIndex: 4, pointerEvents: 'auto' },
      [0]: { left: '50%', width: 'min(72vw, 285px)', height: '330px', opacity: 1, scale: 1, zIndex: 10, pointerEvents: 'none' },
      [1]: { left: '88%', width: 'min(34vw, 132px)', height: '245px', opacity: 0.42, scale: 0.94, zIndex: 4, pointerEvents: 'auto' },
      [2]: { left: '110%', width: 'min(34vw, 132px)', height: '245px', opacity: 0, scale: 0.9, zIndex: 1, pointerEvents: 'none' },
    };
    return slots[offset];
  };

  return (
    <section id="products" className="overflow-hidden bg-white px-4 py-16 text-center md:px-6 md:py-20 lg:px-10 lg:py-14">
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8f1f35]">Products</p>
      <h2 className="font-body mx-auto mb-5 max-w-[280px] text-xl font-extrabold leading-tight text-[#111111] md:max-w-none md:text-2xl lg:text-[22px]">
        Saud Leather: Our Latest Pieces
      </h2>
      <button className="mb-7 inline-flex items-center gap-2 border border-[#b98390] px-4 py-2 text-[10px] font-medium text-[#8f1f35] transition-colors hover:border-[#8f1f35] hover:bg-[#8f1f35] hover:text-white md:mb-9">
        See More Products <MoveUpRight size={13} />
      </button>

      <div className="relative mx-auto h-[360px] w-full max-w-[430px] lg:hidden">
        {products.map((product, index) => {
          const offset = getOffset(index);
          const activeCard = offset === 0;
          const slot = getMobileSlotStyle(offset);
          if (!(offset >= -2 && offset <= 2) || !slot) return null;
          return (
            <button
              key={product.id}
              onClick={() => offset !== 0 && setActiveIndex(wrapIndex(safeActiveIndex + offset))}
              aria-current={activeCard}
              className="absolute top-1/2 m-0 overflow-hidden rounded-none border-0 bg-[#f2f2f2] p-0 leading-none outline-none transition-all duration-700 focus:outline-none focus-visible:outline-none"
              style={{
                left: slot.left,
                width: slot.width,
                height: slot.height,
                zIndex: slot.zIndex,
                opacity: slot.opacity,
                pointerEvents: slot.pointerEvents,
                transform: `translate(-50%, -50%) scale(${slot.scale})`,
                boxShadow: activeCard ? '0 24px 60px rgba(0,0,0,0.12)' : 'none',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <Image
                src={product.image}
                alt={product.name}
                width={285}
                height={330}
                sizes={activeCard ? '72vw' : '34vw'}
                className="h-full w-full object-cover object-center transition-transform duration-700"
                style={{ filter: activeCard ? 'drop-shadow(0 18px 20px rgba(0,0,0,0.10))' : 'grayscale(0.12)', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
            </button>
          );
        })}
      </div>

      <div className="mx-auto mt-4 max-w-[300px] border border-[#d8d8d8] bg-white p-3 text-left shadow-sm lg:hidden">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[12px] font-semibold leading-snug text-[#111111]">{activeProduct.name}</h3>
            <p className="mt-1 text-[11px] font-semibold">Rs{activeProduct.price.toFixed(2)}</p>
          </div>
          <span className="border border-[#ededed] px-2 py-1 text-[9px] text-[#6e6e6e]">{activeProduct.category}</span>
        </div>
        <button onClick={() => router.push(activeProduct.linkHref || `/product/${activeProduct.id}`)} className="w-full border border-[#111111] py-2 text-[10px] font-medium text-[#111111] transition-colors hover:bg-[#111111] hover:text-white">
          See detail
        </button>
      </div>

      <div className="relative left-1/2 hidden min-h-[455px] w-screen -translate-x-1/2 lg:block">
        <div className="absolute inset-x-0 top-0 h-[405px] overflow-visible">
          {products.map((product, index) => {
            const offset = getOffset(index);
            const activeCard = offset === 0;
            const slot = getSlotStyle(offset);
            if (!productSlots.includes(offset) || !slot) return null;
            return (
              <button
                key={product.id}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${product.name}`}
                className="absolute bottom-3 m-0 -translate-x-1/2 appearance-none rounded-none border-0 bg-transparent p-0 leading-none outline-none transition-[left,opacity,transform] duration-700 focus:outline-none focus-visible:outline-none"
                style={{ left: slot.left, zIndex: slot.zIndex, opacity: slot.opacity, transform: `translateX(-50%) scale(${slot.scale})`, pointerEvents: slot.pointerEvents, transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  width={260}
                  height={420}
                  sizes={activeCard ? '260px' : '142px'}
                  className={`object-contain object-bottom transition-[height,width,filter,transform] duration-700 ${
                    activeCard
                      ? 'h-[395px] w-[245px] drop-shadow-[0_22px_28px_rgba(0,0,0,0.10)] xl:h-[420px] xl:w-[260px]'
                      : 'h-[255px] w-[132px] hover:scale-[1.04] xl:h-[275px] xl:w-[142px]'
                  }`}
                  style={{
                    filter: activeCard ? 'drop-shadow(0 18px 20px rgba(0,0,0,0.10))' : `grayscale(0.08) blur(${slot.blur}px)`,
                    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                />
              </button>
            );
          })}
        </div>
        <div className="absolute left-[calc(50%+52px)] top-[178px] z-30 w-[190px] border border-[#d8d8d8] bg-white p-3 text-left shadow-sm xl:left-[calc(50%+66px)]">
          <div className="absolute -left-[72px] top-[13px] h-px w-[86px] origin-right rotate-[42deg] bg-[#9a2b3f]" />
          <h3 className="mb-1 text-[11px] font-semibold leading-snug text-[#111111]">{activeProduct.name}</h3>
          <p className="text-[11px] font-semibold text-[#111111]">Rs{activeProduct.price.toFixed(2)}</p>
          <div className="mt-2 flex gap-1.5">
            {(activeProduct.colors ?? []).slice(0, 3).map(color => (
              <span key={color.name} className="h-3 w-3 border border-[#d8d8d8]" style={{ backgroundColor: color.hex }} title={color.name} />
            ))}
          </div>
          <div className="-ml-1 mt-3">
            <p className="mb-1.5 text-[9px] font-semibold uppercase text-[#111111]">Size</p>
            <div className="grid grid-cols-5 border border-[#dcdcdc]">
              {(activeProduct.sizes ?? ['XS', 'S', 'M', 'L', 'XL']).slice(0, 5).map(size => (
                <span key={size} className="border-r border-[#e6e6e6] py-1 text-center text-[8px] text-[#333333] last:border-r-0">
                  {size}
                </span>
              ))}
            </div>
        </div>
          <button onClick={() => router.push(activeProduct.linkHref || `/product/${activeProduct.id}`)} className="mt-2 w-full border border-[#111111] py-2 text-[10px] font-medium text-[#111111] transition-colors hover:bg-[#111111] hover:text-white">
            See detail
          </button>
        </div>
      </div>

      <div className="mt-9 flex justify-center gap-5 md:mt-4">
        <button onClick={() => go('prev')} aria-label="Previous product" className="flex h-8 w-8 items-center justify-center text-[#111111] transition-colors hover:text-[#8f1f35]"><ArrowLeft size={17} strokeWidth={2.2} /></button>
        <button onClick={() => go('next')} aria-label="Next product" className="flex h-8 w-8 items-center justify-center text-[#111111] transition-colors hover:text-[#8f1f35]"><ArrowRight size={17} strokeWidth={2.2} /></button>
      </div>
    </section>
  );
}
