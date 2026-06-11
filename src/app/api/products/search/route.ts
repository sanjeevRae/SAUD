import { NextRequest, NextResponse } from 'next/server';
import { getProductsByQuery } from '@/lib/storefront';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const products = await getProductsByQuery({
    q: searchParams.get('q') || undefined,
    category: searchParams.get('category') || undefined,
    gender: searchParams.get('gender') || undefined,
    limit: Number(searchParams.get('limit') || 8),
  });

  return NextResponse.json({ products });
}
