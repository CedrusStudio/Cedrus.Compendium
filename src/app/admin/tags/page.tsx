"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminStatus } from '@/common/hooks/useAdminStatus';
import tagManagementClient from '@/infrastructure/clients/tagManagementClient';
import { EntityType } from '@/infrastructure/clients/tagsClient';

type PendingAction =
  | { type: 'rename'; tag: string; count: number }
  | { type: 'delete'; tag: string; count: number }
  | null;

const entityLabels: Record<EntityType, string> = {
  characters: 'Postacie',
  weapons: 'Bron',
  armors: 'Zbroje',
  shields: 'Tarcze',
  spells: 'Zaklecia',
  perks: 'Atuty',
  races: 'Rasy',
  maneuvers: 'Manewry',
  stances: 'Postawy',
  states: 'Stany',
  inventory: 'Przedmioty',
  mounts: 'Wierzchowce',
  powerSpecifications: 'Moce',
};

const entityOptions = Object.keys(entityLabels) as EntityType[];

export default function TagManagementPage()
{
  const { isAdmin, isCheckingAdmin, isLoaded } = useAdminStatus();
  const [selectedEntity, setSelectedEntity] = useState<EntityType>('perks');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [nextTagValue, setNextTagValue] = useState('');
  const queryClient = useQueryClient();

  const { data: managedTags = [], isLoading, error } = useQuery({
    queryKey: ['tagManagement', selectedEntity],
    queryFn: () => tagManagementClient.getTags(selectedEntity),
    staleTime: 5 * 60 * 1000,
    enabled: isLoaded && isAdmin,
  });

  const invalidateEntityQueries = async (entity: EntityType) => {
    await queryClient.invalidateQueries({
      predicate: query =>
        Array.isArray(query.queryKey)
        && query.queryKey.some(key => key === entity || key === 'tagManagement' || key === 'entityTags'),
    });
  };

  const renameMutation = useMutation({
    mutationFn: () => tagManagementClient.renameTag({
      entity: selectedEntity,
      oldTag: pendingAction?.tag ?? '',
      newTag: nextTagValue,
    }),
    onSuccess: async () => {
      await invalidateEntityQueries(selectedEntity);
      setPendingAction(null);
      setNextTagValue('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tagManagementClient.deleteTag({
      entity: selectedEntity,
      tag: pendingAction?.tag ?? '',
    }),
    onSuccess: async () => {
      await invalidateEntityQueries(selectedEntity);
      setPendingAction(null);
    },
  });

  const sortedTags = useMemo(() => [...managedTags].sort((left, right) => left.tag.localeCompare(right.tag)), [managedTags]);

  if (!isLoaded || isCheckingAdmin)
  {
    return null;
  }

  if (!isAdmin)
  {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="rounded-lg border p-6 text-center">
          <h1 className="text-3xl font-bold">Zarzadzanie tagami</h1>
          <p className="mt-3 text-sm text-muted-foreground">Ta sekcja jest dostepna tylko dla administratorow.</p>
          <Link href="/personalization" className="mt-4 inline-flex rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            Wroc do personalizacji
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Zarzadzanie tagami</h1>
          <p className="mt-2 text-muted-foreground">
            Przegladaj tagi po typie encji, sprawdzaj liczbe wystapien i wykonuj zbiorcze zmiany.
          </p>
        </div>

        <Link href="/admin" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
          Wroc do panelu admina
        </Link>
      </div>

      <div className="rounded-lg border p-4">
        <label className="text-sm font-medium">Typ encji</label>
        <select
          className="mt-2 w-full rounded-md border bg-background px-3 py-2 md:max-w-sm"
          value={selectedEntity}
          onChange={event => {
            setSelectedEntity(event.target.value as EntityType);
            setPendingAction(null);
            setNextTagValue('');
          }}
        >
          {
            entityOptions.map(entity => (
              <option key={entity} value={entity}>{entityLabels[entity]}</option>
            ))
          }
        </select>
      </div>

      {
        pendingAction && (
          <div className="rounded-lg border p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Potwierdzenie operacji</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {pendingAction.type === 'rename'
                  ? `Tag ${pendingAction.tag} zostanie zmieniony w ${pendingAction.count} rekordach.`
                  : `Tag ${pendingAction.tag} zostanie usuniety z ${pendingAction.count} rekordow.`}
              </p>
            </div>

            {
              pendingAction.type === 'rename' && (
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 md:max-w-sm"
                  placeholder="Nowa wartosc tagu"
                  value={nextTagValue}
                  onChange={event => setNextTagValue(event.target.value)}
                />
              )
            }

            <div className="flex flex-wrap gap-3">
              {
                pendingAction.type === 'rename' ? (
                  <button
                    type="button"
                    className="rounded-md border px-4 py-2 font-medium hover:bg-muted disabled:opacity-50"
                    onClick={() => renameMutation.mutate()}
                    disabled={!nextTagValue.trim() || renameMutation.isPending}
                  >
                    Potwierdz rename
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-md border px-4 py-2 font-medium hover:bg-muted disabled:opacity-50"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                  >
                    Potwierdz usuniecie
                  </button>
                )
              }

              <button type="button" className="rounded-md border px-4 py-2 font-medium hover:bg-muted" onClick={() => { setPendingAction(null); setNextTagValue(''); }}>
                Anuluj
              </button>
            </div>
          </div>
        )
      }

      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_220px] gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium">
          <span>Tag</span>
          <span>Liczba uzyc</span>
          <span>Akcje</span>
        </div>

        {
          isLoading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Ladowanie tagow...</div>
          ) : error ? (
            <div className="px-4 py-6 text-sm text-destructive">Nie udalo sie pobrac listy tagow.</div>
          ) : sortedTags.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Brak tagow dla wybranego typu encji.</div>
          ) : (
            sortedTags.map(managedTag => (
              <div key={managedTag.tag} className="grid grid-cols-[1fr_120px_220px] gap-4 border-t px-4 py-3 text-sm">
                <span className="font-medium">{managedTag.tag}</span>
                <span>{managedTag.count}</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1 hover:bg-muted"
                    onClick={() => {
                      setPendingAction({ type: 'rename', tag: managedTag.tag, count: managedTag.count });
                      setNextTagValue('');
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1 hover:bg-muted"
                    onClick={() => {
                      setPendingAction({ type: 'delete', tag: managedTag.tag, count: managedTag.count });
                      setNextTagValue('');
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )
        }
      </div>
    </div>
  );
}