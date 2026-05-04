import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  const backendUrl = process.env.BACKEND_URL; // Use the backend URL from .env.local
  const apiPath = params.path.join('/'); // Combine the dynamic path segments
  const url = `${backendUrl}/${apiPath}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying request:', error);
    return NextResponse.json({ error: 'Failed to fetch data from backend' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { path: string[] } }) {
  const backendUrl = process.env.BACKEND_URL;
  const apiPath = params.path.join('/');
  const url = `${backendUrl}/${apiPath}`;

  try {
    const body = await req.json();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error proxying request:', error);
    return NextResponse.json({ error: 'Failed to fetch data from backend' }, { status: 500 });
  }
}