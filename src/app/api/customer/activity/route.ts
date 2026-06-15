import { NextRequest, NextResponse } from 'next/server';
import { saveDocument } from '@/lib/firestoreAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Activity save failed.' }, { status: 500 });
  }
}
