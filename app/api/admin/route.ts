import { NextResponse, type NextRequest } from 'next/server';
import { assertAdmin } from '@/lib/adminAuth';
import { createProduct, deleteProduct, getDocument, listDocuments, removeDocument, saveDocument, updateProduct } from '@/lib/firestoreAdmin';
import type { Product } from '@/data/products';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type PlainRecord = Record<string, JsonValue | undefined>;

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

type OrderRecord = {
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

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function toProduct(payload: Record<string, unknown>) {
  return payload as unknown as Product;
}

async function getProducts() {
  const products = await listDocuments<Product>('products');
  return NextResponse.json({ products });
}

async function createNewProduct(request: NextRequest) {
  const payload = await request.json() as Record<string, unknown>;
  const product = toProduct(payload);
  if (!product?.id || !product?.name) return jsonError('Product id and name are required.');
  await createProduct(product);
  return NextResponse.json({ ok: true, product });
}

async function updateExistingProduct(request: NextRequest) {
  const payload = await request.json() as Record<string, unknown>;
  const product = toProduct(payload);
  if (!product?.id) return jsonError('Product id is required.');
  await updateProduct(product);
  return NextResponse.json({ ok: true, product });
}

async function removeProduct(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return jsonError('Product id is required.');
  await deleteProduct(id);
  return NextResponse.json({ ok: true, id });
}

async function getOrders() {
  const orders = await listDocuments<OrderRecord>('orders');
  const sorted = orders.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return NextResponse.json({ orders: sorted });
}

async function updateOrder(request: NextRequest) {
  const payload = await request.json() as Partial<OrderRecord> & { id?: string; status?: string };
  if (!payload.id || !payload.status) return jsonError('Order id and status are required.');

  const existing = await getDocument<OrderRecord>('orders', payload.id);
  if (!existing) return jsonError('Order not found.', 404);

  const order: OrderRecord = {
    ...existing,
    status: payload.status,
    updatedAt: new Date().toISOString(),
  };

  await saveDocument('orders', payload.id, order);
  return NextResponse.json({ ok: true, order });
}

async function getCms(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');
  if (!path) return jsonError('CMS path is required.');
  const items = await listDocuments<PlainRecord>(path);
  return NextResponse.json({ items });
}

async function putCms(request: NextRequest) {
  const payload = await request.json() as { path?: string; id?: string; data?: PlainRecord };
  if (!payload.path || !payload.id || !payload.data) return jsonError('CMS path, id, and data are required.');
  await saveDocument(payload.path, payload.id, payload.data);
  return NextResponse.json({ ok: true, id: payload.id });
}

async function deleteCms(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');
  const id = request.nextUrl.searchParams.get('id');
  if (!path || !id) return jsonError('CMS path and id are required.');
  await removeDocument(path, id);
  return NextResponse.json({ ok: true, id });
}

export async function GET(request: NextRequest) {
  const unauthorized = await assertAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const action = request.nextUrl.searchParams.get('action');
    if (action === 'products') return await getProducts();
    if (action === 'orders') return await getOrders();
    if (action === 'cms') return await getCms(request);
    return jsonError('Unsupported admin action.', 404);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Admin request failed.', 500);
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await assertAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const action = request.nextUrl.searchParams.get('action');
    if (action === 'products') return await createNewProduct(request);
    return jsonError('Unsupported admin action.', 404);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Admin request failed.', 500);
  }
}

export async function PUT(request: NextRequest) {
  const unauthorized = await assertAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const action = request.nextUrl.searchParams.get('action');
    if (action === 'products') return await updateExistingProduct(request);
    if (action === 'cms') return await putCms(request);
    return jsonError('Unsupported admin action.', 404);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Admin request failed.', 500);
  }
}

export async function PATCH(request: NextRequest) {
  const unauthorized = await assertAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const action = request.nextUrl.searchParams.get('action');
    if (action === 'orders') return await updateOrder(request);
    return jsonError('Unsupported admin action.', 404);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Admin request failed.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await assertAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const action = request.nextUrl.searchParams.get('action');
    if (action === 'products') return await removeProduct(request);
    if (action === 'cms') return await deleteCms(request);
    return jsonError('Unsupported admin action.', 404);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Admin request failed.', 500);
  }
}
