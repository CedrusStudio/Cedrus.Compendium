"use client";

import Link from 'next/link';
import { useAdminStatus } from '@/common/hooks/useAdminStatus';
import tagManagementClient, { ManagedTag } from '@/infrastructure/clients/tagManagementClient';
import { EntityType } from '@/infrastructure/clients/tagsClient';
import AdminEntityManagementPanel from '@/app/admin/components/AdminEntityManagementPanel';
import { useAdminEntityManagement } from '@/app/admin/components/useAdminEntityManagement';

const entityLabels: Record<EntityType, string> = {
  characters: 'Postacie',
  weapons: 'Bronie',
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
const entitySelectItems = entityOptions.map(entity => ({ label: entityLabels[entity], value: entity }));

export default function TagManagementPage()
{
  const { isAdmin, isCheckingAdmin, isLoaded } = useAdminStatus();
  const management = useAdminEntityManagement<EntityType, ManagedTag>({
    enabled: isLoaded && isAdmin,
    initialEntity: 'perks',
    queryKeyPrefix: 'tagManagement',
    invalidationKeys: ['entityTags'],
    getRows: entity => tagManagementClient.getTags(entity),
    toRow: row => ({ value: row.tag, count: row.count }),
    renameRow: (entity, oldValue, newValue) => tagManagementClient.renameTag({ entity, oldTag: oldValue, newTag: newValue }),
    deleteRow: (entity, value) => tagManagementClient.deleteTag({ entity, tag: value }),
  });

  if (!isLoaded || isCheckingAdmin)
  {
    return null;
  }

  if (!isAdmin)
  {
    return (
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="rounded-lg border p-6 text-center">
          <h1 className="text-3xl font-bold">Zarządzanie tagami</h1>
          <p className="mt-3 text-sm text-muted-foreground">Ta sekcja jest dostępna tylko dla administratorów.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminEntityManagementPanel
      title="Zarządzanie tagami"
      description="Przeglądaj tagi po typie encji, sprawdzaj liczbę wystąpień i wykonuj zbiorcze zmiany."
      itemLabel="Tag"
      selectorId="tag-entity-select"
      entitySelectItems={entitySelectItems}
      selectedEntity={management.selectedEntity}
      onSelectedEntityChange={value => management.setSelectedEntity(value as EntityType)}
      pendingAction={management.pendingAction}
      nextValue={management.nextValue}
      onNextValueChange={management.setNextValue}
      onCancelAction={management.cancelAction}
      onOpenRename={management.openRename}
      onOpenDelete={management.openDelete}
      onConfirmRename={() => management.renameMutation.mutate()}
      onConfirmDelete={() => management.deleteMutation.mutate()}
      isRenamePending={management.renameMutation.isPending}
      isDeletePending={management.deleteMutation.isPending}
      rows={management.rows}
      isLoading={management.isLoading}
      hasError={management.hasError}
      loadingMessage="Ładowanie tagów..."
      errorMessage="Nie udało się pobrać listy tagów."
      emptyMessage="Brak tagów dla wybranego typu encji."
      renameInputPlaceholder="Nowa wartość tagu"
      getRenameConfirmationMessage={(value, count) => `Tag ${value} zostanie zmieniony w ${count} rekordach.`}
      getDeleteConfirmationMessage={(value, count) => `Tag ${value} zostanie usunięty z ${count} rekordów.`}
      confirmRenameButtonLabel="Potwierdź zmianę"
      confirmDeleteButtonLabel="Potwierdź usunięcie"
      renameActionAriaLabel="Edytuj"
      deleteActionAriaLabel="Usuń"
    />
  );
}