import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirementEntityModelMap, isValidRequirementValue } from '@/lib/requirementEntityModels';

type RequirementDeleteBody = {
  entity?: string;
  requirement?: string;
};

type RequirementBearingEntity = {
  id: string;
  requirements: string[];
};

export async function POST(request: Request)
{
  try
  {
    const body = await request.json() as RequirementDeleteBody;
    const entity = body.entity?.trim() ?? '';
    const requirement = body.requirement?.trim() ?? '';
    const modelName = requirementEntityModelMap[entity as keyof typeof requirementEntityModelMap];

    if (!modelName)
    {
      return NextResponse.json({ message: `Invalid entity: ${entity}` }, { status: 400 });
    }

    if (!requirement)
    {
      return NextResponse.json({ message: 'requirement is required' }, { status: 400 });
    }

    if (!isValidRequirementValue(requirement))
    {
      return NextResponse.json({ message: 'Requirements must contain between 1 and 1000 characters' }, { status: 400 });
    }

    // @ts-expect-error Prisma does not type dynamic model access precisely.
    const model = prisma[modelName];

    const affectedEntities = await model.findMany({
      where: { requirements: { has: requirement } },
      select: { id: true, requirements: true },
    }) as RequirementBearingEntity[];

    await Promise.all(
      affectedEntities.map(entityRecord => model.update({
        where: { id: entityRecord.id },
        data: {
          requirements: entityRecord.requirements.filter(existingRequirement => existingRequirement !== requirement),
        },
      })),
    );

    return NextResponse.json({ updatedCount: affectedEntities.length }, { status: 200 });
  }
  catch (error)
  {
    console.error('Error deleting managed requirement:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}