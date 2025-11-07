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
import { useSearchPerks } from '@/application/characters/edit/details/hooks/useSearchPerks';
import TagsView from '@/common/components/TagsView';
import LoadingSpinner from '@/common/components/LoadingSpinner';
import { importIcon } from '@/presentation/icons';

type ImportPerksSheetProps = 
{
  onImportPerks: (perks: Perk[]) => void;
  isPending: boolean;
  currentPerkIds: string[];
};

export default function ImportPerksSheet({ onImportPerks, isPending, currentPerkIds }: ImportPerksSheetProps) 
{
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPerkIds, setSelectedPerkIds] = useState<Set<string>>(new Set());
  const { perks, isLoading } = useSearchPerks({ searchTerm });
  const filteredPerks = perks.filter(perk => !currentPerkIds.includes(perk.id));

  const handleTogglePerk = (perkId: string) => 
  {
    setSelectedPerkIds(prev => 
    {
      const newSet = new Set(prev);

      if (newSet.has(perkId)) 
      {
        newSet.delete(perkId);
        return newSet;
      } 
        
      newSet.add(perkId);
      return newSet;
    });
  };

  const handleToggleAll = () => 
  {
    if (selectedPerkIds.size === filteredPerks.length) 
    {
      setSelectedPerkIds(new Set());
      return;
    } 

    setSelectedPerkIds(new Set(filteredPerks.map(p => p.id)));
  };

  const handleImport = () => 
  {
    const selectedPerks = perks.filter(p => selectedPerkIds.has(p.id));
    onImportPerks(selectedPerks);
    setSelectedPerkIds(new Set());
    setOpen(false);
  };

  const selectedCount = selectedPerkIds.size;
  const allSelected = filteredPerks.length > 0 && selectedPerkIds.size === filteredPerks.length;

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
            <h1 className='first-letter:capitalize'>{displayedText.import_perks}</h1>
          </SheetTitle>
          <SheetDescription>
            <p className='first-letter:capitalize'>{displayedText.select_perks_to_import}</p>
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
                filteredPerks.length > 0 && (
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
                        filteredPerks.length === 0 
                            ? <NotFoundMessage />
                            : (
                                filteredPerks.map(perk => 
                                (
                                    <PerkSelectCard
                                        key={perk.id}
                                        perk={perk}
                                        isSelected={selectedPerkIds.has(perk.id)}
                                        onToggle={handleTogglePerk}
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

function NotFoundMessage() 
{
  return (
    <div className="col-span-2 text-center text-muted-foreground py-8">
      {displayedText.no_perks_found}
    </div>
  );
}

type PerkSelectCardProps = 
{  
  perk: Perk; 
  isSelected: boolean;
  onToggle: (id: string) => void;
};

function PerkSelectCard({ perk, isSelected, onToggle }: PerkSelectCardProps) 
{
  return (
    <Card 
      className={`cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'bg-muted hover:bg-muted/80'}`}
      onClick={() => onToggle(perk.id)}
    >
      <CardHeader className='-my-1.5'>
        <CardTitle className='flex flex-row justify-between gap-2 items-start'>
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={() => onToggle(perk.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <h1 className='text-xl'>{perk.name} {perk.grade}</h1>
          </div>
          <TagsView tags={perk.tags} variant="outline" />
        </CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className='-mt-1'>
        <CardDescription className='text-justify line-clamp-3'>
          {perk.description}
        </CardDescription>
        {
            perk.requirements.length > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                    <p className="font-semibold flex flex-row gap-1">
                        <p className='first-letter:capitalize'>{displayedText.requirements}: </p>
                        <span>{perk.requirements.join(', ')}</span>
                    </p>
                    
                </div>
            )
        }
      </CardContent>
    </Card>
  );
}
