import { NextRequest, NextResponse } from 'next/server';
import { listDocuments } from '@/lib/firestoreAdmin';

export async function GET(request: NextRequest) {
  try {
    const userId = String(request.nextUrl.searchParams.get('userId') || '').trim();
    if (!userId) return NextResponse.json({ error: 'Missing user id.' }, { status: 400 });

    const orders = await listDocuments(`customers/${encodeURIComponent(userId)}/orders`);
    orders.sort((a, b) => new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime());
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load orders.' }, { status: 500 });
  }
}
