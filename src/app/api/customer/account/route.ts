import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getDocument, saveDocument } from '@/lib/firestoreAdmin';

export const dynamic = 'force-dynamic';

type CustomerRecord = Record<string, string | number | boolean | null | string[] | undefined>;

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

export async function POST(request: NextRequest) {
  try {
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
    const existing = await getDocument<CustomerRecord>('customers', id);

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
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Account failed.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: 'Missing user id.' }, { status: 400 });
    const existing = await getDocument<CustomerRecord>('customers', String(body.id));
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
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Profile update failed.' }, { status: 500 });
  }
}



