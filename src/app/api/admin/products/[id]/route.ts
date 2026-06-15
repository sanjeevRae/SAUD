import { NextResponse, type NextRequest } from 'next/server';
import type { Product } from '@/data/products';
import { assertAdmin } from '@/lib/adminAuth';
import { deleteProduct, updateProduct } from '@/lib/firestoreAdmin';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const product = await request.json() as Product;
    await updateProduct({ ...product, id });
    return NextResponse.json({ product: { ...product, id } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Product update failed.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Product delete failed.' }, { status: 500 });
  }
}