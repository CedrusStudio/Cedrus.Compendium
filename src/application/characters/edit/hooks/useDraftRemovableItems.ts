import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type UseDraftRemovableItemsParams<TItem extends { id: string }> =
{
  items: TItem[];
  initialItems: TItem[];
  isPending: boolean;
  isSuccess: boolean;
  append: (item: TItem) => void;
  remove: (index: number) => void;
  cloneItem: (item: TItem) => TItem;
};

export function useDraftRemovableItems<TItem extends { id: string }>
({ items, initialItems, isPending, isSuccess, append, remove, cloneItem }: UseDraftRemovableItemsParams<TItem>)
{
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [removedItemsById, setRemovedItemsById] = useState<Map<string, TItem>>(new Map());
  const initialItemIdsRef = useRef(new Set(initialItems.map(item => item.id)));
  const previousIsPendingRef = useRef(isPending);

  useEffect(() =>
  {
    if (previousIsPendingRef.current && !isPending && isSuccess)
    {
      initialItemIdsRef.current = new Set(items.map(item => item.id));
      setImportedIds(new Set());
      setRemovedItemsById(new Map());
    }

    previousIsPendingRef.current = isPending;
  }, [isPending, isSuccess, items]);

  const registerImportedItems = useCallback((importedItems: TItem[]) =>
  {
    importedItems.forEach(item => append(cloneItem(item)));

    setImportedIds(prev =>
    {
      const next = new Set(prev);
      importedItems.forEach(item => next.add(item.id));
      return next;
    });
  }, [append, cloneItem]);

  const removeItemAtIndex = useCallback((index: number) =>
  {
    const item = items[index];

    if (!item)
    {
      return;
    }

    if (initialItemIdsRef.current.has(item.id))
    {
      setRemovedItemsById(prev =>
      {
        const next = new Map(prev);
        next.set(item.id, cloneItem(item));
        return next;
      });
    }
    else
    {
      setImportedIds(prev =>
      {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }

    remove(index);
  }, [cloneItem, items, remove]);

  const removeItemById = useCallback((itemId: string) =>
  {
    const index = items.findIndex(item => item.id === itemId);

    if (index === -1)
    {
      return;
    }

    removeItemAtIndex(index);
  }, [items, removeItemAtIndex]);

  const restoreRemovedItem = useCallback((itemId: string) =>
  {
    const item = removedItemsById.get(itemId);

    if (!item)
    {
      return;
    }

    append(cloneItem(item));
    setRemovedItemsById(prev =>
    {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
  }, [append, cloneItem, removedItemsById]);

  const removedItems = useMemo(() => Array.from(removedItemsById.values()), [removedItemsById]);
  const removedItemIds = useMemo(() => removedItems.map(item => item.id), [removedItems]);

  return {
    importedIds,
    isRemoved: (itemId: string) => removedItemsById.has(itemId),
    registerImportedItems,
    removedItemIds,
    removedItems,
    removeItemAtIndex,
    removeItemById,
    restoreRemovedItem,
  };
}