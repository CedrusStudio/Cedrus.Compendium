import { NextResponse } from 'next/server';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { characterMembershipSchema, membershipParamsSchema } from '@/persistence/schemas/characters/characterMembershipSchema';
import { setCharacterMembership } from '@/persistence/characters/characterMembershipRepository';
import { CharacterMembershipError } from '@/persistence/characters/characterMembershipErrors';

export async function PUT(request: Request, context: { params: Promise<{ id: string; kind: string; entityId: string }> }) {
  const apiKey = getValidatedApiKey(request);
  if (typeof apiKey !== 'string') return apiKey;
  const params = membershipParamsSchema.safeParse(await context.params);
  const body = characterMembershipSchema.safeParse(await request.json().catch(() => null));
  if (!params.success || !body.success) return NextResponse.json({ message: 'Nieprawidłowe dane przypisania.' }, { status: 400 });
  try {
    const { id, kind, entityId } = params.data;
    return NextResponse.json(await setCharacterMembership(id, kind, entityId, body.data.present, apiKey));
  } catch (error) {
    if (error instanceof CharacterMembershipError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error('Error updating character membership:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
