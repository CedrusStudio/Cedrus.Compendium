import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useState } from 'react';
import { useDraftRemovableItems } from '../useDraftRemovableItems';

type TestItem =
{
  id: string;
  name: string;
};

function useDraftRemovableItemsHarness(initialItems: TestItem[])
{
  const [items, setItems] = useState<TestItem[]>(initialItems);
  const draftState = useDraftRemovableItems<TestItem>
  ({
    items,
    initialItems,
    isPending: false,
    isSuccess: false,
    append: item => setItems(prev => [...prev, item]),
    remove: index => setItems(prev => prev.filter((_, itemIndex) => itemIndex !== index)),
    cloneItem: item => ({ ...item }),
  });

  return {
    items,
    addLocalItem: (item: TestItem) => setItems(prev => [...prev, item]),
    ...draftState,
  };
}

describe('useDraftRemovableItems', () => {
  it('marks deleted imported items as removed and restores them with the imported marker intact', () => {
    const { result } = renderHook(() => useDraftRemovableItemsHarness([{ id: 'persisted-1', name: 'Persisted' }]));

    act(() => {
      result.current.registerImportedItems([{ id: 'imported-1', name: 'Imported' }]);
    });

    expect(result.current.items.map(item => item.id)).toEqual(['persisted-1', 'imported-1']);
    expect(result.current.importedIds.has('imported-1')).toBe(true);

    act(() => {
      result.current.removeItemAtIndex(1);
    });

    expect(result.current.items.map(item => item.id)).toEqual(['persisted-1']);
    expect(result.current.removedItemIds).toEqual(['imported-1']);
    expect(result.current.importedIds.has('imported-1')).toBe(true);

    act(() => {
      result.current.restoreRemovedItem('imported-1');
    });

    expect(result.current.items.map(item => item.id)).toEqual(['persisted-1', 'imported-1']);
    expect(result.current.removedItemIds).toEqual([]);
    expect(result.current.importedIds.has('imported-1')).toBe(true);
  });

  it('marks deleted locally added items as removed instead of dropping them permanently', () => {
    const { result } = renderHook(() => useDraftRemovableItemsHarness([{ id: 'persisted-1', name: 'Persisted' }]));

    act(() => {
      result.current.addLocalItem({ id: 'local-1', name: 'Local' });
    });

    expect(result.current.items.map(item => item.id)).toEqual(['persisted-1', 'local-1']);

    act(() => {
      result.current.removeItemAtIndex(1);
    });

    expect(result.current.items.map(item => item.id)).toEqual(['persisted-1']);
    expect(result.current.removedItemIds).toEqual(['local-1']);

    act(() => {
      result.current.restoreRemovedItem('local-1');
    });

    expect(result.current.items.map(item => item.id)).toEqual(['persisted-1', 'local-1']);
    expect(result.current.removedItemIds).toEqual([]);
  });
});