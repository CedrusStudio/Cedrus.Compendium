import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { RequirementEntityType } from '@/infrastructure/clients/requirementsClient';
import { requirementEntityModelMap } from '@/lib/requirementEntityModels';
import { basicTalents, uniqueTalents } from '@/domain/characters/Talent';

type GroupedName = { _id?: unknown };

function toNames(result: unknown): string[]
{
  return (Array.isArray(result) ? result as GroupedName[] : [])
    .map((row) => row._id)
    .filter((name): name is string => typeof name === 'string');
}

/**
 * Talents ("umiejętności") are embedded on characters, not a collection, so
 * `requirementEntityModelMap` cannot reach them. The suggestion list is the
 * canonical `basicTalents` roster from the domain UNION whatever players have
 * actually written on their sheets — a custom talent should be pickable as a
 * requirement target, and a typo'd one showing up here is the accepted cost.
 */
async function talentNames(): Promise<string[]>
{
  const authored = toNames(await prisma.character.aggregateRaw({
    pipeline: [
      { $unwind: '$talents' },
      { $group: { _id: '$talents.name' } },
      { $sort: { _id: 1 } },
    ],
  }));

  const canonical = [...basicTalents, ...uniqueTalents].map((talent) => talent.name);

  return Array.from(new Set([...canonical, ...authored])).sort((left, right) => left.localeCompare(right));
}

/**
 * Distinct entity names for one compendium collection — powers the entity-name
 * autocomplete in the requirement picker/filter. Grade-agnostic (a name can
 * span several grades; requirements target the name only).
 */
export async function GET(request: Request, { params }: { params: Promise<{ entity: string }> })
{
  try
  {
    const { entity } = await params;

    // Branch before the model map — talents have no collection of their own.
    if (entity === 'talents')
    {
      return NextResponse.json(await talentNames(), { status: 200 });
    }

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
        { $group: { _id: '$name' } },
        { $sort: { _id: 1 } },
      ],
    });

    return NextResponse.json(toNames(result), { status: 200 });
  }
  catch (error)
  {
    console.error('Error fetching entity names:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
