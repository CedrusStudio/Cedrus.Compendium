import { connection, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { tagEntityModelMap } from '@/lib/tagEntityModels';
import { findTagFacetDrift, type TagUsage } from '@/domain/tags/tagFacetDrift';
import { loadTagFacetLayer } from '@/persistence/tags/tagFacetLayer';

/**
 * Drift report for the admin panel (Wave 10.6).
 *
 * Counts every tag across every entity, then diffs against the facet layer. The
 * point is that a newly introduced tag becomes VISIBLE rather than waiting to be
 * noticed by accident — the layer is maintained by hand, so it needs a mirror.
 */
export async function GET()
{
  await connection();
  try
  {
    const usage: TagUsage = {};

    for (const [entity, modelName] of Object.entries(tagEntityModelMap))
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = await (prisma as any)[modelName].findMany({ select: { tags: true } }) as { tags: string[] }[];

      const counts: Record<string, number> = {};
      for (const row of rows)
      {
        for (const tag of row.tags ?? []) counts[tag] = (counts[tag] ?? 0) + 1;
      }

      usage[entity] = counts;
    }

    const { facets, definitions } = await loadTagFacetLayer();

    return NextResponse.json(findTagFacetDrift(usage, facets, definitions), { status: 200 });
  }
  catch (error)
  {
    console.error('Error building tag facet drift report:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
