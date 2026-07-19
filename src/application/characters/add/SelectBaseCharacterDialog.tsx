"use client";

import { useCallback, useState } from 'react';
import { Button } from '@/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/ui/sheet';
import { displayedText } from '@/common/translations';
import CharacterPickerGrid from '@/application/characters/components/CharacterPickerGrid';

type SelectBaseCharacterDialogProps =
{
  onSelectCharacter: (characterId: string) => void;
  selectedCharacterName?: string;
  selectedCharacterShortName?: string;
  selectedCharacterTags?: string[];
  selectedCharacterId?: string;
};

export default function SelectBaseCharacterDialog({
  onSelectCharacter,
  selectedCharacterName,
  selectedCharacterShortName,
  selectedCharacterTags,
  selectedCharacterId,
}: SelectBaseCharacterDialogProps)
{
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback((characterId: string) =>
  {
    onSelectCharacter(characterId);
    setOpen(false);
  }, [onSelectCharacter]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>

      <SheetTrigger asChild>
        <Button variant="outline" type="button" className="w-full">
            <span className='first-letter:capitalize'>
              {selectedCharacterName ? `${displayedText.selected}: ${selectedCharacterName}` : displayedText.select_base_character}
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

        <CharacterPickerGrid
          onSelectCharacter={handleSelect}
          selectedCharacterId={selectedCharacterId}
          selectedCharacterName={selectedCharacterName}
          selectedCharacterShortName={selectedCharacterShortName}
          selectedCharacterTags={selectedCharacterTags}
        />
      </SheetContent>
    </Sheet>
  );
}
