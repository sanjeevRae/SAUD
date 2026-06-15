import { NextRequest, NextResponse } from 'next/server';
import { getDocument, listDocuments, removeDocument, saveDocument } from '@/lib/firestoreAdmin';

export const dynamic = 'force-dynamic';

type OrderItem = { id?: string; name?: string };
type CustomerOrder = {
  id: string;
  items?: OrderItem[];
};

function reviewId(userId: string, productId: string) {
  return `${userId}_${productId}`.replace(/[^a-zA-Z0-9_-]+/g, '_');
}

export async function GET(request: NextRequest) {
  try {
    const userId = String(request.nextUrl.searchParams.get('userId') || '').trim();
    if (!userId) return NextResponse.json({ error: 'Missing user id.' }, { status: 400 });

    const reviews = await listDocuments(`customers/${encodeURIComponent(userId)}/reviews`);
    reviews.sort((a, b) => new Date(String(b.updatedAt || b.createdAt || 0)).getTime() - new Date(String(a.updatedAt || a.createdAt || 0)).getTime());
    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load reviews.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = String(body.user?.id || '').trim();
    const productId = String(body.productId || '').trim();
    const rating = Math.max(1, Math.min(5, Number(body.rating || 0)));
    const text = String(body.text || '').trim();

    if (!userId || !productId) return NextResponse.json({ error: 'Missing user or product.' }, { status: 400 });
    if (!rating || !text) return NextResponse.json({ error: 'Rating and review text are required.' }, { status: 400 });

    const orders = await listDocuments<CustomerOrder>(`customers/${encodeURIComponent(userId)}/orders`);
    const purchased = orders.some(order => (order.items ?? []).some(item => String(item.id || '') === productId));
    if (!purchased) return NextResponse.json({ error: 'You can review products after ordering them.' }, { status: 403 });

    const id = reviewId(userId, productId);
    const existing = await getDocument(`customers/${encodeURIComponent(userId)}/reviews`, id);
    const now = new Date().toISOString();
    const review = {
      ...(existing ?? {}),
      id,
      productId,
      productName: String(body.productName || ''),
      userId,
      userName: String(body.user?.name || 'Customer'),
      userPhoto: String(body.user?.photo || ''),
      rating,
      text,
      createdAt: String(existing?.createdAt || now),
      updatedAt: now,
    };

    await saveDocument(`products/${encodeURIComponent(productId)}/reviews`, review.id, review);
    await saveDocument(`customers/${encodeURIComponent(userId)}/reviews`, review.id, review);
    return NextResponse.json({ review });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save review.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request);
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = String(request.nextUrl.searchParams.get('userId') || '').trim();
    const productId = String(request.nextUrl.searchParams.get('productId') || '').trim();
    if (!userId || !productId) return NextResponse.json({ error: 'Missing user or product.' }, { status: 400 });

    const id = reviewId(userId, productId);
    await removeDocument(`products/${encodeURIComponent(productId)}/reviews`, id);
    await removeDocument(`customers/${encodeURIComponent(userId)}/reviews`, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not delete review.' }, { status: 500 });
  }
}
