import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirementEntityModelMap } from '@/lib/requirementEntityModels';
import { requirementSchema } from '@/persistence/schemas/requirementSchema';
import { removeStructuredRequirement, requirementElemMatch } from '@/domain/requirements/structuredRequirementOps';
import type { Requirement } from '@/domain/requirements/Requirement';

type DeleteBody = { entity?: string; requirement?: unknown };

type RawRecord = { _id: string; structuredRequirements?: Requirement[] | null };

const toElemMatch = requirementElemMatch;

export async function POST(request: Request)
{
  try
  {
    const body = await request.json() as DeleteBody;
    const entity = body.entity?.trim() ?? '';
    const modelName = requirementEntityModelMap[entity as keyof typeof requirementEntityModelMap];

    if (!modelName)
    {
      return NextResponse.json({ message: `Invalid entity: ${entity}` }, { status: 400 });
    }

    const parsed = requirementSchema.safeParse(body.requirement);
    if (!parsed.success)
    {
      return NextResponse.json({ message: 'Invalid requirement' }, { status: 400 });
    }

    const requirement = parsed.data as Requirement;

    // @ts-expect-error Prisma does not type dynamic model access precisely.
    const model = prisma[modelName];

    const raw = await model.findRaw({
      filter: { structuredRequirements: { $elemMatch: toElemMatch(requirement) } },
      options: { projection: { _id: 1, structuredRequirements: 1 } },
    });
    const records = (Array.isArray(raw) ? raw : []) as RawRecord[];

    await Promise.all(
      records.map((record) => {
        const next = removeStructuredRequirement(record.structuredRequirements, requirement);
        return model.update({ where: { id: record._id }, data: { structuredRequirements: next } });
      }),
    );

    return NextResponse.json({ updatedCount: records.length }, { status: 200 });
  }
  catch (error)
  {
    console.error('Error deleting structured requirement:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
