import { NextResponse } from 'next/server';
import { adminApiKeys } from '@/lib/env';
import { hashApiKey } from '@/lib/apiKeyHash';
import prisma from '@/lib/prisma';
import { sanitizeProfile } from '@/persistence/slices/personalizationSlice';
import { API_KEY_HEADER } from '@/proxy';

function getValidatedApiKey(request: Request): string | Response
{
  const apiKey = request.headers.get(API_KEY_HEADER)?.trim();

  if (!apiKey) 
  {
    return NextResponse.json({ error: 'Missing API key.' }, { status: 401 });
  }

  if (!adminApiKeys.includes(apiKey)) 
  {
    return NextResponse.json({ error: 'Invalid API key.' }, { status: 403 });
  }

  return apiKey;
}

export async function GET(request: Request)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') 
  {
    return apiKeyOrResponse;
  }

  try 
  {
    const record = await prisma.personalizationProfileRecord.findUnique
    ({
      where: { apiKeyHash: hashApiKey(apiKeyOrResponse) }
    });

    if (!record) 
    {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(sanitizeProfile(JSON.parse(record.profile)), { status: 200 });
  } 
  catch 
  {
    return NextResponse.json({ error: 'Failed to load personalization profile.' }, { status: 500 });
  }
}

export async function PUT(request: Request)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') 
  {
    return apiKeyOrResponse;
  }

  let profilePayload: unknown;

  try 
  {
    profilePayload = await request.json();
  } 
  catch 
  {
    return NextResponse.json({ error: 'Invalid personalization payload.' }, { status: 400 });
  }

  const profile = sanitizeProfile(profilePayload);

  try 
  {
    await prisma.personalizationProfileRecord.upsert
    ({
      where: { apiKeyHash: hashApiKey(apiKeyOrResponse) },
      update: { profile: JSON.stringify(profile) },
      create: { 
        apiKeyHash: hashApiKey(apiKeyOrResponse),
        profile: JSON.stringify(profile),
      },
    });

    return NextResponse.json(profile, { status: 200 });
  } 
  catch 
  {
    return NextResponse.json({ error: 'Failed to save personalization profile.' }, { status: 500 });
  }
}