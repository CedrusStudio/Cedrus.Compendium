import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidTag } from '@/domain/Tag';
import { tagEntityModelMap } from '@/lib/tagEntityModels';
import { validateTagDefinitionAliases } from '@/domain/tags/validateTagAlias';
import type { TagAliasDefinition, TagDefinitionRecord, TagFacetDefinition } from '@/domain/tags/tagFacets';
import { invalidateTagFacetLayer, loadTagFacetLayer } from '@/persistence/tags/tagFacetLayer';

/**
 * Admin CRUD for the facet layer (Wave 9.2 / 9.5).
 *
 * Nothing here can touch an entity's `tags` — the layer is descriptive, so the
 * worst a mistake does is group the filter badly. The one exception to that
 * comfort is an ALIAS, which changes what a search matches without raising
 * anything, so aliases are validated server side against the three rules in
 * `validateTagAlias` and rejected with 400 rather than merely warned about.
 */

type FacetBody = {
  key?: string;
  label?: string;
  description?: string | null;
  order?: number;
  selectionMode?: string;
  supportsNone?: boolean;
  entities?: string[];
};

type DefinitionBody = {
  tag?: string;
  facetKey?: string | null;
  label?: string | null;
  order?: number | null;
  aliases?: { alias?: string; entities?: string[] }[];
};

type AdminBody = { resource?: 'facet' | 'definition'; action?: 'upsert' | 'delete' } & FacetBody & DefinitionBody;

export async function GET()
{
  try
  {
    const layer = await loadTagFacetLayer();
    return NextResponse.json(layer, { status: 200 });
  }
  catch (error)
  {
    console.error('Error loading tag facet layer:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request)
{
  try
  {
    const body = await request.json() as AdminBody;

    if (body.resource === 'facet') return await handleFacet(body);
    if (body.resource === 'definition') return await handleDefinition(body);

    return NextResponse.json({ message: "resource must be 'facet' or 'definition'" }, { status: 400 });
  }
  catch (error)
  {
    console.error('Error mutating tag facet layer:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

async function handleFacet(body: AdminBody)
{
  const key = body.key?.trim() ?? '';
  if (!key) return NextResponse.json({ message: 'key is required' }, { status: 400 });

  if (body.action === 'delete')
  {
    // Definitions keep pointing at a key that no longer exists — which resolves
    // to "unassigned", i.e. the tags reappear in the "Pozostałe" bucket. No
    // entity record changes; this is the degradation the plan promises.
    await prisma.tagFacet.deleteMany({ where: { key } });
    await prisma.tagDefinition.updateMany({ where: { facetKey: key }, data: { facetKey: null } });
    invalidateTagFacetLayer();
    return NextResponse.json({ key, deleted: true }, { status: 200 });
  }

  const entities = body.entities ?? [];
  const unknown = entities.filter(entity => !tagEntityModelMap[entity]);
  if (unknown.length > 0)
  {
    return NextResponse.json({ message: `Nieznane encje: ${unknown.join(', ')}` }, { status: 400 });
  }

  const selectionMode = body.selectionMode === 'single' ? 'single' : 'multi';
  const data = {
    label: body.label?.trim() || key,
    description: body.description ?? null,
    order: body.order ?? 999,
    selectionMode,
    supportsNone: body.supportsNone ?? true,
    entities,
  };

  const saved = await prisma.tagFacet.upsert({ where: { key }, create: { key, ...data }, update: data });
  invalidateTagFacetLayer();
  return NextResponse.json(saved, { status: 200 });
}

async function handleDefinition(body: AdminBody)
{
  const tag = body.tag?.trim() ?? '';
  if (!tag) return NextResponse.json({ message: 'tag is required' }, { status: 400 });
  if (!isValidTag(tag)) return NextResponse.json({ message: 'Tags must be lowercase single words' }, { status: 400 });

  if (body.action === 'delete')
  {
    await prisma.tagDefinition.deleteMany({ where: { tag } });
    invalidateTagFacetLayer();
    return NextResponse.json({ tag, deleted: true }, { status: 200 });
  }

  const aliases: TagAliasDefinition[] = [];

  for (const entry of body.aliases ?? [])
  {
    const alias = entry.alias?.trim() ?? '';
    if (!alias) continue;
    if (!isValidTag(alias)) return NextResponse.json({ message: `Alias „${alias}" musi być małymi literami bez spacji` }, { status: 400 });
    if (alias === tag) return NextResponse.json({ message: `Alias „${alias}" jest tym samym co tag kanoniczny` }, { status: 400 });
    aliases.push({ alias, entities: entry.entities ?? [] });
  }

  const { facets, definitions } = await loadTagFacetLayer();
  const candidate: TagDefinitionRecord = {
    tag,
    facetKey: body.facetKey ?? null,
    label: body.label ?? null,
    order: body.order ?? null,
    aliases,
  };

  const violations = validateTagDefinitionAliases(candidate, facets as TagFacetDefinition[], definitions);
  if (violations.length > 0)
  {
    return NextResponse.json({ message: violations.map(violation => violation.message).join(' '), violations }, { status: 400 });
  }

  const data = {
    facetKey: candidate.facetKey ?? null,
    label: candidate.label ?? null,
    order: candidate.order ?? null,
    aliases: aliases.map(alias => ({ alias: alias.alias, entities: [...alias.entities] })),
  };

  const saved = await prisma.tagDefinition.upsert({
    where: { tag },
    create: { tag, ...data, formerNames: [] },
    update: data,
  });

  invalidateTagFacetLayer();
  return NextResponse.json(saved, { status: 200 });
}
