import { NextRequest, NextResponse } from 'next/server';

const ULTRANER_API_KEY = process.env.ULTRANER_API_KEY ?? '';
const FORWARDER_SECRET = process.env.FORWARDER_SECRET ?? '';
const ULTRANER_BASE = 'https://api.ultraner.com';

// Django calls this route when it can't reach Ultraner directly (e.g. PythonAnywhere proxy restrictions).
// Next.js/Vercel has unrestricted outbound internet, so it forwards to Ultraner on Django's behalf.
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (FORWARDER_SECRET && req.headers.get('x-forwarder-secret') !== FORWARDER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { path } = await params;
    const url = `${ULTRANER_BASE}/${path.join('/')}`;
    const body = await req.arrayBuffer();

    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ULTRANER_API_KEY,
      },
      body,
    });

    const resBody = await upstream.arrayBuffer();
    return new NextResponse(resBody, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[ultraner-forwarder]', err);
    return NextResponse.json({ error: 'Forward failed', detail: String(err) }, { status: 502 });
  }
}
