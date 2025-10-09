"use client"

import { Button } from "@/common/components/ui/button";
import { Character, getStatisticTotalTestValue, calculateTotalHealthForCharacter, calculateSelectedReduction, ReductionType, allReductionTypes } from "@/domain/characters/Character";
import { AccessorKeyColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react";
import { attributesIcons, characteristicIcons } from "@/domain/data/icons";
import { useState } from "react";
import SelectOneOf from "@/common/components/selects/SelectOneOf";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { translateReductions } from "@/domain/data/translations";
import FieldViewWithInfo from "@/common/components/fields/FieldViewWithInfo";
import DefenseReductionInfoContent from "@/application/characters/combat/DefenseReductionInfoContent";
import { IoShieldHalfOutline } from "react-icons/io5";
import { GiCrenulatedShield } from "react-icons/gi";
import FieldWithIconView from "@/common/components/fields/FieldWithIconView";

export const columnKeys =
{
  addToBattle: "addToBattle",
  name: "name",
  category: "category",
  health: "health",
  barrier: "barrier",
  defenses: "defenses",
  offenses: "offenses",
  attributes: "attributes",
  characteristics: "characteristics",
  maneuvers: "maneuvers",
  stances: "stances",
  states: "states",
  characterView: "characterView",
} as const;

export const columnHeaders =
{
  addToBattle: "Dodaj do walki",
  name: "Nazwa",
  health: "Zdrowie",
  barrier: "Bariera",
  defenses: "Obrony",
  offenses: "Ataki",
  attributes: "Atrybuty",
  characteristics: "Cechy",
  maneuvers: "Manewry",
  stances: "Postawy",
  states: "Stany",
  category: "Kategoria",
  characterView: "Widok postaci",
} as const;

export const columns: AccessorKeyColumnDef<Character>[] = 
[
  {
    id: columnKeys.name,
    accessorKey: columnKeys.name,
    header: columnHeaders.name,
    cell: ({ row }) => <span className="capitalize">{row.original.name}</span>
  },
  {
    id: columnKeys.category,
    accessorKey: columnKeys.category,
    cell: ({ row }) => <span className="capitalize">{row.original.category}</span>,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          type="button"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {columnHeaders.category}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    meta: { initiallyHidden: true },
  },
  {
    id: columnKeys.health,
    accessorKey: columnKeys.health,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">{CharacterHealthBattleView(row.original)}</div>
      </div>
    ),
    header: columnHeaders.health,
  },
  {
    id: columnKeys.defenses,
    accessorKey: columnKeys.defenses,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">{CharacterDefensesBattleView(row.original)}</div>
      </div>
    ),
    header: columnHeaders.defenses
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
        <div className="flex flex-wrap gap-2">{attributesIcons.fencing} {getStatisticTotalTestValue(row.original.attributes.fencing)}</div>
        <div className="flex flex-wrap gap-2">{attributesIcons.artifice} {getStatisticTotalTestValue(row.original.attributes.artifice)}</div>
        <div className="flex flex-wrap gap-2">{attributesIcons.fortitude} {getStatisticTotalTestValue(row.original.attributes.fortitude)}</div>
        <div className="flex flex-wrap gap-2">{attributesIcons.reflex} {getStatisticTotalTestValue(row.original.attributes.reflex)}</div>
        <div className="flex flex-wrap gap-2">{attributesIcons.willpower} {getStatisticTotalTestValue(row.original.attributes.willpower)}</div>
      </div>
    ),
    header: columnHeaders.attributes,
    meta: { initiallyHidden: true },
  },
];

function CharacterHealthBattleView(character: Character)
{
  return (
    <div>{calculateTotalHealthForCharacter(character)}+{character.health.barrier} ({-character.health.lethalHealth}) [{character.health.recoveryLevel}]</div>
  );
}

function CharacterDefensesBattleView(character: Character)
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
          <FieldWithIconView icon={<GiCrenulatedShield />} value={selectedDefense.immunity} />
          <FieldWithIconView icon={<IoShieldHalfOutline />} value={selectedDefense.resistance} />

          <FieldViewWithInfo
            name={<SelectTrigger className='capitalize border-0'><SelectValue /></SelectTrigger>} 
            value={calculateSelectedReduction(selectedDefense, selectedReductionType)} 
            infoContent={<DefenseReductionInfoContent defense={selectedDefense} selectedReductionType={selectedReductionType} />}
            valueClassName='pl-6'
          />
          
          <SelectContent>
          {
            allReductionTypes.map(reductionType => (
              <SelectItem key={reductionType} value={reductionType}>
                <span className='capitalize'>{translateReductions(reductionType)}</span>
              </SelectItem>
            ))
          }
          </SelectContent>
      </Select>

    </div>
  );
}