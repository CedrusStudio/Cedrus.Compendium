"use client";

import { useState, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { displayedText } from "@/common/translations";
import { Character } from "@/domain/characters/Character";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/dropdown-menu";
import CharacterModesViewDrawer from "@/application/bestiary/drawers/CharacterModesViewDrawer";
import CharacterManeuversViewDrawer from "@/application/bestiary/drawers/CharacterManeuversViewDrawer";
import CharacterPowersViewDrawer from "@/application/bestiary/drawers/CharacterPowersViewDrawer";
import CharacterPerksViewDrawer from "@/application/bestiary/drawers/CharacterPerksViewDrawer";

type CharacterMoreActionsMenuProps = {
  character: Character;
  extraMenuItems?: ReactNode;
};

export default function CharacterMoreActionsMenu({ character, extraMenuItems }: CharacterMoreActionsMenuProps)
{
  const [isModesDrawerOpen, setIsModesDrawerOpen] = useState(false);
  const [isManeuversDrawerOpen, setIsManeuversDrawerOpen] = useState(false);
  const [isPowersDrawerOpen, setIsPowersDrawerOpen] = useState(false);
  const [isPerksDrawerOpen, setIsPerksDrawerOpen] = useState(false);
  const hasModes = character.stances.length > 0 || character.states.length > 0;
  const hasManeuvers = character.maneuvers.length > 0;
  const hasPowers = character.powers.length > 0;
  const hasPerks = character.perks.length > 0;
  const hasExtraMenuItems = extraMenuItems !== undefined && extraMenuItems !== null && extraMenuItems !== false;
  const hasAnyActions = hasModes || hasManeuvers || hasPowers || hasPerks || hasExtraMenuItems;

  if (!hasAnyActions)
  {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" aria-label={displayedText.actions}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="capitalize">{displayedText.actions}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          { hasModes && <DropdownMenuItem onClick={() => setIsModesDrawerOpen(true)}><span className="first-letter:uppercase">{displayedText.showStancesStates}</span></DropdownMenuItem>}
          { hasManeuvers && <DropdownMenuItem onClick={() => setIsManeuversDrawerOpen(true)}><span className="first-letter:uppercase">{displayedText.showManeuvers}</span></DropdownMenuItem>}
          { hasPerks && <DropdownMenuItem onClick={() => setIsPerksDrawerOpen(true)}><span className="first-letter:uppercase">{displayedText.showPerks}</span></DropdownMenuItem>}
          { hasPowers && <DropdownMenuItem onClick={() => setIsPowersDrawerOpen(true)}><span className="first-letter:uppercase">{displayedText.showPowers}</span></DropdownMenuItem>}
          {extraMenuItems}
        </DropdownMenuContent>
      </DropdownMenu>

      <CharacterModesViewDrawer
        character={character}
        open={isModesDrawerOpen}
        onOpenChange={setIsModesDrawerOpen}
      />

      <CharacterManeuversViewDrawer
        character={character}
        open={isManeuversDrawerOpen}
        onOpenChange={setIsManeuversDrawerOpen}
      />

      <CharacterPowersViewDrawer
        character={character}
        open={isPowersDrawerOpen}
        onOpenChange={setIsPowersDrawerOpen}
      />

      <CharacterPerksViewDrawer
        character={character}
        open={isPerksDrawerOpen}
        onOpenChange={setIsPerksDrawerOpen}
      />
    </>
  );
}