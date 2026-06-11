'use client';

import { useRef } from 'react';
import { ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { testimonials as fallbackTestimonials, type Testimonial } from '@/data/products';

type TestimonialsProps = {
  testimonials?: Testimonial[];
};

export default function Testimonials({ testimonials = fallbackTestimonials }: TestimonialsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: 'left' | 'right') => scrollRef.current?.scrollBy({ left: direction === 'left' ? -390 : 390, behavior: 'smooth' });

  return (
    <section className="overflow-hidden bg-white py-24">
      <div className="mb-14 text-center">
        <p className="eyebrow mb-4">Testimonials.</p>
        <h2 className="font-body text-3xl font-semibold text-[#111111] md:text-4xl">ChitraTech Shop: Customer Stories</h2>
      </div>
      <div ref={scrollRef} className="flex gap-5 overflow-x-auto scroll-smooth px-4 pb-3 md:gap-7 md:px-8" style={{ scrollbarWidth: 'none' }}>
        {testimonials.map(testimonial => (
          <article key={testimonial.id} className="relative h-[470px] w-[300px] flex-none overflow-hidden rounded-[18px] bg-[#eeeeee] md:h-[560px] md:w-[360px]">
            <img src={testimonial.avatar} alt={testimonial.name} className="absolute inset-0 !h-full !w-full max-w-none object-cover object-center" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/25" />
              <div className="absolute left-5 right-5 top-7 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <span className="block h-10 w-10 flex-none overflow-hidden rounded-full bg-white/20">
                  <img src={testimonial.avatar} alt="" className="!h-full !w-full max-w-none object-cover object-center" />
                </span>
                <span className="text-sm font-medium">{testimonial.name}</span>
              </div>
              <span className="flex items-center gap-1 text-sm"><Star size={14} className="fill-white text-white" /> {testimonial.rating}</span>
            </div>
            <p className="absolute bottom-8 left-7 right-7 text-center text-lg leading-relaxed text-white">&quot;{testimonial.text}&quot;</p>
          </article>
        ))}
      </div>
      <div className="mt-14 flex justify-center gap-7">
        <button onClick={() => scroll('left')} aria-label="Previous testimonials"><ArrowLeft size={24} /></button>
        <button onClick={() => scroll('right')} aria-label="Next testimonials"><ArrowRight size={24} /></button>
      </div>
    </section>
  );
}
