import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDocument, listDocuments, removeDocument, saveDocument } from '@/lib/firestoreAdmin';

export const dynamic = 'force-dynamic';

type CustomerRecord = Record<string, string | number | boolean | null | string[] | undefined>;
type OrderItem = { id?: string; name?: string };
type CustomerOrder = {
  id: string;
  items?: OrderItem[];
};

function customerAction(request: NextRequest) {
  return request.nextUrl.searchParams.get('action') || '';
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function accountId(method: string, value: string) {
  return `${method}_${normalize(value).replace(/[^a-z0-9]+/g, '_')}`;
}

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

function publicUser(user: CustomerRecord) {
  const safe = { ...user };
  delete safe.passwordHash;
  return safe;
}

function reviewId(userId: string, productId: string) {
  return `${userId}_${productId}`.replace(/[^a-zA-Z0-9_-]+/g, '_');
}

export async function GET(request: NextRequest) {
  const action = customerAction(request);

  try {
    if (action === 'orders') {
      const userId = String(request.nextUrl.searchParams.get('userId') || '').trim();
      if (!userId) return NextResponse.json({ error: 'Missing user id.' }, { status: 400 });

      const orders = await listDocuments(`customers/${encodeURIComponent(userId)}/orders`);
      orders.sort((a, b) => new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime());
      return NextResponse.json({ orders });
    }

    if (action === 'reviews') {
      const userId = String(request.nextUrl.searchParams.get('userId') || '').trim();
      if (!userId) return NextResponse.json({ error: 'Missing user id.' }, { status: 400 });

      const reviews = await listDocuments(`customers/${encodeURIComponent(userId)}/reviews`);
      reviews.sort((a, b) => new Date(String((b as Record<string, unknown>).updatedAt || (b as Record<string, unknown>).createdAt || 0)).getTime() - new Date(String((a as Record<string, unknown>).updatedAt || (a as Record<string, unknown>).createdAt || 0)).getTime());
      return NextResponse.json({ reviews });
    }

    return NextResponse.json({ error: 'Unsupported customer action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Customer request failed.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const action = customerAction(request);

  try {
    if (action === 'account') {
      const body = await request.json();
      const mode = String(body.mode || 'login');
      const method = String(body.method || 'email') as 'email' | 'google' | 'phone';
      const credential = normalize(String(body.email || body.phone || ''));
      const password = String(body.password || '');
      const name = String(body.name || '').trim();

      if (!credential) return NextResponse.json({ error: 'Email or phone required.' }, { status: 400 });
      if (method !== 'google' && !password) return NextResponse.json({ error: 'Password required.' }, { status: 400 });
      if (mode === 'register' && !name) return NextResponse.json({ error: 'Name required.' }, { status: 400 });

      const id = accountId(method, credential);
      const existing = await getDocument('customers', id) as CustomerRecord | null;

      if (mode === 'login' && !existing) return NextResponse.json({ error: 'Account not found. Please register first.' }, { status: 404 });
      if (mode === 'login' && existing?.passwordHash && existing.passwordHash !== hashPassword(password)) return NextResponse.json({ error: 'Invalid password.' }, { status: 401 });

      const user: CustomerRecord = {
        ...(existing ?? {}),
        id,
        method,
        name: name || String(existing?.name || credential.split('@')[0]),
        email: method === 'phone' ? String(existing?.email || '') : credential,
        phone: method === 'phone' ? credential : String(existing?.phone || ''),
        passwordHash: method === 'google' ? String(existing?.passwordHash || '') : hashPassword(password),
        photo: String(body.photo || existing?.photo || ''),
        firebaseUid: String(body.firebaseUid || existing?.firebaseUid || ''),
        address: String(existing?.address || ''),
        city: String(existing?.city || ''),
        area: String(existing?.area || ''),
        landmark: String(existing?.landmark || ''),
        updatedAt: new Date().toISOString(),
        createdAt: String(existing?.createdAt || new Date().toISOString()),
      };

      await saveDocument('customers', id, user);
      return NextResponse.json({ user: publicUser(user) });
    }

    if (action === 'activity') {
      const body = await request.json();
      if (!body.user?.id) return NextResponse.json({ error: 'Missing user.' }, { status: 400 });
      const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await saveDocument(`customers/${encodeURIComponent(body.user.id)}/activity`, id, {
        type: String(body.type || 'event'),
        user: body.user,
        data: body.data ?? {},
        path: body.path ?? '',
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true });
    }

    if (action === 'cart') {
      const body = await request.json();
      if (!body.user?.id) return NextResponse.json({ error: 'Missing user.' }, { status: 400 });
      await saveDocument('customerCarts', body.user.id, {
        user: body.user,
        items: body.items ?? [],
        totalPrice: Number(body.totalPrice ?? 0),
        totalItems: Number(body.totalItems ?? 0),
        updatedAt: new Date().toISOString(),
      });
      await saveDocument(`customers/${encodeURIComponent(body.user.id)}/cartSnapshots`, String(Date.now()), {
        items: body.items ?? [],
        totalPrice: Number(body.totalPrice ?? 0),
        totalItems: Number(body.totalItems ?? 0),
        createdAt: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true });
    }

    if (action === 'checkout') {
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
    }

    if (action === 'reviews') {
      const body = await request.json();
      const userId = String(body.user?.id || '').trim();
      const productId = String(body.productId || '').trim();
      const rating = Math.max(1, Math.min(5, Number(body.rating || 0)));
      const text = String(body.text || '').trim();

      if (!userId || !productId) return NextResponse.json({ error: 'Missing user or product.' }, { status: 400 });
      if (!rating || !text) return NextResponse.json({ error: 'Rating and review text are required.' }, { status: 400 });

      const orders = await listDocuments(`customers/${encodeURIComponent(userId)}/orders`) as CustomerOrder[];
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
    }

    return NextResponse.json({ error: 'Unsupported customer action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Customer create failed.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const action = customerAction(request);

  try {
    if (action === 'account') {
      const body = await request.json();
      if (!body.id) return NextResponse.json({ error: 'Missing user id.' }, { status: 400 });
      const existing = await getDocument('customers', String(body.id)) as CustomerRecord | null;
      if (!existing) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
      const user = {
        ...existing,
        name: String(body.name || existing.name || ''),
        email: String(body.email || existing.email || ''),
        phone: String(body.phone || existing.phone || ''),
        address: String(body.address || existing.address || ''),
        city: String(body.city || existing.city || ''),
        area: String(body.area || existing.area || ''),
        landmark: String(body.landmark || existing.landmark || ''),
        photo: String(body.photo || existing.photo || ''),
        updatedAt: new Date().toISOString(),
      };
      await saveDocument('customers', String(body.id), user);
      return NextResponse.json({ user: publicUser(user) });
    }

    if (action === 'reviews') {
      return POST(request);
    }

    return NextResponse.json({ error: 'Unsupported customer action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Customer update failed.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const action = customerAction(request);

  try {
    if (action === 'reviews') {
      const userId = String(request.nextUrl.searchParams.get('userId') || '').trim();
      const productId = String(request.nextUrl.searchParams.get('productId') || '').trim();
      if (!userId || !productId) return NextResponse.json({ error: 'Missing user or product.' }, { status: 400 });

      const id = reviewId(userId, productId);
      await removeDocument(`products/${encodeURIComponent(productId)}/reviews`, id);
      await removeDocument(`customers/${encodeURIComponent(userId)}/reviews`, id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unsupported customer action.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Customer delete failed.' }, { status: 500 });
  }
}
