import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${BACKEND_URL}/api/${path.join('/')}`;

  const url = new URL(target);
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const skipHeaders = new Set(['host', 'connection', 'transfer-encoding']);
  const headers = new Headers();
  req.headers.forEach((v, k) => {
    if (!skipHeaders.has(k.toLowerCase())) headers.set(k, v);
  });

  let body: BodyInit | undefined;
  const method = req.method.toUpperCase();
  if (!['GET', 'HEAD'].includes(method)) {
    body = await req.arrayBuffer();
  }

  const upstream = await fetch(url.toString(), { method, headers, body, duplex: 'half' } as RequestInit);

  const resHeaders = new Headers();
  upstream.headers.forEach((v, k) => {
    const lower = k.toLowerCase();
    if (!['transfer-encoding', 'connection'].includes(lower)) resHeaders.set(k, v);
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
