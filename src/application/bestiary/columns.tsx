"use client";

import { Button } from "@/common/components/ui/button";
import { Character } from "@/domain/characters/Character";
import { AccessorKeyColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { attributesIcons, characteristicIcons, copyIcon, immunityIcon, resistanceIcon } from "@/presentation/icons";
import { useState } from "react";
import SelectOneOf from "@/common/components/selects/SelectOneOf";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';

import FieldViewWithInfo from "@/common/components/fields/FieldViewWithInfo";
import DefenseReductionInfoContent from "@/application/characters/combat/DefenseReductionInfoContent";

import FieldWithIconView from "@/common/components/fields/FieldWithIconView";
import { reductionIcons } from "@/presentation/icons";
import FieldWithTooltip from "@/common/components/fields/FieldWithTooltip";
import { Checkbox } from "@/common/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/ui/drawer";
import { getCastTimeColors } from "@/presentation/colors";
import RollButton from "@/common/components/buttons/RollButton";
import { colors } from "@/presentation/colors";
import RollWithImmunityButton from "@/common/components/buttons/RollWithImmunityButton";
import { getStatisticTotalTestValue } from "@/domain/characters/statistics/Statistic";
import { calculateTotalHealthForCharacter } from "@/domain/characters/combat/Health";
import { allowedReductionTypes, calculateSelectedReduction, ReductionType } from "@/domain/characters/combat/Defense";
import { Mode } from "@/domain/characters/combat/Mode";
import { Maneuver } from "@/domain/characters/combat/Maneuver";
import { toCriticalRangeString, rollDamage } from "@/domain/characters/combat/Offense";
import { displayedText } from "@/presentation/translations";
import { Power, Spell } from "@/domain/characters/combat/Power";
import { Badge } from "@/common/components/ui/badge";

export const columnKeys =
{
  select: "select",
  name: "name",
  category: "category",
  health: "health",
  barrier: "barrier",
  defense: "defense",
  offense: "offense",
  attributes: "attributes",
  characteristics: "characteristics",
  actions: "actions",
} as const;

export const columns: AccessorKeyColumnDef<Character>[] = 
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
        onCheckedChange={(value) => row.toggleSelected(!!value)}
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
    id: columnKeys.category,
    accessorKey: columnKeys.category,
    cell: ({ row }) => row.original.category,
    header: ({ column }) => (
      <Button
        variant="ghost"
        type="button"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        <span className="capitalize">{displayedText[columnKeys.category]}</span>
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    meta: { initiallyHidden: true },
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
    cell: ({ row }) => <CharacterDefensesBattleView character={row.original} />,
    header: () => <span className="capitalize">{displayedText[columnKeys.defense]}</span>
  },
  {
    id: columnKeys.offense,
    accessorKey: columnKeys.offense,
    cell: ({ row }) => <CharacterOffensesBattleView character={row.original} />,
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

function CharacterNameView({ character }: {character: Character})
{
  return (
    <div className="flex flex-row justify-center items-center gap-1">
      {character.name}
      <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(character.name)}>{copyIcon}</Button>
    </div>
  );
}

function CharacterHealthBattleView({ character }: {character: Character})
{
  return (
    <div>
      {calculateTotalHealthForCharacter(character)}{character.health.barrier && `+${character.health.barrier}`} {character.health.lethalHealth && `(-${character.health.lethalHealth})`} [{character.health.recoveryLevel}]
    </div>
  );
}

function CharacterDefensesBattleView({ character }: { character : Character })
{
  const [selectedDefenseIndex, setSelectedDefenseIndex] = useState<number>(0);
  const [selectedReductionType, setSelectedReductionType] = useState<ReductionType>("full");
  const selectedDefense = character.defenses[selectedDefenseIndex];
  const handleOnSelectedValueChange = (value: string) => 
  {
    setSelectedReductionType(value as ReductionType);
  };

  return (
    <div className="flex flex-row gap-3 items-center">
      <SelectOneOf name='defense' defaultValue='0' index={selectedDefenseIndex} items={character.defenses} setIndex={setSelectedDefenseIndex} disableInfo />

      <Select name='reduction' defaultValue={"full"} value={selectedReductionType} onValueChange={handleOnSelectedValueChange}>
        
        <FieldWithIconView value={selectedDefense.immunity} >
          <FieldWithTooltip name={displayedText.immunity}>{immunityIcon("w-5 h-5")}</FieldWithTooltip>
        </FieldWithIconView>

        <FieldWithIconView value={selectedDefense.resistance} >
          <FieldWithTooltip name={displayedText.resistance}>{resistanceIcon("w-5 h-5")}</FieldWithTooltip>
        </FieldWithIconView>

        <FieldViewWithInfo
          value={calculateSelectedReduction(selectedDefense, selectedReductionType)} 
          infoContent={<DefenseReductionInfoContent defense={selectedDefense} selectedReductionType={selectedReductionType} />}
        >
          <SelectTrigger className='capitalize border-0'><SelectValue /></SelectTrigger>
        </FieldViewWithInfo>
        
        <SelectContent>
        {
          allowedReductionTypes.map(reductionType => (
            <SelectItem key={reductionType} value={reductionType}>
              <span className='capitalize'>{reductionIcons[reductionType]}</span>
            </SelectItem>
          ))
        }
        </SelectContent>
      </Select>

    </div>
  );
}

function MoreBattleActions({ character }: { character: Character })
{
  const route = useRouter();
  const [isModesAndManeuversDrawerOpen, setIsModesAndManeuversDrawerOpen] = useState(false);
  const [isPowersDrawerOpen, setIsPowersDrawerOpen] = useState(false);

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
          <DropdownMenuItem onClick={() => setIsModesAndManeuversDrawerOpen(true)}><span className="first-letter:uppercase">{displayedText.showStancesStatesManeuvers}</span></DropdownMenuItem>
          { character.powers.length > 0 && <DropdownMenuItem onClick={() => setIsPowersDrawerOpen(true)}><span className="first-letter:uppercase">{displayedText.showPowers}</span></DropdownMenuItem>}
          <DropdownMenuItem onClick={() => route.push(`/characters/${character.id}?tab=combat`)}><span className="first-letter:uppercase">{displayedText.goToCharacterView}</span></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CharacterModesAndManeuversViewDrawer
        character={character}
        open={isModesAndManeuversDrawerOpen}
        onOpenChange={setIsModesAndManeuversDrawerOpen}
      />

      <CharacterPowersViewDrawer
        character={character}
        open={isPowersDrawerOpen}
        onOpenChange={setIsPowersDrawerOpen}
      />
    </>
  );
}

