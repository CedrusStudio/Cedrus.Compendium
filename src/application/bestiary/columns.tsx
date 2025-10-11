"use client"

import { Button } from "@/common/components/ui/button";
import { Character, getStatisticTotalTestValue, calculateTotalHealthForCharacter, calculateSelectedReduction, ReductionType, allReductionTypes, Mode, Maneuver, calculateRange, rollDamage } from "@/domain/characters/Character";
import { AccessorKeyColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { attributesIcons, characteristicIcons, immunityIcon, resistanceIcon } from "@/domain/data/icons";
import { useState } from "react";
import SelectOneOf from "@/common/components/selects/SelectOneOf";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { translate } from "@/domain/data/translations";
import FieldViewWithInfo from "@/common/components/fields/FieldViewWithInfo";
import DefenseReductionInfoContent from "@/application/characters/combat/DefenseReductionInfoContent";

import FieldWithIconView from "@/common/components/fields/FieldWithIconView";
import { reductionIcons } from "@/domain/data/icons";
import IconWithTooltip from "@/common/components/fields/IconWithTooltip";
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
import { getCastTimeColors } from "@/domain/data/castTimes";
import RollButton from "@/common/components/buttons/RollButton";
import { colors } from "@/domain/data/colors";

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

export const columnHeaders =
{
  name: "Nazwa",
  health: "Zdrowie",
  barrier: "Bariera",
  defense: "Defensywa",
  offense: "Ofensywa",
  attributes: "Atrybuty",
  characteristics: "Cechy",
  category: "Kategoria",
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
    header: columnHeaders.name,
    cell: ({ row }) => row.original.name,
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
        {columnHeaders.category}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    meta: { initiallyHidden: true },
  },
  {
    id: columnKeys.health,
    accessorKey: columnKeys.health,
    cell: ({ row }) => <CharacterHealthBattleView character={row.original} />,
    header: columnHeaders.health,
  },
  {
    id: columnKeys.defense,
    accessorKey: columnKeys.defense,
    cell: ({ row }) => <CharacterDefensesBattleView character={row.original} />,
    header: columnHeaders.defense
  },
  {
    id: columnKeys.offense,
    accessorKey: columnKeys.offense,
    cell: ({ row }) => <CharacterOffensesBattleView character={row.original} />,
    header: columnHeaders.offense
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
    header: columnHeaders.characteristics,
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
    header: columnHeaders.attributes,
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
        <FieldWithIconView icon={<IconWithTooltip icon={immunityIcon} name={translate("immunity")}/>} value={selectedDefense.immunity} />
        <FieldWithIconView icon={<IconWithTooltip icon={resistanceIcon} name={translate("resistance")}/>} value={selectedDefense.resistance} />

        <FieldViewWithInfo
          name={<SelectTrigger className='capitalize border-0'><SelectValue /></SelectTrigger>} 
          value={calculateSelectedReduction(selectedDefense, selectedReductionType)} 
          infoContent={<DefenseReductionInfoContent defense={selectedDefense} selectedReductionType={selectedReductionType} />}
        />
        
        <SelectContent>
        {
          allReductionTypes.map(reductionType => (
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Akcje</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(character.name)}>
            Skopiuj nazwę postaci
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsModesAndManeuversDrawerOpen(true)}>Wyświetl postawy, stany i manewry</DropdownMenuItem>
          <DropdownMenuItem onClick={() => route.push(`/characters/${character.id}?tab=combat`)}>Przejdź do widoku postaci</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CharacterModesAndManeuversViewDrawer
        character={character}
        open={isModesAndManeuversDrawerOpen}
        onOpenChange={setIsModesAndManeuversDrawerOpen}
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

              <DrawerTitle>Postawy</DrawerTitle>
              
              <div className="flex flex-row gap-3 flex-wrap items-center justify-center">
              { character.stances.map(stance => <ModeView mode={stance} key={stance.id} />) }
              </div>

            </div>

            <div className="flex flex-col gap-4 items-center col-span-1">

              <DrawerTitle>Stany</DrawerTitle>
              <div className="flex flex-row gap-3 flex-wrap items-center justify-center">
              { character.states.map(state => <ModeView mode={state} key={state.id} />) }
              </div>

            </div>

            <div className="flex flex-col gap-4 items-center col-span-6">
              <DrawerTitle>Manewry</DrawerTitle>
              
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
        name={mode.name}
        value={mode.grade}
        infoContent={<span>{mode.description}</span>}
        className="gap-1"
        nameClassName='w-4xs'
      />
    </div>
  );
}

function ManeuverView({ maneuver }: { maneuver: Maneuver })
{
  return (
    <div className='flex items-center justify-center p-2 border rounded-md flex-1 min-h-12 min-w-40'>
      <FieldViewWithInfo
        name={maneuver.name}
        value={maneuver.grade}
        infoContent={<span>Akcja <span className={`${getCastTimeColors(maneuver.castTime).text}`}>{maneuver.castTime.toLowerCase()}</span>. {maneuver.description}</span>}
        className="gap-1"
        nameClassName='w-4xs'
        infoTriggerClassName={`${getCastTimeColors(maneuver.castTime).text}`}
      />
    </div>
  );
}

function CharacterOffensesBattleView({ character }: { character: Character })
{
  const [selectedOffenseIndex, setSelectedOffenseIndex] = useState<number>(0);
  const [rollTotalResult, setRollTotalResult] = useState<number>(0);
  const selectedOffense = character.offenses[selectedOffenseIndex];

  const handleRollClick = () =>
  {
    const totalRoll = rollDamage(selectedOffense);
    setRollTotalResult(totalRoll);
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
        <span className={`${colors.offense.leading}`}>{`${calculateRange(selectedOffense.leadingWeapon)}, +${selectedOffense.leadingWeapon.critical.power}`}</span>
        {selectedOffense.secondaryWeapon && <span className={`${colors.offense.secondary}`}> | {`${calculateRange(selectedOffense.secondaryWeapon)}, +${selectedOffense.secondaryWeapon.critical.power}`}</span>}
      </p>

      <RollButton onClick={handleRollClick} rollResult={rollTotalResult} />

    </div>
  );
}