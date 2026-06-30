import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetail from '@/views/ProductDetail';
import { getProductById, getProductsByQuery } from '@/lib/storefront';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: 'Product | Saud Leather',
      description: 'Explore product details, size options, and related picks.',
    };
  }

  const title = product.seoTitle || `${product.name} | Saud Leather`;
  const description = product.seoDescription || product.description;
  const image = product.ogImage || product.image;
  const canonicalPath = product.canonicalPath || `/product/${product.id}`;

  return {
    title,
    description,
    keywords: product.seoKeywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      images: image ? [{ url: image, alt: product.name }] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) notFound();

  const relatedProducts = (await getProductsByQuery({ category: product.category, limit: 5 }))
    .filter(item => item.id !== product.id)
    .slice(0, 4);

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.length ? product.images : [product.image],
    sku: product.id,
    category: product.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NPR',
      price: product.price,
      availability: product.stock && product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    aggregateRating: product.reviewCount
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </>
  );
}
