import { NextResponse } from 'next/server';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { validateFormBody } from '@/app/api/validateFormBody';
import { headerSchema } from '@/persistence/schemas/characters/headerSchema';
import { addCharacter } from '@/persistence/characters/charactersRepository';

export async function POST(request: Request) {
  const apiKey = getValidatedApiKey(request);
  if (typeof apiKey !== 'string') return apiKey;
  const parsed = validateFormBody(await request.json().catch(() => null), headerSchema);
  if (!parsed.success) return parsed.response;
  try {
    const id = await addCharacter(parsed.data);
    return NextResponse.json(id, { status: 201 });
  } catch (error) {
    console.error('Error creating character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
