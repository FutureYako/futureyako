import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;

    // The ultraner forwarder lives at app/api/ultraner/ — should take priority via Next.js routing,
    // but as a safety net, explicitly refuse to forward those paths to Django
    if (path[0] === 'ultraner') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Always add trailing slash — Django's APPEND_SLASH would redirect without it,
    // and fetch follows POST redirects as GET (body lost)
    const target = `${BACKEND_URL}/api/${path.join('/')}/`;

    const url = new URL(target);
    req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

    // Forward all headers except hop-by-hop ones
    const skipReqHeaders = new Set(['host', 'connection', 'transfer-encoding', 'content-length']);
    const headers = new Headers();
    req.headers.forEach((v, k) => {
      if (!skipReqHeaders.has(k.toLowerCase())) headers.set(k, v);
    });
    // Ask backend not to compress — avoids content-encoding mismatch after Node decompresses
    headers.set('accept-encoding', 'identity');

    const method = req.method.toUpperCase();
    const body = ['GET', 'HEAD'].includes(method) ? undefined : await req.arrayBuffer();

    const upstream = await fetch(url.toString(), { method, headers, body });

    // Read as buffer — safer than streaming across runtimes
    const resBody = await upstream.arrayBuffer();

    const skipResHeaders = new Set(['transfer-encoding', 'connection', 'content-encoding']);
    const resHeaders = new Headers();
    upstream.headers.forEach((v, k) => {
      if (!skipResHeaders.has(k.toLowerCase())) resHeaders.set(k, v);
    });

    return new NextResponse(resBody, { status: upstream.status, headers: resHeaders });
  } catch (err) {
    console.error('[proxy]', err);
    return NextResponse.json(
      { error: 'Backend unreachable', detail: String(err) },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
