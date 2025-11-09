"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/ui/sheet';
import { displayedText } from '@/presentation/translations';
import { Input } from '@/ui/input';
import LoadingSpinner from '@/common/components/LoadingSpinner';
import { importIcon } from '@/presentation/icons';

type ImportItemsSheetProps<TItem extends { id: string }> = 
{
  importTitle: string;
  importDescription: string;
  notFoundText: string;

  onImport: (items: TItem[]) => void;
  isPending: boolean;
  currentItemsIds: string[];
  useSearchItems: (params: { searchTerm: string, enabled: boolean }) => { data: TItem[]; isLoading: boolean; error: Error | null };
  renderItem: (item: TItem, isSelected: boolean, onToggle: (id: string) => void) => React.ReactNode;
  gridColumns?: 1 | 2 | 3 | 4;
};

export default function ImportItemsSheet<TItem extends { id: string }>
(
  {
    importTitle,
    importDescription,
    notFoundText,
    onImport,
    isPending,
    currentItemsIds,
    useSearchItems,
    renderItem,
    gridColumns = 2
  }
    : ImportItemsSheetProps<TItem>
) 
{
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemsIds, setSelectedItemsIds] = useState<Set<string>>(new Set());
  const itemsCache = useRef<Map<string, TItem>>(new Map());
  const { data: items, isLoading } = useSearchItems({ searchTerm, enabled: open });
  const filteredItems = items.filter(item => !currentItemsIds.includes(item.id));

  useEffect(() => 
  {
    items.forEach(item => 
    {
      itemsCache.current.set(item.id, item);
    });
  }, [items]);

  const handleToggleItem = (itemId: string) => 
  {
    setSelectedItemsIds(prev => 
    {
      const newSet = new Set(prev);

      if (newSet.has(itemId)) 
      {
        newSet.delete(itemId);
        return newSet;
      } 
        
      newSet.add(itemId);
      return newSet;
    });
  };

  const handleToggleAll = () => 
  {
    if (selectedItemsIds.size === filteredItems.length) 
    {
      setSelectedItemsIds(new Set());
      return;
    } 

    setSelectedItemsIds(new Set(filteredItems.map(p => p.id)));
  };

  const handleImport = () => 
  {
    const selectedItems = Array.from(selectedItemsIds)
      .map(id => itemsCache.current.get(id))
      .filter((item): item is TItem => item !== undefined);
    
    onImport(selectedItems);
    setSelectedItemsIds(new Set());
    setSearchTerm("");
    setOpen(false);
  };

  const selectedCount = selectedItemsIds.size;
  const allSelected = filteredItems.length > 0 && selectedItemsIds.size === filteredItems.length;
  const visibleSelectedCount = filteredItems.filter(p => selectedItemsIds.has(p.id)).length;
  const hiddenSelectedCount = selectedCount - visibleSelectedCount;
  const gridColsClass = `grid-cols-1 lg:grid-cols-${gridColumns}`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>

      <SheetTrigger asChild>
        <Button variant="outline" type="button" size="icon" disabled={isPending}>
          {importIcon}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        
        <SheetHeader>
          <SheetTitle className='first-letter:capitalize'>
            {importTitle}
          </SheetTitle>
          <SheetDescription className='first-letter:capitalize'>
            {importDescription}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <div className="flex gap-2 items-center">
            <Input
              placeholder={displayedText.searchByName}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1"
            />

            {
              filteredItems.length > 0 && (
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={handleToggleAll}
                >
                  <span className='first-letter:capitalize'>{allSelected ? displayedText.deselect_all : displayedText.select_all}</span>
                </Button>
              )
            }
          </div>

          {
            hiddenSelectedCount > 0 && (
              <div className="text-sm text-muted-foreground text-center p-2 bg-primary/10 rounded-md">
                {hiddenSelectedCount} {displayedText.selected_items_hidden_by_filter}
              </div>
            )
          }

          {
            isLoading 
              ? <LoadingSpinner />
              : <div className={`grid ${gridColsClass} gap-4`}>
                {
                  filteredItems.length === 0 
                    ? <NotFoundMessage notFoundText={notFoundText} />
                    : filteredItems.map(item => (
                        <div key={item.id}>
                          {renderItem(item, selectedItemsIds.has(item.id), handleToggleItem)}
                        </div>
                      ))
                }
                </div>
            }
        </div>

        <SheetFooter>
          <div className="flex place-content-center w-full">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => setOpen(false)}
              >
                <span className='first-letter:capitalize'>{displayedText.cancel}</span>
              </Button>
              <Button 
                variant="default" 
                type="button"
                onClick={handleImport}
                disabled={selectedCount === 0}
              >
                <span className='first-letter:capitalize'>{displayedText.import} ({selectedCount})</span>
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function NotFoundMessage({ notFoundText }: { notFoundText: string }) 
{
  return (
    <div className="col-span-2 text-center text-muted-foreground py-8">
      {notFoundText}
    </div>
  );
}