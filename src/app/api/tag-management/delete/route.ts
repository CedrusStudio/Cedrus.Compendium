import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidTag } from '@/domain/Tag';
import { tagEntityModelMap } from '@/lib/tagEntityModels';

type TagDeleteBody = {
  entity?: string;
  tag?: string;
};

type TaggableEntity = {
  id: string;
  tags: string[];
};

export async function POST(request: Request)
{
  try
  {
    const body = await request.json() as TagDeleteBody;
    const entity = body.entity?.trim() ?? '';
    const tag = body.tag?.trim() ?? '';
    const modelName = tagEntityModelMap[entity];

    if (!modelName)
    {
      return NextResponse.json({ message: `Invalid entity: ${entity}` }, { status: 400 });
    }

    if (!tag)
    {
      return NextResponse.json({ message: 'tag is required' }, { status: 400 });
    }

    if (!isValidTag(tag))
    {
      return NextResponse.json({ message: 'Tags must be lowercase single words' }, { status: 400 });
    }

    // @ts-expect-error Prisma does not type dynamic model access precisely.
    const model = prisma[modelName];

    const affectedEntities = await model.findMany({
      where: { tags: { has: tag } },
      select: { id: true, tags: true },
    }) as TaggableEntity[];

    await Promise.all(
      affectedEntities.map(entityRecord => model.update({
        where: { id: entityRecord.id },
        data: {
          tags: entityRecord.tags.filter(existingTag => existingTag !== tag),
        },
      })),
    );

    return NextResponse.json({ updatedCount: affectedEntities.length }, { status: 200 });
  }
  catch (error)
  {
    console.error('Error deleting managed tag:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}