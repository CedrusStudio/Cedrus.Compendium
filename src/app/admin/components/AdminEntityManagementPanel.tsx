"use client";

import Link from 'next/link';
import { useState } from 'react';
import SelectOneOfStrings from '@/common/components/selects/SelectOneOfStrings';
import { Input } from '@/common/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/common/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/common/components/ui/sheet';
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
  /** Optional extra action(s) rendered per row, e.g. "structure this requirement". */
  extraRowActions?: (row: ManagedEntityRow) => React.ReactNode;
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
  extraRowActions,
}: AdminEntityManagementPanelProps<TEntity>)
{
  const [filterText, setFilterText] = useState('');

  const [filterEntity, setFilterEntity] = useState(selectedEntity);
  if (filterEntity !== selectedEntity) {
    setFilterEntity(selectedEntity);
    setFilterText('');
  }

  const filteredRows = filterText.trim()
    ? rows.filter(row => row.value.toLowerCase().includes(filterText.toLowerCase()))
    : rows;

  const isRenameOpen = pendingAction?.type === 'rename';
  const isDeleteOpen = pendingAction?.type === 'delete';

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

      <div className="flex flex-wrap items-center gap-3">
        <SelectOneOfStrings
          id={selectorId}
          value={selectedEntity}
          items={entitySelectItems}
          onChange={value => onSelectedEntityChange(value as TEntity)}
          triggerClassName="h-11 w-36 border bg-background px-3 py-2 text-sm shadow-sm md:w-36"
        />
        <Input
          placeholder="Filtruj..."
          value={filterText}
          onChange={event => setFilterText(event.target.value)}
          className="h-9 w-70 border bg-background px-3 py-2 text-sm shadow-sm md:w-56"
        />
      </div>

      <Sheet open={isRenameOpen} onOpenChange={open => { if (!open) onCancelAction(); }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Potwierdzenie operacji</SheetTitle>
            <SheetDescription>
              {
                pendingAction?.type === 'rename'
                  ? getRenameConfirmationMessage(pendingAction.value, pendingAction.count)
                  : undefined
              }
            </SheetDescription>
          </SheetHeader>

          <form
            className="flex flex-1 flex-col gap-4 px-4"
            onSubmit={event => {
              event.preventDefault();
              onConfirmRename();
            }}
          >
            <Input
              placeholder={renameInputPlaceholder}
              value={nextValue}
              onChange={event => onNextValueChange(event.target.value)}
              autoFocus
            />

            <SheetFooter className="px-0 pb-0">
              <Button type="submit" disabled={!nextValue.trim() || isRenamePending}>
                {confirmRenameButtonLabel}
              </Button>
              <Button type="button" variant="outline" onClick={onCancelAction}>
                {cancelButtonLabel}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteOpen} onOpenChange={open => { if (!open) onCancelAction(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potwierdzenie operacji</AlertDialogTitle>
            <AlertDialogDescription>
              {
                pendingAction?.type === 'delete'
                  ? getDeleteConfirmationMessage(pendingAction.value, pendingAction.count)
                  : undefined
              }
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>{cancelButtonLabel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletePending}
              onClick={event => {
                event.preventDefault();
                onConfirmDelete();
              }}
            >
              {confirmDeleteButtonLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          ) : filteredRows.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Brak wyników dla podanego filtra.</div>
          ) : (
            filteredRows.map(row => (
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
                    {extraRowActions?.(row)}
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
