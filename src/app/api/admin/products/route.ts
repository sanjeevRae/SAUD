import { NextResponse, type NextRequest } from 'next/server';
import type { Product } from '@/data/products';
import { assertAdmin } from '@/lib/adminAuth';
import { createProduct } from '@/lib/firestoreAdmin';
import { getProductsByQuery } from '@/lib/storefront';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  const products = await getProductsByQuery({ limit: 200 });
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const denied = assertAdmin(request);
  if (denied) return denied;

  try {
    const product = await request.json() as Product;
    await createProduct(product);
    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Product create failed.' }, { status: 500 });
  }
}