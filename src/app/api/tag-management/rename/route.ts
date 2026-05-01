import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidTag } from '@/domain/Tag';
import { tagEntityModelMap } from '@/lib/tagEntityModels';

type TagMutationBody = {
  entity?: string;
  oldTag?: string;
  newTag?: string;
};

type TaggableEntity = {
  id: string;
  tags: string[];
};

export async function POST(request: Request)
{
  try
  {
    const body = await request.json() as TagMutationBody;
    const entity = body.entity?.trim() ?? '';
    const oldTag = body.oldTag?.trim() ?? '';
    const newTag = body.newTag?.trim() ?? '';
    const modelName = tagEntityModelMap[entity];

    if (!modelName)
    {
      return NextResponse.json({ message: `Invalid entity: ${entity}` }, { status: 400 });
    }

    if (!oldTag || !newTag)
    {
      return NextResponse.json({ message: 'Both oldTag and newTag are required' }, { status: 400 });
    }

    if (!isValidTag(oldTag) || !isValidTag(newTag))
    {
      return NextResponse.json({ message: 'Tags must be lowercase single words' }, { status: 400 });
    }

    if (oldTag === newTag)
    {
      return NextResponse.json({ message: 'newTag must be different from oldTag' }, { status: 400 });
    }

    // @ts-expect-error Prisma does not type dynamic model access precisely.
    const model = prisma[modelName];

    const affectedEntities = await model.findMany({
      where: { tags: { has: oldTag } },
      select: { id: true, tags: true },
    }) as TaggableEntity[];

    await Promise.all(
      affectedEntities.map(entityRecord => model.update({
        where: { id: entityRecord.id },
        data: {
          tags: Array.from(new Set(entityRecord.tags.map(tag => tag === oldTag ? newTag : tag))),
        },
      })),
    );

    return NextResponse.json({ updatedCount: affectedEntities.length }, { status: 200 });
  }
  catch (error)
  {
    console.error('Error renaming managed tag:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}