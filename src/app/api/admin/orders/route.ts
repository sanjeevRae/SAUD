import { NextResponse, type NextRequest } from 'next/server';
import { assertAdmin } from '@/lib/adminAuth';
import { getDocument, listDocuments, saveDocument } from '@/lib/firestoreAdmin';

export const dynamic = 'force-dynamic';

const allowedStatuses = ['pending_cod', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

export async function GET(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  try {
    const orders = await listDocuments('orders');
    orders.sort((a, b) => new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime());
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not load orders.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  try {
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
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update order.' }, { status: 500 });
  }
}
