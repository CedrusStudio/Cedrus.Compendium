import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RequirementEntityType } from '@/infrastructure/clients/requirementsClient';
import { requirementEntityModelMap } from '@/lib/requirementEntityModels';
import { requirementSchema } from '@/persistence/schemas/requirementSchema';

export type ManagedStructuredRequirement = {
  requirement: import('@/domain/requirements/Requirement').Requirement;
  count: number;
};

type AggregatedRow = {
  kind?: string;
  group?: string;
  targetKey?: string;
  value?: number;
  text?: string;
  options?: unknown;
  targets?: unknown;
  count?: number;
};

/** Rebuild the stored requirement from one aggregated row, per variant. */
function toCandidate(row: AggregatedRow): unknown
{
  switch (row.kind)
  {
    case 'rankless':
      return { kind: 'rankless', text: row.text };
    case 'anyOf':
      return { kind: 'anyOf', options: row.options };
    case 'sum':
      return { kind: 'sum', targets: row.targets, value: row.value };
    default:
      return { kind: 'ranked', group: row.group, targetKey: row.targetKey, value: row.value };
  }
}

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

    const result = await model.aggregateRaw({
      pipeline: [
        { $unwind: '$structuredRequirements' },
        {
          $group: {
            _id: {
              kind: '$structuredRequirements.kind',
              group: '$structuredRequirements.group',
              targetKey: '$structuredRequirements.targetKey',
              value: '$structuredRequirements.value',
              text: '$structuredRequirements.text',
              // Wave 7: without these the composite variants group into a row
              // with no distinguishing fields, fail schema validation and get
              // dropped — invisible in the admin panel, with no error anywhere.
              options: '$structuredRequirements.options',
              targets: '$structuredRequirements.targets',
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            kind: '$_id.kind',
            group: '$_id.group',
            targetKey: '$_id.targetKey',
            value: '$_id.value',
            text: '$_id.text',
            options: '$_id.options',
            targets: '$_id.targets',
            count: 1,
          },
        },
      ],
    });

    const rows = (Array.isArray(result) ? result as AggregatedRow[] : [])
      .map((row): ManagedStructuredRequirement | null => {
        const candidate = toCandidate(row);
        const parsed = requirementSchema.safeParse(candidate);
        return parsed.success ? { requirement: parsed.data, count: row.count ?? 0 } : null;
      })
      .filter((row): row is ManagedStructuredRequirement => row !== null);

    return NextResponse.json(rows, { status: 200 });
  }
  catch (error)
  {
    console.error('Error fetching structured requirements:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
