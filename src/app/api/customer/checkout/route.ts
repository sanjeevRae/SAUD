import { NextRequest, NextResponse } from 'next/server';
import { saveDocument } from '@/lib/firestoreAdmin';

const deliveryFee = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.user?.id) return NextResponse.json({ error: 'Missing user.' }, { status: 400 });
    const subtotal = Number(body.subtotal ?? 0);
    const orderId = `cod_${Date.now()}`;
    const order = {
      id: orderId,
      user: body.user,
      items: body.items ?? [],
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      paymentMethod: 'Cash on Delivery',
      status: 'pending_cod',
      createdAt: new Date().toISOString(),
    };
    await saveDocument('orders', orderId, order);
    await saveDocument(`customers/${encodeURIComponent(body.user.id)}/orders`, orderId, order);
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Checkout failed.' }, { status: 500 });
  }
}
