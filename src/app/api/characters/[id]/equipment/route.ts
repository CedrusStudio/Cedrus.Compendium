import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { CharacterMembershipError } from '@/persistence/characters/characterMembershipErrors';
import { validateFormBody } from "@/app/api/validateFormBody";
import { equipmentSchema } from "@/persistence/schemas/characters/equipment/equipmentSchema";
import { type NextRequest, NextResponse } from 'next/server';
import { updateCharacterEquipment } from '@/persistence/characters/charactersRepository';

type RouteParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, segmentData: { params: RouteParams })
{
  const apiKey = getValidatedApiKey(request);
  if (typeof apiKey !== 'string') return apiKey;

  try
  {
    const { id } = await segmentData.params;
    if (!id) return NextResponse.json({ message: 'Character ID is required' }, { status: 400 });
    const parsed = validateFormBody(await request.json().catch(() => null), equipmentSchema);
    if (!parsed.success) return parsed.response;
    const updated = await updateCharacterEquipment(id, parsed.data, apiKey);
    if (!updated) return NextResponse.json({ message: 'Character not found' }, { status: 404 });
    return NextResponse.json({ status: 200 });
  } 
  catch (error) 
  {
    if (error instanceof CharacterMembershipError) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error('Error fetching character:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};