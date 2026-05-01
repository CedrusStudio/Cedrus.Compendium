"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export type ManagedEntityRow = {
  value: string;
  count: number;
};

export type PendingManagementAction =
  | { type: 'rename'; value: string; count: number }
  | { type: 'delete'; value: string; count: number }
  | null;

type UseAdminEntityManagementOptions<TEntity extends string, TRawRow> = {
  enabled: boolean;
  initialEntity: TEntity;
  queryKeyPrefix: string;
  invalidationKeys: string[];
  getRows: (entity: TEntity) => Promise<TRawRow[]>;
  toRow: (row: TRawRow) => ManagedEntityRow;
  renameRow: (entity: TEntity, oldValue: string, newValue: string) => Promise<unknown>;
  deleteRow: (entity: TEntity, value: string) => Promise<unknown>;
};

export function useAdminEntityManagement<TEntity extends string, TRawRow>({
  enabled,
  initialEntity,
  queryKeyPrefix,
  invalidationKeys,
  getRows,
  toRow,
  renameRow,
  deleteRow,
}: UseAdminEntityManagementOptions<TEntity, TRawRow>)
{
  const [selectedEntity, setSelectedEntity] = useState<TEntity>(initialEntity);
  const [pendingAction, setPendingAction] = useState<PendingManagementAction>(null);
  const [nextValue, setNextValue] = useState('');
  const queryClient = useQueryClient();

  const { data = [], isLoading, error } = useQuery({
    queryKey: [queryKeyPrefix, selectedEntity],
    queryFn: () => getRows(selectedEntity),
    staleTime: 5 * 60 * 1000,
    enabled,
  });

  const rows = [...data].map(toRow).sort((left, right) => left.value.localeCompare(right.value));

  const resetPendingState = () => {
    setPendingAction(null);
    setNextValue('');
  };

  const invalidateEntityQueries = async (entity: TEntity) => {
    await queryClient.invalidateQueries({
      predicate: query =>
        Array.isArray(query.queryKey)
        && query.queryKey.some(key =>
          typeof key === 'string'
          && (key === entity || key === queryKeyPrefix || invalidationKeys.includes(key))),
    });
  };

  const renameMutation = useMutation({
    mutationFn: () => renameRow(selectedEntity, pendingAction?.value ?? '', nextValue),
    onSuccess: async () => {
      await invalidateEntityQueries(selectedEntity);
      resetPendingState();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRow(selectedEntity, pendingAction?.value ?? ''),
    onSuccess: async () => {
      await invalidateEntityQueries(selectedEntity);
      resetPendingState();
    },
  });

  return {
    selectedEntity,
    setSelectedEntity: (entity: TEntity) => {
      setSelectedEntity(entity);
      resetPendingState();
    },
    pendingAction,
    nextValue,
    setNextValue,
    rows,
    isLoading,
    hasError: Boolean(error),
    renameMutation,
    deleteMutation,
    openRename: (value: string, count: number) => {
      setPendingAction({ type: 'rename', value, count });
      setNextValue('');
    },
    openDelete: (value: string, count: number) => {
      setPendingAction({ type: 'delete', value, count });
      setNextValue('');
    },
    cancelAction: resetPendingState,
  };
}