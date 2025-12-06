"use client";

import InitiativeCell from "@/application/bestiary/battle/InitiativeCell";
import { Button } from "@/common/components/ui/button";
import { Character } from "@/domain/characters/Character";
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react";
import { attributesIcons, characteristicIcons, resetIcon, sortIcon } from "@/common/icons";
import { useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { useState } from "react";
import { Checkbox } from "@/common/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/dropdown-menu";
import { getStatisticTotalTestValue } from "@/domain/characters/statistics/Statistic";
import { calculateTotalHealthForCharacter } from "@/domain/characters/combat/Health";
import { displayedText } from "@/common/translations";
import TagsView from "@/common/components/tags/TagsView";
import ExternalParticipantActionsCell from "@/application/bestiary/battle/ExternalParticipantActionsCell";
import ExternalParticipantHealthCell from "@/application/bestiary/battle/ExternalParticipantHealthCell";
import { BattleCombatant, isCharacter, isExternalParticipant, isDuplicatedCharacter, createDuplicatedCharacter } from "@/application/bestiary/battle/BattleCombatants";
import { useDispatch } from "react-redux";
import { actions } from "@/persistence/slices/bestiarySlice";
import DuplicatedCharacterAdditionalName from "@/application/bestiary/battle/DuplicatedCharacterAdditionalName";
import { Input } from "@/common/components/ui/input";
import CharacterManeuversViewDrawer from "@/application/bestiary/drawers/CharacterManeuversViewDrawer";
import CharacterPowersViewDrawer from "@/application/bestiary/drawers/CharacterPowersViewDrawer";
import CharacterPerksViewDrawer from "@/application/bestiary/drawers/CharacterPerksViewDrawer";
import CharacterNameView from "@/application/bestiary/views/CharacterNameView";
import CharacterDefensesBattleView from "@/application/bestiary/views/CharacterDefensesBattleView";
import CharacterOffensesBattleView from "@/application/bestiary/views/CharacterOffensesBattleView";
import CharacterModesViewDrawer from "@/application/bestiary/drawers/CharacterModesViewDrawer";
import CharacterPowersBattleView from "@/application/bestiary/views/CharacterPowersBattleView";

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
  powers: "powers",
  attributes: "attributes",
  characteristics: "characteristics",
  actions: "actions",
  notes: "notes",
} as const;