function CharacterModesAndManeuversViewDrawer({ character, open, onOpenChange }: { character: Character, open: boolean, onOpenChange: (open: boolean) => void })
{
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="grid grid-cols-9">

          <div className="flex flex-col gap-4 items-center col-span-2">

            <DrawerTitle className="capitalize">{displayedText.stances}</DrawerTitle>
            
            <div className="flex flex-row gap-3 flex-wrap items-center justify-center">
            { character.stances.map(stance => <ModeView mode={stance} key={stance.id} />) }
            </div>

          </div>

          <div className="flex flex-col gap-4 items-center col-span-1">

            <DrawerTitle className="capitalize">{displayedText.states}</DrawerTitle>
            <div className="flex flex-row gap-3 flex-wrap items-center justify-center">
            { character.states.map(state => <ModeView mode={state} key={state.id} />) }
            </div>

          </div>

          <div className="flex flex-col gap-4 items-center col-span-6">
            <DrawerTitle className="capitalize">{displayedText.maneuvers}</DrawerTitle>
            
            <div className="grid grid-cols-4 gap-3 items-center justify-center">
            { character.maneuvers.map(maneuver => <ManeuverView maneuver={maneuver} key={maneuver.id} />) }
            </div>
          </div>

        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
}

function ModeView({ mode }: { mode: Mode })
{
  return (
    <div className='flex items-center justify-center p-2 border rounded-md flex-1 min-h-12 min-w-40'>
      <FieldViewWithInfo
        value={mode.grade}
        infoContent={<span>{mode.description}</span>}
        className="gap-1"
        nameClassName='w-4xs'
      >
        {mode.name}
      </FieldViewWithInfo>
    </div>
  );
}

function ManeuverView({ maneuver }: { maneuver: Maneuver })
{
  return (
    <div className='flex items-center justify-center p-2 border rounded-md flex-1 min-h-12 min-w-40'>
      <FieldViewWithInfo
        value={maneuver.grade}
        infoContent={<span className="capitalize">{displayedText.action} <span className={`${getCastTimeColors(maneuver.castTime).text}`}>{maneuver.castTime.toLowerCase()}</span>. {maneuver.description}</span>}
        className="gap-1"
        nameClassName='w-4xs'
        infoTriggerClassName={`${getCastTimeColors(maneuver.castTime).text}`}
      >
        {maneuver.name}
      </FieldViewWithInfo>
    </div>
  );
}

function CharacterPowersViewDrawer({ character, open, onOpenChange }: { character: Character, open: boolean, onOpenChange: (open: boolean) => void })
{
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="flex flex-row items-center justify-center">
        {
          character.powers.map(power => <PowerView power={power} key={power.id} />)
        }
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
}

