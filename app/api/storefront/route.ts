import { NextResponse, type NextRequest } from 'next/server';
import { getSocialLinks } from '@/lib/storefront';

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action');
  if (action !== 'socials') return NextResponse.json({ error: 'Unsupported storefront action.' }, { status: 404 });

  try {
    const socialLinks = await getSocialLinks();
    return NextResponse.json({ socialLinks });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Storefront request failed.' }, { status: 500 });
  }
}
