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
} from '@/ui/sheet';
import { Card, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { displayedText } from '@/presentation/translations';
import { useSearchCharactersSummary } from '@/application/characters/hooks/useSearchCharactersSummary';
import { CharacterSummary } from '@/infrastructure/searchQueries/characters/createCharacterSummaryQuery';
import TagsView from '@/common/components/tags/TagsView';
import { Input } from '@/ui/input';
import { emptyUlid } from '@/common/global/pagination';
import { useDebounce } from 'use-debounce';

type SelectBaseCharacterDialogProps = {
  onSelectCharacter: (characterId: string) => void;
  selectedCharacterId?: string;
};

export default function SelectBaseCharacterDialog({ onSelectCharacter, selectedCharacterId }: SelectBaseCharacterDialogProps) 
{
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const { characters } = useSearchCharactersSummary(debouncedSearchTerm, emptyUlid);

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  const handleSelect = (characterId: string) => 
  {
    onSelectCharacter(characterId);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>

      <SheetTrigger asChild>
        <Button variant="outline" type="button" className="w-full">
            <span className='first-letter:capitalize'>
                {selectedCharacter ? `${displayedText.selected}: ${selectedCharacter.name}` : displayedText.select_base_character}
            </span>
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        
        <SheetHeader>
          <SheetTitle>
            <h1 className='first-letter:capitalize'>{displayedText.select_base_character}</h1>
          </SheetTitle>
          <SheetDescription>
            <p className='first-letter:capitalize'>{displayedText.select_character_to_base_new_one}</p>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <Input
            placeholder={displayedText.searchByName}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {
              characters.length === 0 
                  ? <NotFoundMessage />
                  : (
                      characters.map(summary => 
                      (
                        <CharacterSelectCard
                            key={summary.id}
                            summary={summary}
                            onSelect={handleSelect}
                            isSelected={summary.id === selectedCharacterId}
                        />
                      ))
                  )
            }
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function NotFoundMessage() 
{
  return (
    <div className="col-span-2 text-center text-muted-foreground py-8">
        {displayedText.no_characters_found}
    </div>
  );
}

type CharacterSelectCardProps = 
{  
  summary: CharacterSummary; 
  onSelect: (id: string) => void;
  isSelected: boolean;
};

function CharacterSelectCard({ summary, onSelect, isSelected }: CharacterSelectCardProps) 
{
  return (
    <Card 
      className={`cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/10' : 'bg-muted hover:bg-muted/80'}`}
      onClick={() => onSelect(summary.id)}
    >
      <CardHeader>
        <CardTitle className='flex flex-row justify-between gap-2'>
          <h1 className='text-xl'>{summary.name}</h1>
          <TagsView tags={summary.tags} variant="outline" />
        </CardTitle>
        <CardDescription>{summary.shortName}</CardDescription>
      </CardHeader>
    </Card>
  );
}
