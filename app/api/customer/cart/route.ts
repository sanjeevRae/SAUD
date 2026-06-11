import { NextRequest, NextResponse } from 'next/server';
import { saveDocument } from '@/lib/firestoreAdmin';

function userPath(userId: string, suffix: string) {
  return `customers/${encodeURIComponent(userId)}/${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.user?.id) return NextResponse.json({ error: 'Missing user.' }, { status: 400 });
    await saveDocument('customerCarts', body.user.id, {
      user: body.user,
      items: body.items ?? [],
      totalPrice: Number(body.totalPrice ?? 0),
      totalItems: Number(body.totalItems ?? 0),
      updatedAt: new Date().toISOString(),
    });
    await saveDocument(userPath(body.user.id, 'cartSnapshots'), String(Date.now()), {
      items: body.items ?? [],
      totalPrice: Number(body.totalPrice ?? 0),
      totalItems: Number(body.totalItems ?? 0),
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cart save failed.' }, { status: 500 });
  }
}
