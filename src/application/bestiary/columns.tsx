"use client";

import InitiativeCell from "@/application/bestiary/battle/InitiativeCell";
import { Button } from "@/common/components/ui/button";
import { Character } from "@/domain/characters/Character";
import { AccessorKeyColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { attributesIcons, characteristicIcons } from "@/presentation/icons";
import { useState } from "react";
import { Checkbox } from "@/common/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/dropdown-menu";
import { getStatisticTotalTestValue } from "@/domain/characters/statistics/Statistic";
import { calculateTotalHealthForCharacter } from "@/domain/characters/combat/Health";
import { displayedText } from "@/presentation/translations";
import TagsView from "@/common/components/tags/TagsView";
import CharacterPerksViewDrawer from "@/application/bestiary/drawers/CharacterPerksViewDrawer";
import CharacterPowersViewDrawer from "@/application/bestiary/drawers/CharacterPowersViewDrawer";
import CharacterManeuversViewDrawer from "@/application/bestiary/drawers/CharacterManeuversViewDrawer";
import CharacterNameView from "@/application/bestiary/views/CharacterNameView";
import CharacterDefensesBattleView from "@/application/bestiary/views/CharacterDefensesBattleView";
import CharacterOffensesBattleView from "@/application/bestiary/views/CharacterOffensesBattleView";
import CharacterModesViewDrawer from "@/application/bestiary/drawers/CharacterModesViewDrawer";

export const columnKeys =
{
  select: "select",
  name: "name",
  tags: "tags",
  initiative: "initiative",
  health: "health",
  barrier: "barrier",
  defense: "defense",
  offense: "offense",
  attributes: "attributes",
  characteristics: "characteristics",
  actions: "actions",
} as const;

export const columns: AccessorKeyColumnDef<Character & { __initiative: number | null }>[] = 
[
  {
    id: columnKeys.select,
    accessorKey: columnKeys.select,
    header: ({ table }) => (
      <Checkbox checked=
        {
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={value => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: columnKeys.name,
    accessorKey: columnKeys.name,
    header: () => <span className="capitalize">{displayedText[columnKeys.name]}</span>,
    cell: ({ row }) => <CharacterNameView character={row.original} />,
    enableHiding: false
  },
  {
    id: columnKeys.tags,
    accessorKey: columnKeys.tags,
    cell: ({ row }) => <TagsView tags={row.original.tags} />,
    header: () => <span className="capitalize">{displayedText[columnKeys.tags]}</span>,
    meta: { initiallyHidden: true },
  },
  {
    id: columnKeys.initiative,
    accessorKey: columnKeys.initiative,
    cell: ({ row }) => <InitiativeCell id={row.original.id} initiative={row.original.attributes.initiative} />,
    header: ({ column }) => ( 
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        <span className="capitalize">{displayedText[columnKeys.initiative]}</span> <ArrowUpDown />
      </Button>
    ),
    sortingFn: (rowA, rowB) => 
    {
      const initiativeA = rowA.original.__initiative;
      const initiativeB = rowB.original.__initiative;
      
      if (initiativeA === null && initiativeB === null) return 0;
      if (initiativeA === null) return 1;
      if (initiativeB === null) return -1;
      
      return initiativeB - initiativeA; // Descending order (highest first)
    },
    meta: { initiallyHidden: false },
  },
  {
    id: columnKeys.health,
    accessorKey: columnKeys.health,
    cell: ({ row }) => <CharacterHealthBattleView character={row.original} />,
    header: () => <span className="capitalize">{displayedText[columnKeys.health]}</span>
  },
  {
    id: columnKeys.defense,
    accessorKey: columnKeys.defense,
    cell: ({ row }) => row.original.defenses.length > 0 ? <CharacterDefensesBattleView character={row.original} /> : null,
    header: () => <span className="capitalize">{displayedText[columnKeys.defense]}</span>
  },
  {
    id: columnKeys.offense,
    accessorKey: columnKeys.offense,
    cell: ({ row }) => row.original.offenses.length > 0 ? <CharacterOffensesBattleView character={row.original} /> : null,
    header: () => <span className="capitalize">{displayedText[columnKeys.offense]}</span>
  },
  {
    id: columnKeys.characteristics,
    accessorKey: columnKeys.characteristics,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">{characteristicIcons.strength} {getStatisticTotalTestValue(row.original.characteristics.strength)}</div>
        <div className="flex flex-wrap gap-2">{characteristicIcons.dexterity} {getStatisticTotalTestValue(row.original.characteristics.dexterity)}</div>
        <div className="flex flex-wrap gap-2">{characteristicIcons.constitution} {getStatisticTotalTestValue(row.original.characteristics.constitution)}</div>
      </div>
    ),
    header: () => <span className="capitalize">{displayedText[columnKeys.characteristics]}</span>,
    meta: { initiallyHidden: true },
  },
  {
    id: columnKeys.attributes,
    accessorKey: columnKeys.attributes,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">{attributesIcons.initiative} {getStatisticTotalTestValue(row.original.attributes.initiative)}</div>
        <div className="flex flex-wrap gap-2">{attributesIcons.fencing} {getStatisticTotalTestValue(row.original.attributes.fencing)}</div>
        <div className="flex flex-wrap gap-2">{attributesIcons.artifice} {getStatisticTotalTestValue(row.original.attributes.artifice)}</div>
        <div className="flex flex-wrap gap-2">{attributesIcons.martialArt} {getStatisticTotalTestValue(row.original.attributes.martialArt)}</div>
        <div className="flex flex-wrap gap-2">{attributesIcons.precision} {getStatisticTotalTestValue(row.original.attributes.precision)}</div>
        <div className="flex flex-wrap gap-2 ml-5">{attributesIcons.fortitude} {getStatisticTotalTestValue(row.original.attributes.fortitude)}</div>
        <div className="flex flex-wrap gap-2">{attributesIcons.reflex} {getStatisticTotalTestValue(row.original.attributes.reflex)}</div>
        <div className="flex flex-wrap gap-2">{attributesIcons.willpower} {getStatisticTotalTestValue(row.original.attributes.willpower)}</div>
      </div>
    ),
    header: () => <span className="capitalize">{displayedText[columnKeys.attributes]}</span>,
    meta: { initiallyHidden: true },
  },
  {
    id: columnKeys.actions,
    accessorKey: columnKeys.actions,
    cell: ({ row }) => <MoreBattleActions character={row.original} />,
    header: '',
    enableHiding: false,
  },
];

function CharacterHealthBattleView({ character }: {character: Character})
{
  const totalHealth = calculateTotalHealthForCharacter(character);

  return (
    <div className="flex flex-row place-items-center gap-1">
      <span>{totalHealth} {character.health.barrier > 0 && `+${character.health.barrier}`}</span>
      <span>{character.health.lethalHealth > 0 ? `(-${character.health.lethalHealth})` : null} [{character.health.recoveryLevel}]</span>
    </div>
  );
}

function MoreBattleActions({ character }: { character: Character })
{
  const [isModesDrawerOpen, setIsModesDrawerOpen] = useState(false);
  const [isManeuversDrawerOpen, setIsManeuversDrawerOpen] = useState(false);
  const [isPowersDrawerOpen, setIsPowersDrawerOpen] = useState(false);
  const [isPerksDrawerOpen, setIsPerksDrawerOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="capitalize">{displayedText.actions}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsModesDrawerOpen(true)}><span className="first-letter:uppercase">{displayedText.showStancesStates}</span></DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsManeuversDrawerOpen(true)}><span className="first-letter:uppercase">{displayedText.showManeuvers}</span></DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsPerksDrawerOpen(true)}><span className="first-letter:uppercase">{displayedText.showPerks}</span></DropdownMenuItem>
          { character.powers.length > 0 && <DropdownMenuItem onClick={() => setIsPowersDrawerOpen(true)}><span className="first-letter:uppercase">{displayedText.showPowers}</span></DropdownMenuItem>}
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
