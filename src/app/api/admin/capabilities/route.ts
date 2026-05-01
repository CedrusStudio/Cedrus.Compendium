import { NextResponse } from 'next/server';
import { adminApiKeys } from '@/lib/env';
import { API_KEY_HEADER } from '@/proxy';

export async function GET(request: Request)
{
  const apiKey = request.headers.get(API_KEY_HEADER);

  return NextResponse.json({
    isAdmin: Boolean(apiKey && adminApiKeys.includes(apiKey)),
  }, { status: 200 });
}