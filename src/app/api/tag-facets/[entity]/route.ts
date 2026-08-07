import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { tagEntityModelMap } from '@/lib/tagEntityModels';
import { loadTagFacetIndexForDisplay } from '@/persistence/tags/tagFacetLayer';

/**
 * The facet layer for one entity, ready to render (Wave 9.2).
 *
 * One call feeds the whole filter: facets in display order, their values with
 * per-entity spellings, and the tags no definition claims.
 *
 * Works with empty `TagFacet`/`TagDefinition` collections — it then returns no
 * facets and every tag as unassigned, which is what makes the UI fall back to
 * today's flat list without any special case.
 */
export async function GET(request: Request, { params }: { params: Promise<{ entity: string }> })
{
  try
  {
    const { entity } = await params;
    const modelName = tagEntityModelMap[entity];

    if (!modelName)
    {
      return NextResponse.json({ message: `Invalid entity: ${entity}` }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (prisma as any)[modelName];
    const rows = await model.findMany({ select: { tags: true } }) as { tags: string[] }[];
    const availableTags = [...new Set(rows.flatMap(row => row.tags ?? []))];

    const index = await loadTagFacetIndexForDisplay(entity, availableTags);

    return NextResponse.json(index, { status: 200 });
  }
  catch (error)
  {
    console.error('Error building tag facet index:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
