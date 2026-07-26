import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requirementEntityModelMap } from '@/lib/requirementEntityModels';
import { requirementSchema } from '@/persistence/schemas/requirementSchema';
import { replaceStructuredRequirement, requirementElemMatch } from '@/domain/requirements/structuredRequirementOps';
import type { Requirement } from '@/domain/requirements/Requirement';

type EditBody = { entity?: string; original?: unknown; replacement?: unknown; replacements?: unknown };

type RawRecord = { _id: string; structuredRequirements?: Requirement[] | null };

const toElemMatch = requirementElemMatch;

export async function POST(request: Request)
{
  try
  {
    const body = await request.json() as EditBody;
    const entity = body.entity?.trim() ?? '';
    const modelName = requirementEntityModelMap[entity as keyof typeof requirementEntityModelMap];

    if (!modelName)
    {
      return NextResponse.json({ message: `Invalid entity: ${entity}` }, { status: 400 });
    }

    const original = requirementSchema.safeParse(body.original);

    // `replacements` (an array) lets the admin split one requirement into
    // several; `replacement` stays accepted so older callers keep working.
    const rawReplacements = Array.isArray(body.replacements)
      ? body.replacements
      : body.replacement === undefined ? [] : [body.replacement];

    const replacements = z.array(requirementSchema).min(1).safeParse(rawReplacements);

    // Say WHICH side failed and why. The old catch-all message left the admin
    // sheet with nothing actionable to show.
    if (!original.success || !replacements.success)
    {
      const failing = original.success ? replacements.error : original.error;
      const side = original.success ? 'replacement' : 'original';
      const details = failing!.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ');

      console.error(`Invalid ${side} requirement`, JSON.stringify(original.success ? rawReplacements : body.original));

      return NextResponse.json({ message: `Nieprawidłowe wymaganie (${side}) — ${details}` }, { status: 400 });
    }

    // @ts-expect-error Prisma does not type dynamic model access precisely.
    const model = prisma[modelName];

    const raw = await model.findRaw({
      filter: { structuredRequirements: { $elemMatch: toElemMatch(original.data as Requirement) } },
      options: { projection: { _id: 1, structuredRequirements: 1 } },
    });
    const records = (Array.isArray(raw) ? raw : []) as RawRecord[];

    await Promise.all(
      records.map((record) => {
        const next = replaceStructuredRequirement(record.structuredRequirements, original.data as Requirement, replacements.data as Requirement[]);
        return model.update({ where: { id: record._id }, data: { structuredRequirements: next } });
      }),
    );

    return NextResponse.json({ updatedCount: records.length }, { status: 200 });
  }
  catch (error)
  {
    console.error('Error editing structured requirement:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