function PowerView({ power }: { power: Power })
{
  return (
    <div className="flex flex-col gap-4 items-center border-1 rounded-md p-4 m-2">

      <DrawerTitle className="flex flex-row gap-3">

        <FieldViewWithInfo
          value={power.level + power.bonus}
          infoContent=
          {
            <>
              <div className="capitalize">{displayedText.level} {power.level}</div>
              <div className="capitalize">{displayedText.bonus} {power.bonus}</div>
            </>
          }
          className="gap-1"
          nameClassName='w-4xs'
        >
          {power.name} 
        </FieldViewWithInfo>
        
        <Badge variant="default" className="capitalize">{power.essence}</Badge>

      </DrawerTitle>

      <div className="flex flex-row items-center justify-center flex-wrap gap-3">
        {power.spells.map(spell => <SpellView spell={spell} key={spell.id} />)}
      </div>
      
    </div>
  );
}

function SpellView({ spell }: { spell: Spell })
{
  return (
    <div className='flex items-center justify-center p-2 border rounded-md min-w-50'>
      <FieldViewWithInfo
        value={spell.grade}
        infoContent={<span className="capitalize">{displayedText.action} <span className={`${getCastTimeColors(spell.castTime).text}`}>{spell.castTime.toLowerCase()}</span>. {spell.description}</span>}
        className="gap-1"
        nameClassName='w-4xs'
        infoTriggerClassName={`${getCastTimeColors(spell.castTime).text}`}
      >
        {spell.name}
      </FieldViewWithInfo>
    </div>
  );
}

function CharacterOffensesBattleView({ character }: { character: Character })
{
  const [selectedOffenseIndex, setSelectedOffenseIndex] = useState<number>(0);
  const selectedOffense = character.offenses[selectedOffenseIndex];
  const [rollTotalResult, setRollTotalResult] = useState<number>(0);
  const [rollTotalWithOneImmunityResult, setRollTotalWithOneImmunityResult] = useState<number>(0);
  const [rollTotalWithTwoImmunityResult, setRollTotalWithTwoImmunityResult] = useState<number>(0);

  const handleRollClick = () =>
  {
    const totalRoll = rollDamage(selectedOffense);
    setRollTotalResult(totalRoll);
  }

  const handleRollWithOneImmunityClick = () =>
  {
    const totalRollWithOneImmunity = rollDamage(selectedOffense, 1);
    setRollTotalWithOneImmunityResult(totalRollWithOneImmunity);
  }

  const handleRollWithTwoImmunityClick = () =>
  {
    const totalRollWithTwoImmunity = rollDamage(selectedOffense, 2);
    setRollTotalWithTwoImmunityResult(totalRollWithTwoImmunity);
  }

  return (
    <div className="flex flex-row gap-4 items-center">
      <SelectOneOf name='offense' defaultValue='0' index={selectedOffenseIndex} items={character.offenses} setIndex={setSelectedOffenseIndex} disableInfo />

      <p>
        <span className={`${colors.offense.leading}`}>{selectedOffense.leadingWeapon.amount}(k{selectedOffense.leadingWeapon.grade * 2}+{selectedOffense.leadingWeapon.bonus})</span>
        {selectedOffense.secondaryWeapon && <span className={`${colors.offense.secondary}`}>+{selectedOffense.secondaryWeapon.amount}(k{selectedOffense.secondaryWeapon.grade * 2}+{selectedOffense.secondaryWeapon.bonus})</span>}
        +{selectedOffense.damageBonus.amount}k{selectedOffense.damageBonus.grade * 2}+{selectedOffense.damageBonus.bonus}
      </p>

      <p>
        <span className={`${colors.offense.leading}`}>{`${toCriticalRangeString(selectedOffense.leadingWeapon)}, +${selectedOffense.leadingWeapon.critical.power}`}</span>
        {selectedOffense.secondaryWeapon && <span className={`${colors.offense.secondary}`}> | {`${toCriticalRangeString(selectedOffense.secondaryWeapon)}, +${selectedOffense.secondaryWeapon.critical.power}`}</span>}
      </p>

      <RollButton onClick={handleRollClick} rollResult={rollTotalResult} />

      <RollWithImmunityButton onClick={handleRollWithOneImmunityClick} rollWithImmunityResult={rollTotalWithOneImmunityResult} immunity={1} />
      <RollWithImmunityButton onClick={handleRollWithTwoImmunityClick} rollWithImmunityResult={rollTotalWithTwoImmunityResult} immunity={2} />
    </div>
  );
}