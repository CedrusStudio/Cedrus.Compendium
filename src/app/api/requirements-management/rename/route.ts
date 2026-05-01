import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirementEntityModelMap, isValidRequirementValue } from '@/lib/requirementEntityModels';

type RequirementMutationBody = {
  entity?: string;
  oldRequirement?: string;
  newRequirement?: string;
};

type RequirementBearingEntity = {
  id: string;
  requirements: string[];
};

export async function POST(request: Request)
{
  try
  {
    const body = await request.json() as RequirementMutationBody;
    const entity = body.entity?.trim() ?? '';
    const oldRequirement = body.oldRequirement?.trim() ?? '';
    const newRequirement = body.newRequirement?.trim() ?? '';
    const modelName = requirementEntityModelMap[entity as keyof typeof requirementEntityModelMap];

    if (!modelName)
    {
      return NextResponse.json({ message: `Invalid entity: ${entity}` }, { status: 400 });
    }

    if (!oldRequirement || !newRequirement)
    {
      return NextResponse.json({ message: 'Both oldRequirement and newRequirement are required' }, { status: 400 });
    }

    if (!isValidRequirementValue(oldRequirement) || !isValidRequirementValue(newRequirement))
    {
      return NextResponse.json({ message: 'Requirements must contain between 1 and 1000 characters' }, { status: 400 });
    }

    if (oldRequirement === newRequirement)
    {
      return NextResponse.json({ message: 'newRequirement must be different from oldRequirement' }, { status: 400 });
    }

    // @ts-expect-error Prisma does not type dynamic model access precisely.
    const model = prisma[modelName];

    const affectedEntities = await model.findMany({
      where: { requirements: { has: oldRequirement } },
      select: { id: true, requirements: true },
    }) as RequirementBearingEntity[];

    await Promise.all(
      affectedEntities.map(entityRecord => model.update({
        where: { id: entityRecord.id },
        data: {
          requirements: Array.from(new Set(entityRecord.requirements.map(requirement => requirement === oldRequirement ? newRequirement : requirement))),
        },
      })),
    );

    return NextResponse.json({ updatedCount: affectedEntities.length }, { status: 200 });
  }
  catch (error)
  {
    console.error('Error renaming managed requirement:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}