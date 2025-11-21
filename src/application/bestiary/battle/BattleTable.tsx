"use client";

import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useState, useEffect, useMemo } from "react";
import { displayedText } from "@/presentation/translations";
import { columnKeys } from "@/application/bestiary/columns";
import { createCombatantColumns } from "@/application/bestiary/battle/combatantColumns";
import NameInputSearch from "@/common/components/table/NameInputSearch";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { Button } from "@/common/components/ui/button";
import { actions } from "@/persistence/slices/bestiarySlice";
import { toast } from "sonner";
import { removeIcon } from "@/presentation/icons";
import { rollIcon } from "@/presentation/icons";
import { rollInitiative, rollInitiativeBase } from "@/domain/characters/statistics/Attributes";
import BattleTableBody from "@/application/bestiary/battle/BattleTableBody";
import BestiaryTableFooter from "@/application/bestiary/BestiaryTableFooter";
import { useQuery } from "@tanstack/react-query";
import charactersClient from "@/infrastructure/clients/charactersClient";
import { Character } from "@/domain/characters/Character";
import AddExternalParticipantDialog from "@/application/bestiary/battle/AddExternalParticipantDialog";
import { BattleCombatant, isCharacter, isExternalParticipant, isDuplicatedCharacter } from "@/application/bestiary/battle/BattleCombatants";

const EMPTY_ARRAY: never[] = [];

export default function BattleTable()
{
  const charactersInBattle = useSelector((state: RootState) => state.bestiary.addedToBattle);
  const externalParticipants = useSelector((state: RootState) => state.bestiary.externalParticipants);
  const duplicatedCharacters = useSelector((state: RootState) => state.bestiary.duplicatedCharacters);
  const dispatch = useDispatch();

  const queryKey = ['characters', 'battle', charactersInBattle.join(',')];
  const { data } = useQuery<Character[]>
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      if (charactersInBattle.length === 0) return [];
      return await charactersClient.getByIds(charactersInBattle);
    },
    staleTime: 5_000,
    enabled: charactersInBattle.length > 0
  });

  const [sorting, setSorting] = useState<SortingState>(EMPTY_ARRAY);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(EMPTY_ARRAY);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo(() => createCombatantColumns(), []);

  useEffect(() => 
  {
    const initialVisibility: VisibilityState = columns.reduce<VisibilityState>((acc, column) => 
    {
      if (column.id) 
      {
        acc[column.id as string] = !(column.meta?.initiallyHidden);
      }
      return acc;
    }, {});
    setColumnVisibility(initialVisibility);
  }, [columns]);

  const initiatives = useSelector((state: RootState) => state.bestiary.initiatives);
  
  // Merge external participants, characters, and duplicates into single combatants array
  const combatants = useMemo(() => 
  {
    const externalData = externalParticipants.map(participant => ({
      ...participant,
      __initiative: initiatives[participant.id]?.initiative ?? null
    }));
    
    const characterData = (data ?? EMPTY_ARRAY).map(character => ({
      ...character,
      __initiative: initiatives[character.id]?.initiative ?? null
    }));
    
    const duplicatedData = (duplicatedCharacters ?? EMPTY_ARRAY).map(duplicate => ({
      ...duplicate,
      __initiative: initiatives[duplicate.id]?.initiative ?? null
    }));
    
    return [...externalData, ...characterData, ...duplicatedData] as (BattleCombatant & { __initiative: number | null })[];
  }, [externalParticipants, data, duplicatedCharacters, initiatives]);

  const table = useReactTable<BattleCombatant & { __initiative: number | null }>
  ({
    data: combatants,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getRowId: row => row.id,
    state: 
    {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    },
    autoResetPageIndex: false
  })

  return (
    <div className="mx-3">
      <div className="flex flex-wrap items-center justify-center py-4 gap-3 sticky top-0 bg-background z-10">
        <NameInputSearch table={table} defaultColumnKeys={columnKeys} />

        <Button variant="outline" disabled={table.getFilteredSelectedRowModel().rows.length === 0} onClick={() => 
        { 
          const selectedRows = table.getFilteredSelectedRowModel().rows;
          const selectedCharacterIds: string[] = [];
          const selectedExternalIds: string[] = [];
          const selectedDuplicateIds: string[] = [];
          
          selectedRows.forEach(row => 
          {
            const combatant = row.original;
            if (isCharacter(combatant)) 
            {
              selectedCharacterIds.push(combatant.id);
            } 
            else if (isExternalParticipant(combatant)) 
            {
              selectedExternalIds.push(combatant.id);
            }
            else if (isDuplicatedCharacter(combatant)) 
            {
              selectedDuplicateIds.push(combatant.id);
            }
          });
          
          if (selectedCharacterIds.length > 0) 
          {
            dispatch(actions.removeSelectedFromBattle(selectedCharacterIds));
          }
          if (selectedExternalIds.length > 0) 
          {
            selectedExternalIds.forEach(id => dispatch(actions.removeExternalParticipant(id)));
          }
          if (selectedDuplicateIds.length > 0) 
          {
            selectedDuplicateIds.forEach(id => dispatch(actions.removeDuplicatedCharacter(id)));
          }
          
          setRowSelection({});
          toast.success(displayedText.removedFromBattle);
        }}>
          {removeIcon("scale-90")}
        </Button>

        <Button variant="outline" onClick={() => 
        {
          combatants.forEach(combatant => 
          {
            if (isCharacter(combatant) && combatant.attributes.initiative) 
            {
              const rollResult = rollInitiative(combatant.attributes.initiative);
              dispatch(actions.rollInitiativeForCharacter({ characterId: combatant.id, rollResult }));
            } 

            else if (isExternalParticipant(combatant) && combatant.initiative) 
            {
              const rollResult = rollInitiativeBase(combatant.initiative.grade, combatant.initiative.value, 0, 0);
              dispatch(actions.rollInitiativeForCharacter({ characterId: combatant.id, rollResult }));
            }
            
            else if (isDuplicatedCharacter(combatant) && combatant.character.attributes.initiative) 
            {
              const rollResult = rollInitiative(combatant.character.attributes.initiative);
              dispatch(actions.rollInitiativeForCharacter({ characterId: combatant.id, rollResult }));
            }
          });

        }}>
          {rollIcon} {displayedText.rollAllInitiatives}
        </Button>

        <Button variant="outline" onClick={() => 
        {
          dispatch(actions.clearInitiatives());
        }}>
          {displayedText.clearAllInitiatives}
        </Button>

        <AddExternalParticipantDialog />

        <ColumnFilter table={table} />
      </div>

      <BattleTableBody table={table} />
      <BestiaryTableFooter table={table} />
    </div>
  );
};
