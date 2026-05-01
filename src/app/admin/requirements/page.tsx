"use client";

import Link from 'next/link';
import { useAdminStatus } from '@/common/hooks/useAdminStatus';
import requirementsManagementClient, { ManagedRequirement } from '@/infrastructure/clients/requirementsManagementClient';
import { RequirementEntityType } from '@/infrastructure/clients/requirementsClient';
import AdminEntityManagementPanel from '@/app/admin/components/AdminEntityManagementPanel';
import { useAdminEntityManagement } from '@/app/admin/components/useAdminEntityManagement';

const entityLabels: Record<RequirementEntityType, string> = {
  perks: 'Atuty',
  spells: 'Zaklecia',
  maneuvers: 'Manewry',
  stances: 'Postawy',
  states: 'Stany',
};

const entityOptions = Object.keys(entityLabels) as RequirementEntityType[];
const entitySelectItems = entityOptions.map(entity => ({ label: entityLabels[entity], value: entity }));

export default function RequirementsManagementPage()
{
  const { isAdmin, isCheckingAdmin, isLoaded } = useAdminStatus();
  const management = useAdminEntityManagement<RequirementEntityType, ManagedRequirement>({
    enabled: isLoaded && isAdmin,
    initialEntity: 'perks',
    queryKeyPrefix: 'requirementsManagement',
    invalidationKeys: ['entityRequirements'],
    getRows: entity => requirementsManagementClient.getRequirements(entity),
    toRow: row => ({ value: row.requirement, count: row.count }),
    renameRow: (entity, oldValue, newValue) => requirementsManagementClient.renameRequirement({ entity, oldRequirement: oldValue, newRequirement: newValue }),
    deleteRow: (entity, value) => requirementsManagementClient.deleteRequirement({ entity, requirement: value }),
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
          <h1 className="text-3xl font-bold">Zarzadzanie wymaganiami</h1>
          <p className="mt-3 text-sm text-muted-foreground">Ta sekcja jest dostepna tylko dla administratorow.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminEntityManagementPanel
      title="Zarzadzanie wymaganiami"
      description="Przegladaj wymagania po typie encji, sprawdzaj liczbe wystapien i wykonuj zbiorcze zmiany."
      itemLabel="Wymaganie"
      selectorId="requirement-entity-select"
      entitySelectItems={entitySelectItems}
      selectedEntity={management.selectedEntity}
      onSelectedEntityChange={value => management.setSelectedEntity(value as RequirementEntityType)}
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
      loadingMessage="Ladowanie wymagan..."
      errorMessage="Nie udalo sie pobrac listy wymagan."
      emptyMessage="Brak wymagan dla wybranego typu encji."
      renameInputPlaceholder="Nowa wartosc wymagania"
      getRenameConfirmationMessage={(value, count) => `Wymaganie ${value} zostanie zmienione w ${count} rekordach.`}
      getDeleteConfirmationMessage={(value, count) => `Wymaganie ${value} zostanie usuniete z ${count} rekordow.`}
      confirmRenameButtonLabel="Potwierdz zmiane"
      confirmDeleteButtonLabel="Potwierdz usuniecie"
      renameActionAriaLabel="Edytuj"
      deleteActionAriaLabel="Usun"
    />
  );
}