export function createCombatantColumns(): ColumnDef<BattleCombatant & { __initiative: number | null }>[]
{
  return [
    {
      id: columnKeys.select,
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
      cell: ({ row }) => 
      {
        const combatant = row.original;
        if (isCharacter(combatant)) 
        {
          return (
            <div className="flex items-center gap-2">
              <CharacterNameView character={combatant} />
              <DuplicatedCharacterAdditionalName duplicateNumber={1} />
            </div>
          );
        }
        if (isDuplicatedCharacter(combatant)) 
        {
          return (
            <div className="flex items-center gap-2">
              <CharacterNameView character={combatant.character} />
              <DuplicatedCharacterAdditionalName duplicateNumber={combatant.duplicateNumber} />
            </div>
          );
        }
        return <span className="font-medium text-emerald-500">{combatant.name}</span>;
      },
      enableHiding: false
    },
    {
      id: columnKeys.tags,
      accessorKey: columnKeys.tags,
      cell: ({ row }) => 
      {
        const combatant = row.original;
        if (isCharacter(combatant)) 
        {
          return <TagsView tags={combatant.tags} />;
        }
        if (isDuplicatedCharacter(combatant)) 
        {
          return <TagsView tags={combatant.character.tags} />;
        }
        return null;
      },
      header: () => <span className="capitalize">{displayedText[columnKeys.tags]}</span>,
      meta: { initiallyHidden: true },
    },
    {
      id: columnKeys.initiative,
      accessorFn: row => row.__initiative,
      cell: ({ row }) => 
      {
        const combatant = row.original;
        if (isCharacter(combatant)) 
        {
          return <InitiativeCell id={combatant.id} initiative={combatant.attributes.initiative} />;
        }
        if (isDuplicatedCharacter(combatant)) 
        {
          return <InitiativeCell id={combatant.id} initiative={combatant.character.attributes.initiative} />;
        }

        return <InitiativeCell id={combatant.id} initiative={combatant.initiative} />;
      },
      header: ({ column }) => ( 
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          <span className="capitalize">{displayedText[columnKeys.initiative]}</span> {sortIcon()}
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
      cell: ({ row }) => 
      {
        const combatant = row.original;

        if (isCharacter(combatant)) 
        {
          return <CharacterHealthBattleView character={combatant} />;
        }
        
        if (isDuplicatedCharacter(combatant)) 
        {
          return <CharacterHealthBattleView character={combatant.character} />;
        }

        return <ExternalParticipantHealthCell participant={combatant} />;
      },
      header: () => <span className="capitalize">{displayedText[columnKeys.health]}</span>
    },
    {
      id: columnKeys.defense,
      accessorKey: columnKeys.defense,
      cell: ({ row }) => 
      {
        const combatant = row.original;
        if (isCharacter(combatant) && combatant.defenses.length > 0) 
        {
          return <CharacterDefensesBattleView character={combatant} />;
        }
        if (isDuplicatedCharacter(combatant) && combatant.character.defenses.length > 0) 
        {
          return <CharacterDefensesBattleView character={combatant.character} />;
        }
        return null;
      },
      header: () => <span className="capitalize">{displayedText[columnKeys.defense]}</span>
    },
    {
      id: columnKeys.offense,
      accessorKey: columnKeys.offense,
      cell: ({ row }) => 
      {
        const combatant = row.original;
        if (isCharacter(combatant) && combatant.offenses.length > 0) 
        {
          return <CharacterOffensesBattleView character={combatant} initiallyHideAdvancedCombat={false} />;
        }
        if (isDuplicatedCharacter(combatant) && combatant.character.offenses.length > 0) 
        {
          return <CharacterOffensesBattleView character={combatant.character} initiallyHideAdvancedCombat={false} />;
        }

        if (isExternalParticipant(combatant))
        {
          return <span>{combatant.notes}</span>;
        }

        return null
      },
      header: () => <span className="capitalize">{displayedText[columnKeys.offense]}</span>
    },
    {
      id: columnKeys.powers,
      accessorKey: columnKeys.powers,
      cell: ({ row }) => 
      {
        const combatant = row.original;
        if (isCharacter(combatant) && combatant.powers.length > 0) 
        {
          return <CharacterPowersBattleView character={combatant} initiallyHideAdvancedCombat={false} />;
        }
        if (isDuplicatedCharacter(combatant) && combatant.character.powers.length > 0) 
        {
          return <CharacterPowersBattleView character={combatant.character} initiallyHideAdvancedCombat={false} />;
        }
        return null;
      },
      header: () => <span className="capitalize">{displayedText[columnKeys.powers]}</span>,
      enableHiding: true,
      meta: { initiallyHidden: true },
    },
    {
      id: columnKeys.characteristics,
      accessorKey: columnKeys.characteristics,
      cell: ({ row }) => 
      {
        const combatant = row.original;
        const char = isCharacter(combatant) ? combatant : isDuplicatedCharacter(combatant) ? combatant.character : null;
        if (!char) return null;

        if (isCharacter(combatant))
        {
          return (
            <div className="flex flex-wrap gap-2">
              <div className="flex flex-wrap gap-2">{characteristicIcons.strength} {getStatisticTotalTestValue(char.characteristics.strength)}</div>
              <div className="flex flex-wrap gap-2">{characteristicIcons.dexterity} {getStatisticTotalTestValue(char.characteristics.dexterity)}</div>
              <div className="flex flex-wrap gap-2">{characteristicIcons.constitution} {getStatisticTotalTestValue(char.characteristics.constitution)}</div>
            </div>
          );
        }
      },
      header: () => <span className="capitalize">{displayedText[columnKeys.characteristics]}</span>,
      meta: { initiallyHidden: true },
    },
    {
      id: columnKeys.attributes,
      accessorKey: columnKeys.attributes,
      cell: ({ row }) => 
      {
        const combatant = row.original;
        const char = isCharacter(combatant) ? combatant : isDuplicatedCharacter(combatant) ? combatant.character : null;
        if (!char) return null;
        
        return (
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-wrap gap-2">{attributesIcons.initiative} {getStatisticTotalTestValue(char.attributes.initiative)}</div>
            <div className="flex flex-wrap gap-2">{attributesIcons.fencing} {getStatisticTotalTestValue(char.attributes.fencing)}</div>
            <div className="flex flex-wrap gap-2">{attributesIcons.artifice} {getStatisticTotalTestValue(char.attributes.artifice)}</div>
            <div className="flex flex-wrap gap-2">{attributesIcons.martialArt} {getStatisticTotalTestValue(char.attributes.martialArt)}</div>
            <div className="flex flex-wrap gap-2">{attributesIcons.precision} {getStatisticTotalTestValue(char.attributes.precision)}</div>
            <div className="flex flex-wrap gap-2 ml-5">{attributesIcons.fortitude} {getStatisticTotalTestValue(char.attributes.fortitude)}</div>
            <div className="flex flex-wrap gap-2">{attributesIcons.reflex} {getStatisticTotalTestValue(char.attributes.reflex)}</div>
            <div className="flex flex-wrap gap-2">{attributesIcons.willpower} {getStatisticTotalTestValue(char.attributes.willpower)}</div>
          </div>
        );
      },
      header: () => <span className="capitalize">{displayedText[columnKeys.attributes]}</span>,
      meta: { initiallyHidden: true },
    },
    {
      id: columnKeys.notes,
      accessorKey: columnKeys.notes,
      cell: ({ row }) => 
      {
        const combatant = row.original;
        if (isExternalParticipant(combatant) && combatant.notes) 
        {
          return <div className="text-sm text-muted-foreground">{combatant.notes}</div>;
        }
        return null;
      },
      header: () => <span className="capitalize">{displayedText[columnKeys.notes]}</span>,
      meta: { initiallyHidden: true },
    },
    {
      id: columnKeys.actions,
      accessorKey: columnKeys.actions,
      cell: ({ row }) => 
      {
        const combatant = row.original;

        if (isCharacter(combatant)) 
        {
          return <MoreBattleActions character={combatant} />;
        }
        if (isDuplicatedCharacter(combatant)) 
        {
          return <MoreBattleActions character={combatant.character} />;
        }
        if (isExternalParticipant(combatant)) 
        {
          return <ExternalParticipantActionsCell participant={combatant} />;
        }

        return null;
      },
      header: '',
      enableHiding: false,
    },
  ];
}

function CharacterHealthBattleView({ character }: {character: Character})
{
  const totalHealth = calculateTotalHealthForCharacter(character);
  const [health, setHealth] = useState(totalHealth);

  return (
    <div className="flex flex-row place-items-center gap-2">
      <Input 
          id="health" 
          type="number" 
          value={health} 
          onChange={e => setHealth(Number(e.target.value))} 
          className="w-17"
      /> 
      <span>/ {totalHealth} {character.health.barrier > 0 && `+${character.health.barrier}`}</span>
      <span>{character.health.lethalHealth > 0 ? `(-${character.health.lethalHealth})` : null} [{character.health.recoveryLevel}]</span>
      <Button variant="ghost" size="icon" onClick={() => setHealth(totalHealth)} title={"Reset health to total"}>{resetIcon()}</Button>
    </div>
  );
}

function MoreBattleActions({ character }: { character: Character })
{
  const [isModesDrawerOpen, setIsModesDrawerOpen] = useState(false);
  const [isManeuversDrawerOpen, setIsManeuversDrawerOpen] = useState(false);
  const [isPowersDrawerOpen, setIsPowersDrawerOpen] = useState(false);
  const [isPerksDrawerOpen, setIsPerksDrawerOpen] = useState(false);
  const dispatch = useDispatch();
  const duplicatedCharacters = useSelector((state: RootState) => state.bestiary.duplicatedCharacters) ?? [];

  const handleDuplicate = () => 
  {
    const duplicate = createDuplicatedCharacter(character, duplicatedCharacters);
    dispatch(actions.addDuplicatedCharacter(duplicate));
  };

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
          <DropdownMenuItem onClick={handleDuplicate}><span className="first-letter:uppercase">{displayedText.duplicateCharacter}</span></DropdownMenuItem>
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
