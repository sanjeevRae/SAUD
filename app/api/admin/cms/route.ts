import { NextResponse, type NextRequest } from 'next/server';
import { assertAdmin } from '@/lib/adminAuth';
import { listDocuments, removeDocument, saveDocument } from '@/lib/firestoreAdmin';

export async function GET(request: NextRequest) {
  const denied = assertAdmin(request); if (denied) return denied;
  const path = request.nextUrl.searchParams.get('path');
  if (!path) return NextResponse.json({ error: 'Missing path.' }, { status: 400 });
  try { return NextResponse.json({ items: await listDocuments(path) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'List failed.' }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  const denied = assertAdmin(request); if (denied) return denied;
  try {
    const body = await request.json() as { path: string; id: string; data: Record<string, unknown> };
    await saveDocument(body.path, body.id, body.data as never);
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Save failed.' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const denied = assertAdmin(request); if (denied) return denied;
  const path = request.nextUrl.searchParams.get('path');
  const id = request.nextUrl.searchParams.get('id');
  if (!path || !id) return NextResponse.json({ error: 'Missing path or id.' }, { status: 400 });
  try { await removeDocument(path, id); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Delete failed.' }, { status: 500 }); }
}