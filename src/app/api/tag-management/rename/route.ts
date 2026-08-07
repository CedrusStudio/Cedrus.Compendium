import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidTag } from '@/domain/Tag';
import { tagEntityModelMap } from '@/lib/tagEntityModels';
import { renameTagEverywhere, type TagRenameClient } from '@/persistence/tags/renameTagEverywhere';

type TagMutationBody = {
  entity?: string;
  oldTag?: string;
  newTag?: string;
  /** Report what would change without writing anything. */
  dryRun?: boolean;
};

/**
 * Wave 9.0: a rename now sweeps all three places a tag name is stored — the
 * entity's `tags`, `count` requirement references and every user's quick tags —
 * and the entity sweep runs as raw Mongo commands so 575 records cannot end up
 * half-renamed. `dryRun: true` returns the same report without writing.
 */
export async function POST(request: Request)
{
  try
  {
    const body = await request.json() as TagMutationBody;
    const entity = body.entity?.trim() ?? '';
    const oldTag = body.oldTag?.trim() ?? '';
    const newTag = body.newTag?.trim() ?? '';
    const dryRun = body.dryRun === true;

    if (!tagEntityModelMap[entity])
    {
      return NextResponse.json({ message: `Invalid entity: ${entity}` }, { status: 400 });
    }

    if (!oldTag || !newTag)
    {
      return NextResponse.json({ message: 'Both oldTag and newTag are required' }, { status: 400 });
    }

    if (!isValidTag(oldTag) || !isValidTag(newTag))
    {
      return NextResponse.json({ message: 'Tags must be lowercase single words' }, { status: 400 });
    }

    if (oldTag === newTag)
    {
      return NextResponse.json({ message: 'newTag must be different from oldTag' }, { status: 400 });
    }

    const report = await renameTagEverywhere(prisma as unknown as TagRenameClient, { entity, oldTag, newTag, dryRun });

    // `updatedCount` is kept for callers written before Wave 9.0 (the admin
    // panel reads it); the report carries what the sweep actually touched.
    return NextResponse.json({ updatedCount: report.records, ...report }, { status: 200 });
  }
  catch (error)
  {
    console.error('Error renaming managed tag:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
