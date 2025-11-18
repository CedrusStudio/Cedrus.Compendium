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

import { useState, useEffect } from "react";
import { displayedText } from "@/presentation/translations";
import { columnKeys, columns } from "@/application/bestiary/columns";
import NameInputSearch from "@/common/components/table/NameInputSearch";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/persistence/slices/store";
import { Button } from "@/common/components/ui/button";
import { actions } from "@/persistence/slices/bestiarySlice";
import { toast } from "sonner";
import { removeIcon } from "@/presentation/icons";
import { rollIcon } from "@/presentation/icons";
import { rollInitiative } from "@/domain/characters/statistics/Attributes";
import BattleTableBody from "@/application/bestiary/battle/BattleTableBody";
import BestiaryTableFooter from "@/application/bestiary/BestiaryTableFooter";
import { useQuery } from "@tanstack/react-query";
import charactersClient from "@/infrastructure/clients/charactersClient";
import { Character } from "@/domain/characters/Character";
import AddExternalParticipantDialog from "@/application/bestiary/battle/AddExternalParticipantDialog";

const EMPTY_ARRAY: never[] = [];

export default function BattleTable()
{
  const charactersInBattle = useSelector((state: RootState) => state.bestiary.addedToBattle);
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

  useEffect(() => 
  {
    const initialVisibility: VisibilityState = columns.reduce<VisibilityState>((acc, column) => 
    {
      acc[column.accessorKey as string] = !(column.meta?.initiallyHidden);
      return acc;
    }, {});
    setColumnVisibility(initialVisibility);
  }, []);

  const initiatives = useSelector((state: RootState) => state.bestiary.initiatives);
  const enrichedData = (data ?? EMPTY_ARRAY).map(character => 
  ({
    ...character,
    __initiative: initiatives[character.id]?.initiative ?? null
  }));

  const table = useReactTable<Character & { __initiative: number | null }>
  ({
    data: enrichedData,
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
      <div className="flex flex-wrap items-center justify-center py-4 gap-3">
        <NameInputSearch table={table} defaultColumnKeys={columnKeys} />

        <Button variant="outline" disabled={table.getFilteredSelectedRowModel().rows.length === 0} onClick={() => 
        { 
          const selectedCharacterIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
          dispatch(actions.removeSelectedFromBattle(selectedCharacterIds));
          setRowSelection({});
          toast.success(displayedText.removedFromBattle);
        }}>
          {removeIcon("scale-90")}
        </Button>

        <Button variant="outline" onClick={() => 
        {
          const characters: Character[] = data ?? [];
          characters.forEach((character: Character) => {
            if (!character.attributes.initiative) return;
            const rollResult = rollInitiative(character.attributes.initiative);
            dispatch(actions.rollInitiativeForCharacter({ characterId: character.id, rollResult }));
          });
          toast.success(displayedText.rollAllInitiatives);
        }}>
          {rollIcon} {displayedText.rollAllInitiatives}
        </Button>

        <Button variant="outline" onClick={() => 
        {
          dispatch(actions.clearInitiatives());
          toast.success(displayedText.clearAllInitiatives);
        }}>
          {displayedText.clearAllInitiatives}
        </Button>

        <AddExternalParticipantDialog />

        <ColumnFilter table={table} />
      </div>

      <BattleTableBody table={table} columns={columns} />
      <BestiaryTableFooter table={table} />
    </div>
  );
};
