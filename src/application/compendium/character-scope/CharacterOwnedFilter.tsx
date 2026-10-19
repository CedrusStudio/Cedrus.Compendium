"use client";

import { useMemo } from 'react';
import { Checkbox } from '@/ui/checkbox';
import { displayedText as t } from '@/common/translations';
import { ownedFilterFor, ownedFilterKey, type CharacterOwnedKind } from '../characterOwnership';
import { useOptionalCompendiumCharacterScope } from './CompendiumCharacterScopeProvider';

export function CharacterOwnedFilter({ kind }: { kind: CharacterOwnedKind }) {
  const scope = useOptionalCompendiumCharacterScope();
  if (!scope?.selectedCharacterId) return null;
  const empty = scope?.character && scope.onlyOwned && ownedFilterFor(scope.character, kind).values.length === 0;
  return <div className="flex flex-wrap items-center gap-2"><label className="flex h-9 items-center gap-2 whitespace-nowrap rounded-md border px-2 text-sm">
    <Checkbox data-character-owned-filter checked={scope?.onlyOwned ?? false} disabled={!scope?.character || scope.isError}
      onCheckedChange={checked => scope?.setOnlyOwned(checked === true)} />
    {t.compendium_only_owned}
  </label>{empty && <span role="status" className="text-sm text-muted-foreground">{t.compendium_empty_owned}</span>}</div>;
}

export function useCharacterOwnedFilter(kind: CharacterOwnedKind) {
  const scope = useOptionalCompendiumCharacterScope();
  const character = scope?.character;
  const active = !!scope?.onlyOwned && !!scope.selectedCharacterId;
  const filter = useMemo(() => active ? character ? ownedFilterFor(character, kind) : { values: [] } : null, [active, character, kind]);
  const key = JSON.stringify([scope?.selectedCharacterId ?? '', scope?.apiKey ?? '', active, ownedFilterKey(filter)]);
  return { filter, key };
}
