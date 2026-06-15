export const dynamic = 'force-static';

export async function GET() {
  return Response.json({ error: 'Disabled on this deployment.' }, { status: 404 });
}
