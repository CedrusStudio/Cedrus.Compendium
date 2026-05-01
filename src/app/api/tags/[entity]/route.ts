import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { tagEntityModelMap } from '@/lib/tagEntityModels';

export async function GET(request: Request, { params }: { params: Promise<{ entity: string }> }) 
{
  try 
  {
    const { entity } = await params;
    const modelName = tagEntityModelMap[entity];

    if (!modelName) 
    {
      return NextResponse.json({ message: `Invalid entity: ${entity}` }, { status: 400 });
    }

    // @ts-expect-error - Prisma doesn't have perfect typing for dynamic model access
    const model = prisma[modelName];

    if (!model || !model.aggregateRaw) 
    {
      return NextResponse.json({ message: `Model ${modelName} does not support aggregation` }, { status: 400 });
    }

    const result = await model.aggregateRaw
    ({
      pipeline: [
        { $unwind: '$tags' },
        {
          $group: {
            _id: null,
            uniqueTags: { $addToSet: '$tags' }
          }
        },
        {
          $project: {
            uniqueTags: 1,
            _id: 0
          }
        }
      ]
    });

    const tags = result[0]?.uniqueTags || [];
    
    // Sort alphabetically
    const sortedTags = Array.isArray(tags) ? tags.sort() : [];
    return NextResponse.json(sortedTags, { status: 200 });
  } 
  catch (error) 
  {
    console.error(`Error fetching tags for entity:`, error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
