export const dynamic = 'force-static';

export async function GET() {
  return Response.json({ error: 'Disabled on this deployment.' }, { status: 404 });
}

export async function POST() {
  return Response.json({ error: 'Disabled on this deployment.' }, { status: 404 });
}

export async function PUT() {
  return Response.json({ error: 'Disabled on this deployment.' }, { status: 404 });
}

export async function PATCH() {
  return Response.json({ error: 'Disabled on this deployment.' }, { status: 404 });
}

export async function DELETE() {
  return Response.json({ error: 'Disabled on this deployment.' }, { status: 404 });
}
