import {
  categories as fallbackCategories,
  collections as fallbackCollections,
  products as fallbackProducts,
  testimonials as fallbackTestimonials,
  type Collection,
  type Product,
  type Testimonial,
} from '@/data/products';

export type ProductQuery = {
  q?: string;
  category?: string;
  gender?: string;
  sort?: string;
  limit?: number;
};

export type HeroBanner = {
  id: string;
  eyebrow?: string;
  title: string;
  description: string;
  image: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  enabled?: boolean;
};

export type NoticeBanner = {
  id: string;
  title?: string;
  message: string;
  quote?: string;
  countdownTo?: string;
  startsAt?: string;
  endsAt?: string;
  ctaLabel?: string;
  ctaHref?: string;
  enabled?: boolean;
};
export type StoreCategory = {
  id?: string;
  name: string;
  stock: number;
  image: string;
  linkHref?: string;
};

export type HomepageConfig = {
  noticeBanners: NoticeBanner[];
  heroBanners: HeroBanner[];
  featuredProducts: Product[];
  latestProducts: Product[];
  collections: Collection[];
  categories: StoreCategory[];
  testimonials: Testimonial[];
};

type FirestoreValue =
  | { stringValue?: string }
  | { integerValue?: string }
  | { doubleValue?: number }
  | { booleanValue?: boolean }
  | { arrayValue?: { values?: FirestoreValue[] } }
  | { mapValue?: { fields?: Record<string, FirestoreValue> } }
  | { nullValue?: null };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
};

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
const firestoreBaseUrl = projectId
  ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`
  : '';

const firestoreFetchTimeoutMs = Number(process.env.FIRESTORE_FETCH_TIMEOUT_MS ?? 1500);

function firestoreSignal() {
  return AbortSignal.timeout(firestoreFetchTimeoutMs);
}

function fromFirestoreValue(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue ?? 0);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('arrayValue' in value) return (value.arrayValue?.values ?? []).map(fromFirestoreValue);
  if ('mapValue' in value) return fromFirestoreFields(value.mapValue?.fields ?? {});
  return undefined;
}

function fromFirestoreFields(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

function documentId(documentName: string) {
  return documentName.split('/').pop() || documentName;
}

async function fetchCollection<T>(collectionPath: string): Promise<T[]> {
  try {
    const { listDocuments } = await import('@/lib/firestoreAdmin');
    const documents = await listDocuments(collectionPath);
    if (documents.length) return documents as unknown as T[];
  } catch {
    // Fall back to public REST below when admin credentials are unavailable.
  }

  if (!firestoreBaseUrl) return [];

  try {
    const response = await fetch(`${firestoreBaseUrl}/${collectionPath}`, {
      next: { revalidate: 60 },
      signal: firestoreSignal(),
    });

    if (!response.ok) return [];

    const payload = (await response.json()) as { documents?: FirestoreDocument[] };
    return (payload.documents ?? []).map(document => ({
      id: documentId(document.name),
      ...fromFirestoreFields(document.fields ?? {}),
    })) as T[];
  } catch {
    return [];
  }
}

async function fetchDocument<T>(documentPath: string): Promise<T | null> {
  try {
    const parts = documentPath.split('/');
    const id = parts.pop();
    const collectionPath = parts.join('/');
    const { listDocuments } = await import('@/lib/firestoreAdmin');
    const documents = await listDocuments(collectionPath);
    const document = documents.find(item => String(item.id) === id);
    if (document) return document as unknown as T;
  } catch {
    // Fall back to public REST below when admin credentials are unavailable.
  }

  if (!firestoreBaseUrl) return null;

  try {
    const response = await fetch(`${firestoreBaseUrl}/${documentPath}`, {
      next: { revalidate: 60 },
      signal: firestoreSignal(),
    });

    if (!response.ok) return null;

    const document = (await response.json()) as FirestoreDocument;
    return {
      id: documentId(document.name),
      ...fromFirestoreFields(document.fields ?? {}),
    } as T;
  } catch {
    return null;
  }
}

function normalizeProduct(product: Product): Product {
  const images = Array.from(new Set([product.image, ...(product.images ?? [])].filter(Boolean)));
  const image = product.image || images[0] || '';

  return {
    ...product,
    image,
    images: images.length ? images : image ? [image] : [],
    seoTitle: product.seoTitle || `${product.name} | Saud Leather`,
    seoDescription: product.seoDescription || product.description,
    ogImage: product.ogImage || image,
    canonicalPath: product.canonicalPath || `/product/${product.id}`,
    linkHref: product.linkHref || product.canonicalPath || `/product/${product.id}`,
  };
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function strictIncludes(text: string, term: string) {
  const normalizedText = normalizeSearchText(text);
  const normalizedTerm = normalizeSearchText(term);
  if (!normalizedTerm) return true;
  if (normalizedText.includes(normalizedTerm)) return true;
  if (normalizedTerm.endsWith('s') && normalizedText.includes(normalizedTerm.slice(0, -1))) return true;
  return false;
}

function filterProducts(items: Product[], query: ProductQuery) {
  const term = query.q?.trim().toLowerCase();
  const category = query.category?.trim().toLowerCase();
  const gender = query.gender?.trim().toLowerCase();

  const filtered = items.filter(product => {
    const text = [
      product.name,
      product.category,
      product.description,
      product.tag,
      product.price,
      product.originalPrice,
      ...(product.sizes ?? []),
      ...(product.colors?.flatMap(color => [color.name, color.hex]) ?? []),
      ...(product.seoKeywords ?? []),
    ]
      .filter(value => value !== undefined && value !== null)
      .join(' ')
      .toLowerCase();

    const matchesTerm = !term || strictIncludes(text, term);
    const normalizedCategory = product.category.toLowerCase();
    const matchesCategory = !category || normalizedCategory === category || normalizedCategory.replace(/s$/, '') === category.replace(/s$/, '') || text.includes(category);
    const matchesGender =
      !gender ||
      (gender === 'men' && /\bmen'?s\b|\bmale\b/.test(text)) ||
      (gender === 'women' && /\bwomen'?s\b|\bfemale\b/.test(text)) ||
      (gender === 'kids' && /\bkids?\b|\bchildren\b|\bboys?\b|\bgirls?\b/.test(text));

    return matchesTerm && matchesCategory && matchesGender;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (query.sort === 'top-selling') return Number(b.reviewCount || 0) + Number(b.rating || 0) * 20 - (Number(a.reviewCount || 0) + Number(a.rating || 0) * 20);
    if (query.sort === 'trending') return Number(Boolean(b.tag)) - Number(Boolean(a.tag)) || Number(b.rating || 0) - Number(a.rating || 0);
    if (query.sort === 'newest') return Number(b.featuredOrder ?? b.id) - Number(a.featuredOrder ?? a.id);
    if (query.sort === 'loved') return Number(b.rating || 0) - Number(a.rating || 0) || Number(b.reviewCount || 0) - Number(a.reviewCount || 0);
    return 0;
  });

  return typeof query.limit === 'number' ? sorted.slice(0, query.limit) : sorted;
}

export async function getProductsByQuery(query: ProductQuery = {}) {
  const firestoreProducts = await fetchCollection<Product>('products');
  const source = firestoreProducts.length ? firestoreProducts : fallbackProducts;
  return filterProducts(source.map(normalizeProduct), query);
}

export async function getProductById(id: string) {
  const firestoreProduct = await fetchDocument<Product>(`products/${id}`);
  const featuredProduct = firestoreProduct ? null : await fetchDocument<Product>(`homepage/featuredProducts/items/${id}`);
  const product = firestoreProduct ?? featuredProduct ?? fallbackProducts.find(item => item.id === id) ?? null;
  return product ? normalizeProduct(product) : null;
}

export async function getHomepageConfig(): Promise<HomepageConfig> {
  const [noticeBanners, heroBanners, products, featuredProducts, collections, categories, testimonials] = await Promise.all([
    fetchCollection<NoticeBanner>('homepage/noticeBanners/items'),
    fetchCollection<HeroBanner>('homepage/heroBanners/items'),
    getProductsByQuery({ limit: 10 }),
    fetchCollection<Product>('homepage/featuredProducts/items'),
    fetchCollection<Collection>('homepage/collections/items'),
    fetchCollection<StoreCategory>('categories'),
    fetchCollection<Testimonial>('testimonials'),
  ]);

  return {
    noticeBanners: noticeBanners.length
      ? noticeBanners.filter(notice => notice.enabled !== false)
      : [
          {
            id: 'notice-local',
            title: 'Summer Sale',
            message: 'Get 50% Off This Summer Sale. Grab It Fast!',
            countdownTo: new Date(Date.now() + (22 * 60 * 60 + 37 * 60 + 54) * 1000).toISOString(),
            enabled: true,
          },
        ],    heroBanners: heroBanners.length
      ? heroBanners.filter(banner => banner.enabled !== false)
      : [
          {
            id: 'hero-local',
            eyebrow: 'New Season',
            title: 'Unleash Your Best Look with Saud Leather Signatures',
            description: 'Discover refined everyday pieces, seasonal staples, and fashion-forward essentials.',
            image: '/hero_collage_01.jpg',
            primaryLabel: 'Shop Now',
            primaryHref: '/main-product',
            secondaryLabel: 'Learn More',
            secondaryHref: '#collection',
          },
        ],
    featuredProducts: featuredProducts.length
      ? featuredProducts.filter(product => product.enabled !== false).map(normalizeProduct).sort((a, b) => Number(a.featuredOrder ?? 999) - Number(b.featuredOrder ?? 999))
      : products.slice(0, 8),
    latestProducts: products.slice(0, 10),
    collections: collections.length ? collections : fallbackCollections,
    categories: categories.length ? categories : fallbackCategories,
    testimonials: testimonials.length ? testimonials : fallbackTestimonials,
  };
}








