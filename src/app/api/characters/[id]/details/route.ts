import { NextResponse } from 'next/server';
import { updateCharacterDetails } from '@/persistence/characters/charactersRepository';
import { detailsSchema } from '@/persistence/schemas/characters/headerSchema';
import { detailsMembershipSchema } from '@/persistence/schemas/characters/characterMembershipSchema';
import { CharacterMembershipError } from '@/persistence/characters/characterMembershipErrors';
import { CharacterValidationError } from '@/persistence/characters/characterErrors';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';

const schema = detailsSchema.extend({ expectedMembership: detailsMembershipSchema });

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const apiKey = getValidatedApiKey(request);
  if (typeof apiKey !== 'string') return apiKey;
  const { id } = await context.params;
  if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
  const payload = schema.safeParse(await request.json().catch(() => null));
  if (!payload.success) return NextResponse.json({ message: 'Nieprawidłowe dane lub brak migawki repertuaru. Odśwież postać przed zapisem.' }, { status: 400 });
  try {
    const { expectedMembership, ...data } = payload.data;
    const updated = await updateCharacterDetails(id, data, { expectedMembership, apiKey });
    if (!updated) return NextResponse.json({ message: 'Character not found' }, { status: 404 });
    return NextResponse.json({ expectedMembership: updated });
  } catch (error) {
    if (error instanceof CharacterMembershipError) return NextResponse.json({ message: error.message }, { status: error.status });
    if (error instanceof CharacterValidationError) return NextResponse.json({ message: error.message }, { status: 400 });
    console.error('Error updating character details:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
