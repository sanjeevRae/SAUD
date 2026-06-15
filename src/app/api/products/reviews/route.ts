import { NextRequest, NextResponse } from 'next/server';
import { listDocuments } from '@/lib/firestoreAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const productId = String(request.nextUrl.searchParams.get('productId') || '').trim();
    if (!productId) return NextResponse.json({ error: 'Missing product id.' }, { status: 400 });

    const reviews = await listDocuments(`products/${encodeURIComponent(productId)}/reviews`);
    reviews.sort((a, b) => new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime());
    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load reviews.' }, { status: 500 });
  }
}
