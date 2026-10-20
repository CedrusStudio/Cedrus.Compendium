"use client";

import { useState } from 'react';
import Link from 'next/link';
import { User, X } from 'lucide-react';
import { Button } from '@/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/ui/sheet';
import CharacterPickerGrid from '@/application/characters/components/CharacterPickerGrid';
import { displayedText as t } from '@/common/translations';
import { useOptionalCompendiumCharacterScope } from './CompendiumCharacterScopeProvider';
import { CharacterScopeQuickAccess } from './CharacterScopeQuickAccess';

export function CompendiumCharacterSelector() {
  const scope = useOptionalCompendiumCharacterScope();
  const [open, setOpen] = useState(false);
  if (!scope) return null;
  return <div className="flex flex-wrap items-center gap-2">
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="max-w-60 gap-2">
          <User className="size-4 shrink-0" />
          <span className="truncate">{scope.character ? `${t.compendium_character}: ${scope.character.name}` : scope.isLoading ? t.compendium_loading : t.compendium_select_character}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t.compendium_select_character}</SheetTitle>
          <SheetDescription>{t.compendium_character_scope_description}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 p-4">
          {scope.selectedCharacterId && <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline"><Link href={`/characters/${scope.selectedCharacterId}`}>{t.compendium_open_character}</Link></Button>
            <Button variant="ghost" onClick={() => { scope.selectCharacter(); setOpen(false); }}><X className="size-4" />{t.compendium_clear_character}</Button>
          </div>}
          <CharacterScopeQuickAccess apiKey={scope.apiKey} selectedCharacterId={scope.selectedCharacterId}
            onSelect={id => { scope.selectCharacter(id); setOpen(false); }} />
          <section aria-label="Wyszukaj postać">
            <CharacterPickerGrid selectedCharacterId={scope.selectedCharacterId} selectedCharacterName={scope.character?.name}
              onSelectCharacter={id => { scope.selectCharacter(id); setOpen(false); }} />
          </section>
        </div>
      </SheetContent>
    </Sheet>
    {scope.isError && <div role="alert" className="flex items-center gap-2 text-sm text-destructive">
      {t.compendium_refresh_failed}<Button variant="outline" size="sm" onClick={scope.retry}>{t.compendium_retry}</Button>
    </div>}
  </div>;
}
