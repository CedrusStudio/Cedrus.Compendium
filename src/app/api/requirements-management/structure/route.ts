import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirementEntityModelMap, isValidRequirementValue } from '@/lib/requirementEntityModels';
import { requirementSchema } from '@/persistence/schemas/requirementSchema';
import { applyStructuredRequirement } from '@/domain/requirements/applyStructuredRequirement';
import type { Requirement } from '@/domain/requirements/Requirement';

type StructureBody = {
  entity?: string;
  requirementText?: string;
  requirement?: unknown;
};

type RequirementBearingRecord = {
  id: string;
  requirements: string[];
  structuredRequirements: unknown;
};

export async function POST(request: Request)
{
  try
  {
    const body = await request.json() as StructureBody;
    const entity = body.entity?.trim() ?? '';
    const requirementText = body.requirementText?.trim() ?? '';
    const modelName = requirementEntityModelMap[entity as keyof typeof requirementEntityModelMap];

    if (!modelName)
    {
      return NextResponse.json({ message: `Invalid entity: ${entity}` }, { status: 400 });
    }

    if (!requirementText || !isValidRequirementValue(requirementText))
    {
      return NextResponse.json({ message: 'requirementText must contain between 1 and 1000 characters' }, { status: 400 });
    }

    const parsed = requirementSchema.safeParse(body.requirement);
    if (!parsed.success)
    {
      return NextResponse.json({ message: 'Invalid structured requirement', issues: parsed.error.issues }, { status: 400 });
    }

    const requirement = parsed.data as Requirement;

    // @ts-expect-error Prisma does not type dynamic model access precisely.
    const model = prisma[modelName];

    const affectedRecords = await model.findMany({
      where: { requirements: { has: requirementText } },
      select: { id: true, requirements: true, structuredRequirements: true },
    }) as RequirementBearingRecord[];

    await Promise.all(
      affectedRecords.map((record) => {
        const next = applyStructuredRequirement(
          {
            requirements: record.requirements,
            structuredRequirements: Array.isArray(record.structuredRequirements)
              ? (record.structuredRequirements as Requirement[])
              : [],
          },
          requirementText,
          requirement,
        );

        return model.update({
          where: { id: record.id },
          data: {
            requirements: next.requirements,
            structuredRequirements: next.structuredRequirements,
          },
        });
      }),
    );

    return NextResponse.json({ updatedCount: affectedRecords.length }, { status: 200 });
  }
  catch (error)
  {
    console.error('Error structuring requirement:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
