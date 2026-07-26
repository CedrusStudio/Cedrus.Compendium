import { type NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from "@/lib/prisma";
import { API_KEY_HEADER } from '@/proxy';
import { characterVisibilityWhere } from '@/persistence/characterVisibility';
import { OWNING_ENTITY_ID_FIELDS, isOwningEntity } from '@/common/global/owningEntity';

/**
 * Reverse lookup: characters that own a given compendium element.
 * GET /api/characters/owning?entity=maneuvers&id=<elementId>
 * Respects the caller's character visibility (api key).
 */
export async function GET(request: NextRequest)
{
  try
  {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    const id = searchParams.get('id');

    if (!entity || !isOwningEntity(entity))
    {
      return NextResponse.json({ message: 'Unknown or missing entity' }, { status: 400 });
    }
    if (!id)
    {
      return NextResponse.json({ message: 'Missing id' }, { status: 400 });
    }

    const apiKey = request.headers.get(API_KEY_HEADER);
    const idsField = OWNING_ENTITY_ID_FIELDS[entity];

    const where: Prisma.CharacterWhereInput = {
      AND: [
        { [idsField]: { has: id } } as Prisma.CharacterWhereInput,
        characterVisibilityWhere(apiKey) as Prisma.CharacterWhereInput,
      ],
    };

    const characters = await prisma.character.findMany({
      where,
      select: { id: true, name: true, shortName: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(characters, { status: 200 });
  }
  catch (error)
  {
    console.error('Error resolving owning characters:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
