import { NextRequest, NextResponse } from 'next/server';
import { saveDocument } from '@/lib/firestoreAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.user?.id) return NextResponse.json({ error: 'Missing user.' }, { status: 400 });

    const subtotal = Number(body.subtotal ?? 0);
    const deliveryFee = Math.max(0, Number(body.deliveryFee ?? 0));
    const discount = String(body.voucherCode || '').trim().toUpperCase() === 'CHITRA10' ? Math.round(subtotal * 0.1) : 0;
    const total = Math.max(0, subtotal - discount + deliveryFee);
    const orderId = `cod_${Date.now()}`;
    const order = {
      id: orderId,
      user: body.user,
      items: body.items ?? [],
      subtotal,
      discount,
      voucherCode: String(body.voucherCode || ''),
      deliveryFee,
      deliveryLabel: String(body.deliveryLabel || 'Delivery'),
      shippingAddress: body.shippingAddress ?? {},
      total,
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
