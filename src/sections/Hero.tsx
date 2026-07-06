'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { HeroBanner } from '@/lib/storefront';

type HeroProps = { banners?: HeroBanner[] };

export default function Hero({ banners }: HeroProps) {
  const banner = banners?.[0];
  const image = banner?.image || '/hero_collage_01.jpg';
  const title = banner?.title || 'Unleash Your Best Look with K-Fashion Signatures';
  const description = banner?.description || 'Do not just follow the trend, lead it. Shop K-Fashion now and define your best look.';

  return (
    <section className="relative h-[500px] overflow-hidden bg-[#111111] md:h-[640px]">
      <Image
        src={image}
        alt="K-fashion editorial"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/72 via-black/35 to-transparent" />
      <div className="absolute bottom-10 left-5 z-20 max-w-[560px] text-white md:bottom-16 md:left-10">
        <h1 className="font-body mb-4 text-[34px] font-normal leading-[1.03] md:text-[44px]">{title}</h1>
        <p className="mb-6 max-w-[390px] text-sm leading-relaxed text-white/84 md:text-base">{description}</p>
        <div className="flex gap-3">
          <Link href={banner?.primaryHref || '/main-product'} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-medium text-[#111111]" style={{ color: '#111111' }}>
            <span style={{ color: '#111111' }}>{banner?.primaryLabel || 'Shop Now'}</span> <ArrowRight size={14} color="#111111" />
          </Link>
          <a href={banner?.secondaryHref || '#collection'} className="inline-flex items-center gap-2 rounded-full border border-white/70 px-5 py-2.5 text-xs font-medium text-white">
            {banner?.secondaryLabel || 'Learn More'} <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}
