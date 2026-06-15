import { NextResponse, type NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import type { Product } from '@/data/products';
import { categories, collections, products, testimonials } from '@/data/products';
import { assertAdmin } from '@/lib/adminAuth';
import { createProduct, deleteProduct, getDocument, listDocuments, removeDocument, saveDocument, updateProduct } from '@/lib/firestoreAdmin';
import { getProductsByQuery, type HeroBanner } from '@/lib/storefront';

export const dynamic = 'force-dynamic';

type SeedRecord = Record<string, string | number | boolean | null | SeedRecord[] | string[] | number[] | boolean[] | undefined>;

const allowedStatuses = ['pending_cod', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

const heroBanners: HeroBanner[] = [
  {
    id: 'hero-main',
    eyebrow: 'New Season',
    title: 'Unleash Your Best Look with ChitraTech Shop Signatures',
    description: 'Discover refined everyday pieces, seasonal staples, and fashion-forward essentials.',
    image: '/hero_collage_01.jpg',
    primaryLabel: 'Shop Now',
    primaryHref: '/main-product',
    secondaryLabel: 'Learn More',
    secondaryHref: '#collection',
    enabled: true,
  },
];

function adminAction(request: NextRequest) {
  return request.nextUrl.searchParams.get('action') || '';
}

function cloudinaryEnv() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error('Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.');
  return { cloudName, uploadPreset };
}

function isLocalAsset(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

async function uploadLocalAsset(assetPath: string, cache: Map<string, string>) {
  if (!isLocalAsset(assetPath)) return assetPath;
  const cached = cache.get(assetPath);
  if (cached) return cached;

  const { cloudName, uploadPreset } = cloudinaryEnv();
  const cleanPath = assetPath.replace(/^\//, '');
  const absolutePath = path.join(process.cwd(), 'public', cleanPath);
  const file = await readFile(absolutePath);
  const ext = path.extname(cleanPath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const formData = new FormData();
  formData.append('file', new Blob([file], { type: mime }), path.basename(cleanPath));
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'chitratech-shop/seed');
  formData.append('public_id', cleanPath.replace(/\.[^.]+$/, '').replace(/[\\/]/g, '-'));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error(`Cloudinary upload failed for ${assetPath}: ${await response.text()}`);
  const payload = await response.json() as { secure_url: string };
  cache.set(assetPath, payload.secure_url);
  return payload.secure_url;
}

async function withUploadedImages<T extends SeedRecord>(item: T, cache: Map<string, string>): Promise<T> {
  const entries = await Promise.all(Object.entries(item).map(async ([key, value]) => {
    if (isLocalAsset(value)) return [key, await uploadLocalAsset(value, cache)];
    if (Array.isArray(value)) {
      const next = await Promise.all(value.map(entry => isLocalAsset(entry) ? uploadLocalAsset(entry, cache) : entry));
      return [key, next];
    }
    return [key, value];
  }));
  return Object.fromEntries(entries) as T;
}

async function writeItems(pathName: string, items: SeedRecord[]) {
  await Promise.all(items.map(item => saveDocument(pathName, String(item.id), item as never)));
}

function productSeo(product: Product): Product {
  return {
    ...product,
    seoTitle: product.seoTitle || `${product.name} | ChitraTech Shop`,
    seoDescription: product.seoDescription || product.description,
    seoKeywords: product.seoKeywords || [product.category, 'ChitraTech Shop', 'fashion'],
    ogImage: product.ogImage || product.image,
    canonicalPath: product.canonicalPath || `/product/${product.id}`,
  };
}

export async function GET(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const action = adminAction(request);

  try {
    if (action === 'products') {
      const items = await getProductsByQuery({ limit: 200 });
      return NextResponse.json({ products: items });
    }

    if (action === 'cms') {
      const cmsPath = request.nextUrl.searchParams.get('path');
      if (!cmsPath) return NextResponse.json({ error: 'Missing path.' }, { status: 400 });
      return NextResponse.json({ items: await listDocuments(cmsPath) });
    }

    if (action === 'orders') {
      const orders = await listDocuments('orders');
      orders.sort((a, b) => new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime());
      return NextResponse.json({ orders });
    }

    return NextResponse.json({ error: 'Unsupported admin action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Admin request failed.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const action = adminAction(request);

  try {
    if (action === 'products') {
      const product = await request.json() as Product;
      await createProduct(product);
      return NextResponse.json({ product });
    }

    if (action === 'seed') {
      const cache = new Map<string, string>();
      const uploadedProducts = await Promise.all(products.map(product => withUploadedImages(productSeo(product) as unknown as SeedRecord, cache)));
      const uploadedHero = await Promise.all(heroBanners.map(item => withUploadedImages(item as unknown as SeedRecord, cache)));
      const uploadedCollections = await Promise.all(collections.map(item => withUploadedImages({ ...item, linkHref: item.linkHref || '/main-product?collection=' + item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') } as unknown as SeedRecord, cache)));
      const uploadedCategories = await Promise.all(categories.map((item, index) => withUploadedImages({ id: item.name.toLowerCase().replace(/\\s+/g, '-'), order: index + 1, ...item, linkHref: (item as { linkHref?: string }).linkHref || '/main-product?category=' + encodeURIComponent(item.name) }, cache)));
      const uploadedTestimonials = await Promise.all(testimonials.map(item => withUploadedImages(item as unknown as SeedRecord, cache)));
      const uploadedFeatured = uploadedProducts.slice(0, 8).map((item, index) => ({ ...item, featuredOrder: index + 1, enabled: true }));

      await Promise.all([
        writeItems('products', uploadedProducts),
        writeItems('homepage/heroBanners/items', uploadedHero),
        writeItems('homepage/featuredProducts/items', uploadedFeatured),
        writeItems('homepage/collections/items', uploadedCollections),
        writeItems('categories', uploadedCategories),
        writeItems('testimonials', uploadedTestimonials),
      ]);

      return NextResponse.json({
        ok: true,
        uploadedAssets: cache.size,
        counts: {
          products: uploadedProducts.length,
          hero: uploadedHero.length,
          featuredProducts: uploadedFeatured.length,
          collections: uploadedCollections.length,
          categories: uploadedCategories.length,
          testimonials: uploadedTestimonials.length,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported admin action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Admin create failed.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const action = adminAction(request);

  try {
    if (action === 'products') {
      const body = await request.json() as Product & { id?: string };
      const id = String(body.id || '').trim();
      if (!id) return NextResponse.json({ error: 'Missing product id.' }, { status: 400 });
      await updateProduct({ ...body, id });
      return NextResponse.json({ product: { ...body, id } });
    }

    if (action === 'cms') {
      const body = await request.json() as { path: string; id: string; data: Record<string, unknown> };
      await saveDocument(body.path, body.id, body.data as never);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unsupported admin action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Admin update failed.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const action = adminAction(request);

  try {
    if (action === 'orders') {
      const body = await request.json() as { id?: string; status?: string };
      const id = String(body.id || '').trim();
      const nextStatus = String(body.status || '').trim();
      if (!id || !allowedStatuses.includes(nextStatus)) {
        return NextResponse.json({ error: 'Valid order id and status are required.' }, { status: 400 });
      }

      const existing = await getDocument('orders', id);
      if (!existing) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });

      const updated = { ...existing, status: nextStatus, updatedAt: new Date().toISOString() };
      await saveDocument('orders', id, updated);

      const user = existing.user;
      const userId = typeof user === 'object' && user && !Array.isArray(user) ? String((user as { id?: unknown }).id || '') : '';
      if (userId) await saveDocument(`customers/${encodeURIComponent(userId)}/orders`, id, updated);

      return NextResponse.json({ order: updated });
    }

    return NextResponse.json({ error: 'Unsupported admin action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Admin patch failed.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const action = adminAction(request);

  try {
    if (action === 'products') {
      const id = String(request.nextUrl.searchParams.get('id') || '').trim();
      if (!id) return NextResponse.json({ error: 'Missing product id.' }, { status: 400 });
      await deleteProduct(id);
      return NextResponse.json({ ok: true });
    }

    if (action === 'cms') {
      const cmsPath = request.nextUrl.searchParams.get('path');
      const id = request.nextUrl.searchParams.get('id');
      if (!cmsPath || !id) return NextResponse.json({ error: 'Missing path or id.' }, { status: 400 });
      await removeDocument(cmsPath, id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unsupported admin action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Admin delete failed.' }, { status: 500 });
  }
}
