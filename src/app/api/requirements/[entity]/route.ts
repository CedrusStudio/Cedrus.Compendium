import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RequirementEntityType } from '@/infrastructure/clients/requirementsClient';
import { requirementEntityModelMap } from '@/lib/requirementEntityModels';

export async function GET(request: Request, { params }: { params: Promise<{ entity: string }> })
{
  try
  {
    const { entity } = await params;
    const modelName = requirementEntityModelMap[entity as RequirementEntityType];

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
        { $unwind: '$requirements' },
        {
          $group: {
            _id: null,
            uniqueRequirements: { $addToSet: '$requirements' }
          }
        },
        {
          $project: {
            uniqueRequirements: 1,
            _id: 0
          }
        }
      ]
    });

    const requirements = result[0]?.uniqueRequirements || [];
    const sortedRequirements = Array.isArray(requirements) ? requirements.sort() : [];

    return NextResponse.json(sortedRequirements, { status: 200 });
  }
  catch (error)
  {
    console.error('Error fetching requirements for entity:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}