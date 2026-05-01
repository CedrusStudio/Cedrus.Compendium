import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminApiKeys } from '@/lib/env';

export const API_KEY_HEADER = 'x-api-key';

export function proxy(request: NextRequest) 
{
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api/')) return NextResponse.next();
  if (request.method === "GET") return NextResponse.next();

  const apiKey = request.headers.get(API_KEY_HEADER);
  if (!apiKey) 
  {
    console.warn('⚠️ No API key provided for', request.method, pathname);
    return NextResponse.json({ error: 'Unauthorized', message: 'API key is required' }, { status: 401 });
  }

  if (adminApiKeys.length === 0)
  {
    console.error('❌ NEXT_API_KEYS or NEXT_API_KEY environment variable is not set');
    return NextResponse.json({ error: 'Server Configuration Error', message: 'API authentication not configured' }, { status: 500 });
  }
  
  if (!adminApiKeys.includes(apiKey)) 
  {
    console.warn('🚫 Invalid API key for', request.method, pathname);
    return NextResponse.json({ error: 'Forbidden', message: 'Invalid API key' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all /api/* routes EXCEPT /api/search/*
    '/api/((?!search).*)'
  ],
};
