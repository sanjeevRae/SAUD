import { NextRequest, NextResponse } from 'next/server';
import { listDocuments } from '@/lib/firestoreAdmin';
import { getProductsByQuery } from '@/lib/storefront';

export const dynamic = 'force-dynamic';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type PlainRecord = Record<string, JsonValue | undefined>;

function productsAction(request: NextRequest) {
  return request.nextUrl.searchParams.get('action') || '';
}

export async function GET(request: NextRequest) {
  const action = productsAction(request);

  try {
    if (action === 'search') {
      const searchParams = request.nextUrl.searchParams;
      const products = await getProductsByQuery({
        q: searchParams.get('q') || undefined,
        category: searchParams.get('category') || undefined,
        gender: searchParams.get('gender') || undefined,
        sort: searchParams.get('sort') || undefined,
        limit: Number(searchParams.get('limit') || 8),
      });

      return NextResponse.json({ products });
    }

    if (action === 'reviews') {
      const productId = String(request.nextUrl.searchParams.get('productId') || '').trim();
      if (!productId) return NextResponse.json({ error: 'Missing product id.' }, { status: 400 });

      const reviews = await listDocuments<PlainRecord>('reviews');
      const filtered = reviews
        .filter(review => String(review.productId || '') === productId)
        .sort((a, b) => new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime());

      return NextResponse.json({ reviews: filtered });
    }

    return NextResponse.json({ error: 'Unsupported products action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Products request failed.' }, { status: 500 });
  }
}
