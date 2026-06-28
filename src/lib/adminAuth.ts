import { NextResponse, type NextRequest } from 'next/server';
import { getDocument } from '@/lib/firestoreAdmin';

type AdminCustomer = { id: string; role?: string };

export async function assertAdmin(request: NextRequest) {
  const customerId = request.headers.get('x-customer-id');

  if (!customerId) {
    return NextResponse.json({ error: 'Unauthorized admin request.' }, { status: 401 });
  }

  const account = await getDocument<AdminCustomer>('customers', customerId);

  if (!account || account.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized admin request.' }, { status: 401 });
  }

  return null;
}