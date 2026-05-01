import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { tagEntityModelMap } from '@/lib/tagEntityModels';

export type ManagedTag = {
  tag: string;
  count: number;
};

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

    // @ts-expect-error Prisma does not type dynamic model access precisely.
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
            _id: '$tags',
            count: { $sum: 1 },
          }
        },
        {
          $project: {
            tag: '$_id',
            count: 1,
            _id: 0,
          }
        },
        {
          $sort: {
            tag: 1,
          }
        }
      ]
    });

    const tags = Array.isArray(result) ? result : [];
    return NextResponse.json(tags as ManagedTag[], { status: 200 });
  }
  catch (error)
  {
    console.error('Error fetching managed tags:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}