"use client";

import Link from 'next/link';
import SelectOneOfStrings from '@/common/components/selects/SelectOneOfStrings';
import { deleteIcon, editIcon, leftIcon } from '@/common/icons';
import { Button } from '@/ui/button';
import { ManagedEntityRow, PendingManagementAction } from '@/app/admin/components/useAdminEntityManagement';

type EntitySelectItem<TEntity extends string> = {
  label: string;
  value: TEntity;
};

type AdminEntityManagementPanelProps<TEntity extends string> = {
  title: string;
  description: string;
  itemLabel: string;
  selectorId: string;
  entitySelectItems: EntitySelectItem<TEntity>[];
  selectedEntity: TEntity;
  onSelectedEntityChange: (value: TEntity) => void;
  pendingAction: PendingManagementAction;
  nextValue: string;
  onNextValueChange: (value: string) => void;
  onCancelAction: () => void;
  onOpenRename: (value: string, count: number) => void;
  onOpenDelete: (value: string, count: number) => void;
  onConfirmRename: () => void;
  onConfirmDelete: () => void;
  isRenamePending: boolean;
  isDeletePending: boolean;
  rows: ManagedEntityRow[];
  isLoading: boolean;
  hasError: boolean;
  loadingMessage: string;
  errorMessage: string;
  emptyMessage: string;
  renameInputPlaceholder: string;
  getRenameConfirmationMessage: (value: string, count: number) => string;
  getDeleteConfirmationMessage: (value: string, count: number) => string;
  confirmRenameButtonLabel: string;
  confirmDeleteButtonLabel: string;
  cancelButtonLabel?: string;
  renameActionAriaLabel?: string;
  deleteActionAriaLabel?: string;
};

export default function AdminEntityManagementPanel<TEntity extends string>({
  title,
  description,
  itemLabel,
  selectorId,
  entitySelectItems,
  selectedEntity,
  onSelectedEntityChange,
  pendingAction,
  nextValue,
  onNextValueChange,
  onCancelAction,
  onOpenRename,
  onOpenDelete,
  onConfirmRename,
  onConfirmDelete,
  isRenamePending,
  isDeletePending,
  rows,
  isLoading,
  hasError,
  loadingMessage,
  errorMessage,
  emptyMessage,
  renameInputPlaceholder,
  getRenameConfirmationMessage,
  getDeleteConfirmationMessage,
  confirmRenameButtonLabel,
  confirmDeleteButtonLabel,
  cancelButtonLabel = 'Anuluj',
  renameActionAriaLabel = 'Edytuj',
  deleteActionAriaLabel = 'Usun',
}: AdminEntityManagementPanelProps<TEntity>)
{
  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{description}</p>
        </div>

        <Button asChild variant="outline" size="icon">
          <Link href="/admin" aria-label="Wroc do panelu admina">{leftIcon}</Link>
        </Button>
      </div>

      <SelectOneOfStrings
        id={selectorId}
        value={selectedEntity}
        items={entitySelectItems}
        onChange={value => onSelectedEntityChange(value as TEntity)}
        triggerClassName="h-11 w-36 border bg-background px-3 py-2 text-sm shadow-sm md:w-36"
      />

      {
        pendingAction && (
          <div className="rounded-lg border p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Potwierdzenie operacji</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {
                  pendingAction.type === 'rename'
                    ? getRenameConfirmationMessage(pendingAction.value, pendingAction.count)
                    : getDeleteConfirmationMessage(pendingAction.value, pendingAction.count)
                }
              </p>
            </div>

            {
              pendingAction.type === 'rename' && (
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 md:max-w-sm"
                  placeholder={renameInputPlaceholder}
                  value={nextValue}
                  onChange={event => onNextValueChange(event.target.value)}
                />
              )
            }

            <div className="flex flex-wrap gap-3">
              {
                pendingAction.type === 'rename' ? (
                  <button
                    type="button"
                    className="rounded-md border px-4 py-2 font-medium hover:bg-muted disabled:opacity-50"
                    onClick={onConfirmRename}
                    disabled={!nextValue.trim() || isRenamePending}
                  >
                    {confirmRenameButtonLabel}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-md border px-4 py-2 font-medium hover:bg-muted disabled:opacity-50"
                    onClick={onConfirmDelete}
                    disabled={isDeletePending}
                  >
                    {confirmDeleteButtonLabel}
                  </button>
                )
              }

              <button type="button" className="rounded-md border px-4 py-2 font-medium hover:bg-muted" onClick={onCancelAction}>
                {cancelButtonLabel}
              </button>
            </div>
          </div>
        )
      }

      <div className="rounded-lg border overflow-hidden">
        <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-center md:gap-4 border-b bg-muted/40 px-4 py-3 text-sm font-medium">
          <span>{itemLabel}</span>
          <span className="text-center">Liczba uzyc</span>
          <span>Akcje</span>
        </div>

        {
          isLoading ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">{loadingMessage}</div>
          ) : hasError ? (
            <div className="px-4 py-6 text-sm text-destructive">{errorMessage}</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            rows.map(row => (
              <div key={row.value} className="grid gap-3 border-t px-4 py-4 text-sm md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-center md:gap-4 md:py-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">{itemLabel}</span>
                  <div className="font-medium break-all">{row.value}</div>
                </div>
                <div className="flex items-center justify-between gap-3 md:block md:text-center">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">Liczba uzyc</span>
                  <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-muted px-2.5 py-1 font-medium">{row.count}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:hidden">Akcje</span>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="w-full sm:w-9"
                      aria-label={renameActionAriaLabel}
                      title={renameActionAriaLabel}
                      onClick={() => onOpenRename(row.value, row.count)}
                    >
                      {editIcon}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="w-full sm:w-9"
                      aria-label={deleteActionAriaLabel}
                      title={deleteActionAriaLabel}
                      onClick={() => onOpenDelete(row.value, row.count)}
                    >
                      {deleteIcon}
                    </Button>
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