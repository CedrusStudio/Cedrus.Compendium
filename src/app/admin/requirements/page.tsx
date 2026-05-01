"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminStatus } from '@/common/hooks/useAdminStatus';
import requirementsManagementClient from '@/infrastructure/clients/requirementsManagementClient';
import { RequirementEntityType } from '@/infrastructure/clients/requirementsClient';
import { Button } from '@/ui/button';
import { leftIcon } from '@/common/icons';

type PendingAction =
  | { type: 'rename'; requirement: string; count: number }
  | { type: 'delete'; requirement: string; count: number }
  | null;

const entityLabels: Record<RequirementEntityType, string> = {
  perks: 'Atuty',
  spells: 'Zaklecia',
  maneuvers: 'Manewry',
  stances: 'Postawy',
  states: 'Stany',
};

const entityOptions = Object.keys(entityLabels) as RequirementEntityType[];

export default function RequirementsManagementPage()
{
  const { isAdmin, isCheckingAdmin, isLoaded } = useAdminStatus();
  const [selectedEntity, setSelectedEntity] = useState<RequirementEntityType>('perks');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [nextRequirementValue, setNextRequirementValue] = useState('');
  const queryClient = useQueryClient();

  const { data: managedRequirements = [], isLoading, error } = useQuery({
    queryKey: ['requirementsManagement', selectedEntity],
    queryFn: () => requirementsManagementClient.getRequirements(selectedEntity),
    staleTime: 5 * 60 * 1000,
    enabled: isLoaded && isAdmin,
  });

  const invalidateEntityQueries = async (entity: RequirementEntityType) => {
    await queryClient.invalidateQueries({
      predicate: query =>
        Array.isArray(query.queryKey)
        && query.queryKey.some(key => key === entity || key === 'requirementsManagement' || key === 'entityRequirements'),
    });
  };

  const renameMutation = useMutation({
    mutationFn: () => requirementsManagementClient.renameRequirement({
      entity: selectedEntity,
      oldRequirement: pendingAction?.requirement ?? '',
      newRequirement: nextRequirementValue,
    }),
    onSuccess: async () => {
      await invalidateEntityQueries(selectedEntity);
      setPendingAction(null);
      setNextRequirementValue('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => requirementsManagementClient.deleteRequirement({
      entity: selectedEntity,
      requirement: pendingAction?.requirement ?? '',
    }),
    onSuccess: async () => {
      await invalidateEntityQueries(selectedEntity);
      setPendingAction(null);
    },
  });

  const sortedRequirements = useMemo(
    () => [...managedRequirements].sort((left, right) => left.requirement.localeCompare(right.requirement)),
    [managedRequirements],
  );

  if (!isLoaded || isCheckingAdmin)
  {
    return null;
  }

  if (!isAdmin)
  {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="rounded-lg border p-6 text-center">
          <h1 className="text-3xl font-bold">Zarzadzanie wymaganiami</h1>
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
          <h1 className="text-4xl font-bold">Zarzadzanie wymaganiami</h1>
          <p className="mt-2 text-muted-foreground">
            Przegladaj wymagania po typie encji, sprawdzaj liczbe wystapien i wykonuj zbiorcze zmiany.
          </p>
        </div>

        <Button asChild variant="outline" size="icon">
          <Link href="/admin" aria-label="Wroc do panelu admina">{leftIcon}</Link>
        </Button>
      </div>

      <div className="rounded-lg border p-4">
        <div className="space-y-2 md:max-w-sm">
          <label htmlFor="requirement-entity-select" className="text-sm font-medium text-muted-foreground">Typ encji</label>
          <select
            id="requirement-entity-select"
            className="h-11 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm"
            value={selectedEntity}
            onChange={event => {
              setSelectedEntity(event.target.value as RequirementEntityType);
              setPendingAction(null);
              setNextRequirementValue('');
            }}
          >
            {
              entityOptions.map(entity => (
                <option key={entity} value={entity}>{entityLabels[entity]}</option>
              ))
            }
          </select>
        </div>
      </div>

      {
        pendingAction && (
          <div className="rounded-lg border p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Potwierdzenie operacji</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {pendingAction.type === 'rename'
                  ? `Wymaganie ${pendingAction.requirement} zostanie zmienione w ${pendingAction.count} rekordach.`
                  : `Wymaganie ${pendingAction.requirement} zostanie usuniete z ${pendingAction.count} rekordow.`}
              </p>
            </div>

            {
              pendingAction.type === 'rename' && (
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 md:max-w-sm"
                  placeholder="Nowa wartosc wymagania"
                  value={nextRequirementValue}
                  onChange={event => setNextRequirementValue(event.target.value)}
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
                    disabled={!nextRequirementValue.trim() || renameMutation.isPending}
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

              <button type="button" className="rounded-md border px-4 py-2 font-medium hover:bg-muted" onClick={() => { setPendingAction(null); setNextRequirementValue(''); }}>
                Anuluj
              </button>
            </div>
          </div>
        )
      }

      <div className="rounded-lg border overflow-hidden">
        <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_120px_180px] md:items-center md:gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium">
          <span>Wymaganie</span>
          <span className="text-center">Liczba uzyc</span>
          <span>Akcje</span>
        </div>

        {
          isLoading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Ladowanie wymagan...</div>
          ) : error ? (
            <div className="px-4 py-6 text-sm text-destructive">Nie udalo sie pobrac listy wymagan.</div>
          ) : sortedRequirements.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Brak wymagan dla wybranego typu encji.</div>
          ) : (
            sortedRequirements.map(managedRequirement => (
              <div key={managedRequirement.requirement} className="grid gap-3 border-t px-4 py-4 text-sm md:grid-cols-[minmax(0,1fr)_120px_180px] md:items-center md:gap-4 md:py-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">Wymaganie</span>
                  <div className="font-medium break-all">{managedRequirement.requirement}</div>
                </div>
                <div className="flex items-center justify-between gap-3 md:block md:text-center">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">Liczba uzyc</span>
                  <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-muted px-2.5 py-1 font-medium">{managedRequirement.count}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">Akcje</span>
                  <div className="flex flex-col gap-2 sm:flex-row md:flex-wrap">
                  <button
                    type="button"
                    className="w-full rounded-md border px-3 py-2 hover:bg-muted sm:w-auto"
                    onClick={() => {
                      setPendingAction({ type: 'rename', requirement: managedRequirement.requirement, count: managedRequirement.count });
                      setNextRequirementValue('');
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-md border px-3 py-2 hover:bg-muted sm:w-auto"
                    onClick={() => {
                      setPendingAction({ type: 'delete', requirement: managedRequirement.requirement, count: managedRequirement.count });
                      setNextRequirementValue('');
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              </div>
            ))
          )
        }
      </div>
    </div>
  );
}