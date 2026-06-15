export const dynamic = 'force-static';

export async function POST() {
  return Response.json({ error: 'Disabled on this deployment.' }, { status: 404 });
}
