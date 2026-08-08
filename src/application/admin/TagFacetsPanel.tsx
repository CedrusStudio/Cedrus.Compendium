"use client";

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { tagEntityModelMap } from '@/lib/tagEntityModels';
import type { TagDefinitionRecord, TagFacetDefinition } from '@/domain/tags/tagFacets';
import type { TagFacetDrift } from '@/domain/tags/tagFacetDrift';

type Layer = { facets: TagFacetDefinition[]; definitions: TagDefinitionRecord[] };

const ENTITY_OPTIONS = Object.keys(tagEntityModelMap);

/**
 * Facet management (Wave 10.5).
 *
 * Three levels, in the order they matter: the drift report at the top (a tag
 * nobody grouped should be the first thing an admin sees, not something found by
 * accident), then tag→facet assignment, then the alias editor.
 *
 * Aliases get the most ceremony because they are the only edit here that can
 * produce a WRONG search result rather than a worse-looking dropdown — the
 * server rejects the three illegal shapes, and the error is shown verbatim
 * rather than reduced to "save failed".
 */
export default function TagFacetsPanel()
{
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const { data: layer } = useQuery<Layer>({
    queryKey: ['tagFacetAdmin'],
    queryFn: async () => await (await fetch('/api/tag-facets/admin')).json() as Layer,
  });

  const { data: drift } = useQuery<TagFacetDrift>({
    queryKey: ['tagFacetDrift'],
    queryFn: async () => await (await fetch('/api/tag-facets/drift')).json() as TagFacetDrift,
  });

  const facets = useMemo(() => [...(layer?.facets ?? [])].sort((a, b) => a.order - b.order), [layer]);
  const definitions = layer?.definitions ?? [];

  const save = async (body: Record<string, unknown>) =>
  {
    setBusy(true);
    setError('');

    const response = await fetch('/api/tag-facets/admin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    setBusy(false);

    if (!response.ok)
    {
      const payload = await response.json() as { message?: string };
      setError(payload.message ?? 'Nie udało się zapisać.');
      return false;
    }

    await queryClient.invalidateQueries({ queryKey: ['tagFacetAdmin'] });
    await queryClient.invalidateQueries({ queryKey: ['tagFacetDrift'] });
    await queryClient.invalidateQueries({ queryKey: ['tagFacets'] });
    return true;
  };

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>}

      <section className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Rozjazd kategorii</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tagi w bibliotece, których żadna kategoria nie obejmuje, oraz definicje, których nic nie używa.
          Nieprzypisany tag nie znika — trafia do „Pozostałe” — ale nie grupuje się w filtrze.
        </p>

        {
          drift && (
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <DriftColumn title={`Nieprzypisane (${drift.undefinedTags.length})`}>
                {drift.undefinedTags.slice(0, 30).map(entry => (
                  <li key={entry.tag} className="flex justify-between gap-2">
                    <span>{entry.tag}</span>
                    <span className="text-muted-foreground">{entry.occurrences}× · {entry.entities.join(', ')}</span>
                  </li>
                ))}
              </DriftColumn>

              <DriftColumn title={`Definicje bez użycia (${drift.unusedDefinitions.length})`}>
                {drift.unusedDefinitions.map(entry => (
                  <li key={entry.tag}>{entry.tag} <span className="text-muted-foreground">({entry.facetKey ?? 'bez kategorii'})</span></li>
                ))}
              </DriftColumn>

              <DriftColumn title={`Kategorie bez treści (${drift.deadFacetEntities.length})`}>
                {drift.deadFacetEntities.map(entry => (
                  <li key={`${entry.facetKey}-${entry.entity}`}>{entry.facetKey} → {entry.entity}</li>
                ))}
              </DriftColumn>
            </div>
          )
        }
      </section>

      {
        facets.map(facet => (
          <FacetCard
            key={facet.key}
            facet={facet}
            definitions={definitions.filter(definition => definition.facetKey === facet.key)}
            allFacets={facets}
            busy={busy}
            onSave={save}
          />
        ))
      }

      {
        definitions.some(definition => !definition.facetKey) && (
          <section className="rounded-lg border border-dashed p-4">
            <h2 className="text-lg font-semibold">Tagi bez kategorii</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {
                definitions.filter(definition => !definition.facetKey).map(definition => (
                  <AssignmentChip key={definition.tag} definition={definition} facets={facets} busy={busy} onSave={save} />
                ))
              }
            </div>
          </section>
        )
      }
    </div>
  );
}

function DriftColumn({ title, children }: React.PropsWithChildren<{ title: string }>)
{
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="mt-1 max-h-48 space-y-0.5 overflow-y-auto text-xs">{children}</ul>
    </div>
  );
}

type SaveFn = (body: Record<string, unknown>) => Promise<boolean>;

