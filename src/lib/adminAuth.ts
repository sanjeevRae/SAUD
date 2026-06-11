import { NextResponse, type NextRequest } from 'next/server';

export function assertAdmin(request: NextRequest) {
  const token = process.env.ADMIN_ACCESS_TOKEN;
  const provided = request.headers.get('x-admin-token');

  if (!token || token === 'change-this-admin-token' || provided !== token) {
    return NextResponse.json({ error: 'Unauthorized admin request.' }, { status: 401 });
  }

  return null;
}