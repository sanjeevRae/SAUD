import { NextResponse, type NextRequest } from 'next/server';
import { getDocument, listDocuments, saveDocument, removeDocument } from '@/lib/firestoreAdmin';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type CustomerAccount = {
  id: string;
  method: 'email' | 'google' | 'phone';
  email?: string;
  phone?: string;
  name: string;
  photo?: string;
  address?: string;
  city?: string;
  area?: string;
  landmark?: string;
  password?: string;
  firebaseUid?: string;
  createdAt?: string;
  updatedAt?: string;
};

type OrderItem = {
  id?: string;
  name?: string;
  price?: number;
  image?: string;
  category?: string;
  quantity?: number;
  selectedSize?: string;
  linkHref?: string;
};

type CustomerOrder = {
  id: string;
  user?: { id?: string; name?: string; email?: string; phone?: string };
  items?: OrderItem[];
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  deliveryLabel?: string;
  total?: number;
  paymentMethod?: string;
  status?: string;
  shippingAddress?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
};

type ProductReview = {
  id: string;
  userId?: string;
  userName?: string;
  productId?: string;
  productName?: string;
  rating?: number;
  text?: string;
  createdAt?: string;
  updatedAt?: string;
};

type LoginPayload = {
  mode: 'login' | 'register';
  method: 'email' | 'google' | 'phone';
  email?: string;
  phone?: string;
  password?: string;
  name?: string;
  photo?: string;
  firebaseUid?: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function sanitizeUser(account: CustomerAccount) {
  const user = { ...account };
  delete user.password;
  return user;
}

function normalizeIdentity(payload: { method?: string; email?: string; phone?: string; firebaseUid?: string }) {
  if (payload.method === 'google') {
    const seed = payload.firebaseUid || payload.email || 'google-user';
    return `google_${seed.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
  }
  if (payload.method === 'phone') {
    const seed = payload.phone || 'phone-user';
    return `phone_${seed.replace(/[^0-9]+/g, '')}`;
  }
  const seed = payload.email || 'email-user';
  return `email_${seed.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
}

async function upsertAccount(payload: LoginPayload) {
  const id = normalizeIdentity(payload);
  const existing = await getDocument<CustomerAccount>('customers', id);

  if (payload.mode === 'login') {
    if (!existing) {
      const account: CustomerAccount = {
        id,
        method: payload.method,
        email: payload.email,
        phone: payload.phone,
        name: payload.name || payload.email?.split('@')[0] || payload.phone || 'Customer',
        photo: payload.photo,
        firebaseUid: payload.firebaseUid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveDocument('customers', id, account);
      return sanitizeUser(account);
    }

    if (existing.method === 'email' && existing.password && payload.password && existing.password !== payload.password) {
      throw new Error('Invalid email or password.');
    }

    const merged: CustomerAccount = {
      ...existing,
      photo: payload.photo || existing.photo,
      firebaseUid: payload.firebaseUid || existing.firebaseUid,
      updatedAt: new Date().toISOString(),
    };
    await saveDocument('customers', id, merged);
    return sanitizeUser(merged);
  }

  if (existing) {
    throw new Error('Account already exists. Please log in instead.');
  }

  const account: CustomerAccount = {
    id,
    method: payload.method,
    email: payload.email,
    phone: payload.phone,
    name: payload.name || payload.email?.split('@')[0] || payload.phone || 'Customer',
    photo: payload.photo,
    password: payload.method === 'email' ? payload.password : undefined,
    firebaseUid: payload.firebaseUid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveDocument('customers', id, account);
  return sanitizeUser(account);
}

async function updateAccount(request: NextRequest) {
  const payload = await request.json() as Partial<CustomerAccount> & { id?: string };
  if (!payload.id) return jsonError('Customer id is required.');
  const existing = await getDocument<CustomerAccount>('customers', payload.id);
  if (!existing) return jsonError('Account not found.', 404);

  const account: CustomerAccount = {
    ...existing,
    ...payload,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  await saveDocument('customers', payload.id, account);
  return NextResponse.json({ user: sanitizeUser(account) });
}

async function getOrders(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return jsonError('User id is required.');
  const orders = await listDocuments<CustomerOrder>('orders');
  const filtered = orders
    .filter(order => order.user?.id === userId)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return NextResponse.json({ orders: filtered });
}

async function getReviews(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return jsonError('User id is required.');
  const reviews = await listDocuments<ProductReview>('reviews');
  const filtered = reviews
    .filter(review => review.userId === userId)
    .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')));
  return NextResponse.json({ reviews: filtered });
}

async function saveCart(request: NextRequest) {
  const payload = await request.json() as { user?: CustomerAccount; items?: OrderItem[]; totalItems?: number; totalPrice?: number };
  if (!payload.user?.id) return jsonError('Customer id is required.');
  await saveDocument('customerCarts', payload.user.id, {
    userId: payload.user.id,
    items: payload.items,
    totalItems: payload.totalItems,
    totalPrice: payload.totalPrice,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}

async function saveActivity(request: NextRequest) {
  const payload = await request.json() as { user?: CustomerAccount; type?: string; data?: JsonValue; path?: string };
  if (!payload.user?.id || !payload.type) return jsonError('Customer activity payload is invalid.');
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await saveDocument('customerActivity', id, {
    userId: payload.user.id,
    type: payload.type,
    data: payload.data,
    path: payload.path,
    createdAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}

async function checkout(request: NextRequest) {
  const payload = await request.json() as {
    user?: CustomerAccount;
    items?: OrderItem[];
    subtotal?: number;
    deliveryFee?: number;
    deliveryLabel?: string;
    shippingAddress?: Record<string, string>;
    voucherCode?: string;
  };

  if (!payload.user?.id || !payload.items?.length) return jsonError('Checkout payload is incomplete.');

  const subtotal = Number(payload.subtotal || 0);
  const deliveryFee = Number(payload.deliveryFee || 0);
  const discount = payload.voucherCode ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const total = Math.max(0, subtotal - discount + deliveryFee);
  const orderId = `ORD-${Date.now()}`;

  const order: CustomerOrder = {
    id: orderId,
    user: {
      id: payload.user.id,
      name: payload.user.name,
      email: payload.user.email,
      phone: payload.user.phone,
    },
    items: payload.items,
    subtotal,
    discount,
    deliveryFee,
    deliveryLabel: payload.deliveryLabel || 'Standard delivery',
    total,
    paymentMethod: 'Cash on Delivery',
    status: 'pending_cod',
    shippingAddress: payload.shippingAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveDocument('orders', orderId, order);
  await saveDocument('customerCarts', payload.user.id, {
    userId: payload.user.id,
    items: [],
    totalItems: 0,
    totalPrice: 0,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, order });
}

async function createOrUpdateReview(request: NextRequest) {
  const payload = await request.json() as {
    user?: CustomerAccount;
    productId?: string;
    productName?: string;
    rating?: number;
    text?: string;
  };

  if (!payload.user?.id || !payload.productId) return jsonError('Review payload is incomplete.');

  const id = `${payload.user.id}_${payload.productId}`;
  const existing = await getDocument<ProductReview>('reviews', id);
  const review: ProductReview = {
    id,
    userId: payload.user.id,
    userName: payload.user.name,
    productId: payload.productId,
    productName: payload.productName,
    rating: Number(payload.rating || 5),
    text: payload.text || '',
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveDocument('reviews', id, review);
  return NextResponse.json({ ok: true, review });
}

async function deleteReview(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const productId = request.nextUrl.searchParams.get('productId');
  if (!userId || !productId) return jsonError('User id and product id are required.');
  await removeDocument('reviews', `${userId}_${productId}`);
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action');
    if (action === 'orders') return await getOrders(request);
    if (action === 'reviews') return await getReviews(request);
    return jsonError('Unsupported customer action.', 404);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Customer request failed.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action');
    if (action === 'account') {
      const payload = await request.json() as LoginPayload;
      const user = await upsertAccount(payload);
      return NextResponse.json({ user });
    }
    if (action === 'cart') return await saveCart(request);
    if (action === 'activity') return await saveActivity(request);
    if (action === 'checkout') return await checkout(request);
    if (action === 'reviews') return await createOrUpdateReview(request);
    return jsonError('Unsupported customer action.', 404);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Customer request failed.', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action');
    if (action === 'account') return await updateAccount(request);
    return jsonError('Unsupported customer action.', 404);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Customer request failed.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action');
    if (action === 'reviews') return await deleteReview(request);
    return jsonError('Unsupported customer action.', 404);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Customer request failed.', 500);
  }
}
