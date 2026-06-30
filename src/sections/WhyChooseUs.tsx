const features = [
  {
    label: 'Top Wear',
    title: 'Premium Fabric Comfort',
    description: 'Our topwear is crafted from carefully selected fabrics that feel soft, breathable, and comfortable throughout the day.',
    image: '/why_fabric.jpg',
  },
  {
    label: 'Bag',
    title: 'Premium Bag',
    description: 'Our bags are crafted from high-quality materials that are durable and built for everyday use.',
    image: '/why_bag.jpg',
  },
  {
    label: 'Bottoms',
    title: 'Tailored Fit & Versatile Bottoms',
    description: 'Our bottoms are designed with refined cuts and balanced silhouettes, offering both casual and elevated looks.',
    image: '/why_bottoms.jpg',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-white px-5 py-24 md:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow mb-3">Why Choose Us.</p>
        <h2 className="font-body mb-12 text-3xl font-semibold text-[#111111] md:mb-14 md:text-4xl">Saud Leather: The Difference</h2>
        <div className="relative mx-auto hidden h-[680px] max-w-[1180px] md:block">
          <div className="absolute left-0 top-[42px] h-[555px] w-[365px] overflow-hidden bg-[#eeeeee]">
            <img src="/why_model.jpg" alt="Model wearing Saud Leather outfit" className="!h-full !w-full max-w-none object-cover object-[45%_center]" />
          </div>
          <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full" viewBox="0 0 1180 680" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 235 190 L 365 42 L 520 42" fill="none" stroke="#9f1631" strokeWidth="1.4" />
            <path d="M 292 336 L 520 336" fill="none" stroke="#9b9b9b" strokeWidth="1" />
            <path d="M 292 525 L 520 525" fill="none" stroke="#9b9b9b" strokeWidth="1" />
          </svg>
          {features.map((feature, index) => (
            <article key={feature.title} className="absolute left-[520px] z-20 flex items-center gap-12" style={{ top: index === 0 ? '18px' : index === 1 ? '255px' : '455px' }}>
              <div className={`relative aspect-square h-[150px] shrink-0 border bg-white ${index === 0 ? 'border-[#9f1631]' : 'border-[#8f8f8f]'}`}>
                <img src={feature.image} alt={feature.title} className="!h-full !w-full max-w-none object-cover object-center" />
                <span className={`absolute left-0 top-0 px-2 py-1 text-[10px] font-medium text-white ${index === 0 ? 'bg-[#9f1631]' : 'bg-[#8f8f8f]'}`}>{feature.label}</span>
              </div>
              <div className="max-w-[460px]">
                <h3 className="font-body mb-4 text-3xl font-semibold text-[#111111]">{feature.title}</h3>
                <p className="text-lg leading-relaxed text-[#6e6e6e]">{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="space-y-8 md:hidden">
          <div className="overflow-hidden bg-[#eeeeee]">
            <img src="/why_model.jpg" alt="Model wearing Saud Leather outfit" className="!h-[520px] !w-full max-w-none object-cover object-[45%_center]" />
          </div>
          {features.map(feature => (
            <article key={feature.title} className="relative grid grid-cols-[112px_1fr] gap-4 border-l border-[#b8b8b8] pl-5">
              <span className="absolute left-0 top-14 h-px w-5 bg-[#b8b8b8]" />
              <div className="relative aspect-square h-28 shrink-0 border border-[#8f8f8f]">
                <img src={feature.image} alt={feature.title} className="!h-full !w-full max-w-none object-cover object-center" />
                <span className="absolute left-0 top-0 bg-[#8f1f35] px-2 py-1 text-[9px] text-white">{feature.label}</span>
              </div>
              <div>
                <h3 className="font-body mb-2 text-xl font-semibold text-[#111111]">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-[#6e6e6e]">{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
