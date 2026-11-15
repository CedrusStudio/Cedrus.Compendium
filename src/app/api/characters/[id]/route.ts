import { NextResponse } from 'next/server';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { deleteCharacter } from '@/persistence/characters/charactersRepository';
import { CharacterMembershipError } from '@/persistence/characters/characterMembershipErrors';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const apiKey = getValidatedApiKey(request);
  if (typeof apiKey !== 'string') return apiKey;
  const { id } = await context.params;
  if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
  try {
    await deleteCharacter(id, apiKey);
    return NextResponse.json({ status: 204 });
  } catch (error) {
    if (error instanceof CharacterMembershipError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error('Error deleting character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
