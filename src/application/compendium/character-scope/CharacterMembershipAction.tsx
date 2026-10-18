"use client";

import { Check, Plus, Minus } from 'lucide-react';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { displayedText as t } from '@/common/translations';
import { membershipKinds, type MembershipKind } from '@/domain/characters/characterMembership';
import { ownedFilterFor, type CharacterOwnedKind } from '../characterOwnership';
import { useOptionalCompendiumCharacterScope } from './CompendiumCharacterScopeProvider';

export function CharacterMembershipAction({ kind, entityId, label }: { kind: CharacterOwnedKind; entityId: string; label: string }) {
  const scope = useOptionalCompendiumCharacterScope();
  if (!scope?.character) return null;
  const present = ownedFilterFor(scope.character, kind).values.includes(entityId);
  const mutable = membershipKinds.includes(kind as MembershipKind);
  const disabled = !scope.apiKey || scope.isError || scope.isFetching || scope.pendingCharacterId === scope.character.id;
  return <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 p-2 sm:justify-start">
    {present && <Badge variant="outline"><Check className="mr-1 size-3" />{t.compendium_owned}</Badge>}
    {mutable && <Button type="button" variant={present ? 'ghost' : 'outline'} size="sm" disabled={disabled}
      title={!scope.apiKey ? t.compendium_key_required : undefined}
      aria-label={`${present ? t.compendium_remove_from_character : t.compendium_add_to_character}: ${label} → ${scope.character.name}`}
      onClick={() => {
        // Move focus before the confirmed refresh can unmount the filtered row.
        if (scope.onlyOwned && present) document.querySelector<HTMLElement>('[data-character-owned-filter]')?.focus();
        void scope.setMembership(kind as MembershipKind, entityId, !present, label);
      }}>
      {present ? <Minus className="size-4" /> : <Plus className="size-4" />}
      {present ? t.compendium_remove_from_character : t.compendium_add_to_character}
    </Button>}
    {mutable && !scope.apiKey && <span className="text-xs text-muted-foreground">{t.compendium_key_required}</span>}
  </div>;
}
