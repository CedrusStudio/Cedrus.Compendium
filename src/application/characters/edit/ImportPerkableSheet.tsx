"use client";

import { useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Separator } from '@/ui/separator';
import { displayedText } from '@/presentation/translations';
import { Input } from '@/ui/input';
import { Checkbox } from '@/ui/checkbox';
import { Perk } from '@/domain/characters/Perk';
import TagsView from '@/common/components/TagsView';
import LoadingSpinner from '@/common/components/LoadingSpinner';
import { importIcon } from '@/presentation/icons';

type ImportPerksSheetProps<TPerkable extends Perk> = 
{
  importTitle: string;
  importDescription: string;
  notFoundText: string;

  onImport: (perks: TPerkable[]) => void;
  isPending: boolean;
  currentPerkableIds: string[];
  useSearchPerkables: (params: { searchTerm: string, enabled: boolean }) => { data: TPerkable[]; isLoading: boolean; error: Error | null };
};

export default function ImportPerkableSheet<TPerkable extends Perk>
(
  {
    importTitle,
    importDescription,
    notFoundText,
    onImport,
    isPending,
    currentPerkableIds,
    useSearchPerkables
  }
    : ImportPerksSheetProps<TPerkable>
) 
{
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerkableIds, setSelectedPerkableIds] = useState<Set<string>>(new Set());
  const { data: perkables, isLoading } = useSearchPerkables({ searchTerm, enabled: open });
  const filteredPerkables = perkables.filter(perk => !currentPerkableIds.includes(perk.id));

  const handleTogglePerkable = (perkableId: string) => 
  {
    setSelectedPerkableIds(prev => 
    {
      const newSet = new Set(prev);

      if (newSet.has(perkableId)) 
      {
        newSet.delete(perkableId);
        return newSet;
      } 
        
      newSet.add(perkableId);
      return newSet;
    });
  };

  const handleToggleAll = () => 
  {
    if (selectedPerkableIds.size === filteredPerkables.length) 
    {
      setSelectedPerkableIds(new Set());
      return;
    } 

    setSelectedPerkableIds(new Set(filteredPerkables.map(p => p.id)));
  };

  const handleImport = () => 
  {
    const selectedPerkables = perkables.filter(p => selectedPerkableIds.has(p.id));
    onImport(selectedPerkables);
    setSelectedPerkableIds(new Set());
    setOpen(false);
  };

  const selectedCount = selectedPerkableIds.size;
  const allSelected = filteredPerkables.length > 0 && selectedPerkableIds.size === filteredPerkables.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>

      <SheetTrigger asChild>
        <Button variant="outline" type="button" size="icon" disabled={isPending}>
          {importIcon}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        
        <SheetHeader>
          <SheetTitle>
            <h1 className='first-letter:capitalize'>{importTitle}</h1>
          </SheetTitle>
          <SheetDescription>
            <p className='first-letter:capitalize'>{importDescription}</p>
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
              filteredPerkables.length > 0 && (
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
            isLoading 
              ? <LoadingSpinner />
              : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {
                    filteredPerkables.length === 0 
                      ? <NotFoundMessage notFoundText={notFoundText} />
                      : (
                          filteredPerkables.map(perkable => 
                          (
                            <PerkableSelectCard
                              key={perkable.id}
                              perkable={perkable}
                              isSelected={selectedPerkableIds.has(perkable.id)}
                              onToggle={handleTogglePerkable}
                            />
                          ))
                        )
                  }
                  </div>
              )
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

type PerkableSelectCardProps<TPerkable extends Perk> = 
{  
  perkable: TPerkable; 
  isSelected: boolean;
  onToggle: (id: string) => void;
};

function PerkableSelectCard<TPerkable extends Perk>({ perkable, isSelected, onToggle }: PerkableSelectCardProps<TPerkable>) 
{
  return (
    <Card 
      className={`cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'bg-muted hover:bg-muted/80'}`}
      onClick={() => onToggle(perkable.id)}
    >
      <CardHeader className='-my-1.5'>
        <CardTitle className='flex flex-row justify-between gap-2 items-start'>
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={() => onToggle(perkable.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <h1 className='text-xl'>{perkable.name} {perkable.grade}</h1>
          </div>
          <TagsView tags={perkable.tags} variant="outline" />
        </CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className='-mt-1'>
        <CardDescription className='text-justify line-clamp-3'>
          {perkable.description}
        </CardDescription>
        {
          perkable.requirements.length > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              <p className="font-semibold flex flex-row gap-1">
                  <p className='first-letter:capitalize'>{displayedText.requirements}: </p>
                  <span>{perkable.requirements.join(', ')}</span>
              </p>
            </div>
          )
        }
      </CardContent>
    </Card>
  );
}