function AssignmentChip({ definition, facets, busy, onSave }: {
  definition: TagDefinitionRecord;
  facets: TagFacetDefinition[];
  busy: boolean;
  onSave: SaveFn;
})
{
  return (
    <span className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs">
      {definition.tag}
      <select
        className="bg-transparent text-xs"
        disabled={busy}
        value={definition.facetKey ?? ''}
        onChange={event => void onSave({
          resource: 'definition',
          action: 'upsert',
          tag: definition.tag,
          facetKey: event.target.value || null,
          label: definition.label ?? null,
          order: definition.order ?? null,
          aliases: definition.aliases ?? [],
        })}
      >
        <option value="">— brak —</option>
        {facets.map(facet => <option key={facet.key} value={facet.key}>{facet.label}</option>)}
      </select>
    </span>
  );
}

function FacetCard({ facet, definitions, allFacets, busy, onSave }: {
  facet: TagFacetDefinition;
  definitions: TagDefinitionRecord[];
  allFacets: TagFacetDefinition[];
  busy: boolean;
  onSave: SaveFn;
})
{
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{facet.label} <span className="text-sm font-normal text-muted-foreground">{facet.key}</span></h2>
          <p className="text-xs text-muted-foreground">
            {facet.selectionMode === 'single' ? 'jedna wartość' : 'wiele wartości'} ·
            {facet.supportsNone ? ' z „— brak —"' : ' bez „— brak —"'} ·
            kolejność {facet.order} · encje: {facet.entities.join(', ')}
          </p>
        </div>

        <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Zwiń' : `Tagi (${definitions.length})`}
        </Button>
      </div>

      {facet.description && <p className="mt-2 text-sm text-muted-foreground">{facet.description}</p>}

      {
        expanded && (
          <div className="mt-3 space-y-2">
            {definitions.map(definition => (
              <DefinitionRow
                key={definition.tag}
                definition={definition}
                facets={allFacets}
                busy={busy}
                onSave={onSave}
              />
            ))}
          </div>
        )
      }
    </section>
  );
}

function DefinitionRow({ definition, facets, busy, onSave }: {
  definition: TagDefinitionRecord;
  facets: TagFacetDefinition[];
  busy: boolean;
  onSave: SaveFn;
})
{
  const [alias, setAlias] = useState('');
  const [aliasEntities, setAliasEntities] = useState<string[]>([]);

  const facet = facets.find(candidate => candidate.key === definition.facetKey);
  // Offering entities outside the facet would only let an admin create a dead
  // alias — the server rejects it anyway, so it is not offered in the first place.
  const selectableEntities = facet?.entities ?? ENTITY_OPTIONS;

  const addAlias = async () =>
  {
    if (!alias.trim() || aliasEntities.length === 0) return;

    const saved = await onSave({
      resource: 'definition',
      action: 'upsert',
      tag: definition.tag,
      facetKey: definition.facetKey ?? null,
      label: definition.label ?? null,
      order: definition.order ?? null,
      aliases: [...(definition.aliases ?? []), { alias: alias.trim(), entities: aliasEntities }],
    });

    if (saved) { setAlias(''); setAliasEntities([]); }
  };

  const removeAlias = (target: string) => void onSave({
    resource: 'definition',
    action: 'upsert',
    tag: definition.tag,
    facetKey: definition.facetKey ?? null,
    label: definition.label ?? null,
    order: definition.order ?? null,
    aliases: (definition.aliases ?? []).filter(entry => entry.alias !== target),
  });

  return (
    <div className="rounded border p-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{definition.tag}</span>

        {
          (definition.aliases ?? []).map(entry => (
            <button
              key={entry.alias}
              type="button"
              className="rounded bg-muted px-2 py-0.5 text-xs hover:line-through"
              onClick={() => removeAlias(entry.alias)}
              title="Usuń alias"
            >
              {entry.alias} <span className="text-muted-foreground">({entry.entities.join(', ')})</span>
            </button>
          ))
        }

        {
          (definition.formerNames ?? []).length > 0 && (
            <span className="text-xs text-muted-foreground">
              dawniej: {(definition.formerNames ?? []).join(', ')}
            </span>
          )
        }
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Input
          value={alias}
          onChange={event => setAlias(event.target.value)}
          placeholder="nowy alias"
          className="h-7 w-40 text-xs"
        />

        {
          selectableEntities.map(entity => (
            <label key={entity} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={aliasEntities.includes(entity)}
                onChange={() => setAliasEntities(current =>
                  current.includes(entity) ? current.filter(item => item !== entity) : [...current, entity])}
              />
              {entity}
            </label>
          ))
        }

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={busy || !alias.trim() || aliasEntities.length === 0}
          onClick={() => void addAlias()}
        >
          Dodaj alias
        </Button>
      </div>
    </div>
  );
}
