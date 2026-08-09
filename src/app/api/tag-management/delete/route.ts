import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidTag } from '@/domain/Tag';
import { tagEntityModelMap } from '@/lib/tagEntityModels';
import { deleteTagEverywhere } from '@/persistence/tags/deleteTagEverywhere';
import type { TagRenameClient } from '@/persistence/tags/renameTagEverywhere';

type TagDeleteBody = {
  entity?: string;
  tag?: string;
  /** Report what would be removed without writing anything. */
  dryRun?: boolean;
};

/**
 * Wave 10.2: a delete now sweeps the personalization profiles too, removes the
 * orphaned `TagDefinition` once the tag is gone everywhere, and reports the
 * names of the affected records — a delete leaves no other trace of what it
 * removed. `count` requirements pointing at the tag are counted, not edited:
 * what to do with an unsatisfiable requirement is a content decision.
 */
export async function POST(request: Request)
{
  try
  {
    const body = await request.json() as TagDeleteBody;
    const entity = body.entity?.trim() ?? '';
    const tag = body.tag?.trim() ?? '';
    const dryRun = body.dryRun === true;

    if (!tagEntityModelMap[entity])
    {
      return NextResponse.json({ message: `Invalid entity: ${entity}` }, { status: 400 });
    }

    if (!tag)
    {
      return NextResponse.json({ message: 'tag is required' }, { status: 400 });
    }

    if (!isValidTag(tag))
    {
      return NextResponse.json({ message: 'Tags must be lowercase single words' }, { status: 400 });
    }

    const report = await deleteTagEverywhere(prisma as unknown as TagRenameClient, { entity, tag, dryRun });

    // `updatedCount` kept for the admin panel, which predates the report.
    return NextResponse.json({ updatedCount: report.records, ...report }, { status: 200 });
  }
  catch (error)
  {
    console.error('Error deleting managed tag:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
