"use client";

import {
  AccessorKeyColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Table } from "@/ui/table";
import { useState, useEffect } from "react";
import { allowedTalentCategories, basicTalents, Talent } from "@/domain/characters/Talent";
import { type TalentsDto } from "@/persistence/schemas/characters/talentSchema";
import { useFieldArray, UseFieldArrayAppend, useFormContext } from "react-hook-form";
import EditTalentRow from "@/application/characters/edit/talents/EditTalentRow";
import { defaultColumnKeys } from "@/application/characters/talents/defaultColumns";
import { displayedText } from "@/common/translations";
import SelectFilter from "@/common/components/table/SelectFilter";
import AddTalentView from "@/application/characters/edit/talents/AddTalentView";
import NameInputSearch from "@/common/components/table/NameInputSearch";
import PaginationButtons from "@/common/components/table/PaginationButtons";
import ColumnFilter from "@/common/components/table/ColumnFilter";
import DefaultTableHeader from "@/common/components/table/DefaultTableHeader";
import DefaultTableBody from "@/common/components/table/DefaultTableBody";
import { Button } from "@/common/components/ui/button";
import { toast } from "sonner";
import { deleteIcon } from "@/common/icons";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog";
import { Description } from "@radix-ui/react-dialog";

interface DataTableProps
{
  columns: AccessorKeyColumnDef<Talent>[]
  isPending: boolean;
  initialTalents: Talent[];
}

export function EditTalentsTable({ columns, initialTalents }: DataTableProps) 
{
  const { control } = useFormContext<TalentsDto>();
  const { fields, update, remove, append, replace } = useFieldArray
  ({
    name: "talents",
    control,
    keyName: "_rhfId" // Preserves your original id field
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => 
  {
    const initialVisibility: VisibilityState = columns.reduce<VisibilityState>((acc, column) => 
    {
      acc[column.accessorKey as string] = !(column.meta?.initiallyHidden);
      return acc;
    }, {});

    setColumnVisibility(initialVisibility);
  }, [columns]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const handleOnSelectedValueChange = (value: string) => 
  {
    setSelectedCategory(value);
    table.getColumn(defaultColumnKeys.category)?.setFilterValue(value !== "all" ? value : "");
  };

  const table = useReactTable<Talent>
  ({
    data: fields,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state:
    {
      sorting,
      columnFilters,
      columnVisibility,
    },
    autoResetPageIndex: false,
  })

  const setNameFilter = (value: string) =>
  {
    table.getColumn(defaultColumnKeys.name)?.setFilterValue(value);
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col md:flex-row place-items-center place-content-center pt-1 gap-3">
        
        <div className="flex flex-row items-start gap-2">

          <NameInputSearch table={table} defaultColumnKeys={defaultColumnKeys} />

          <SelectFilter  
            selectedOption={selectedCategory}
            handleOnSelectedValueChange={handleOnSelectedValueChange}
            columnKey={defaultColumnKeys.category}
            options={allowedTalentCategories}
            allOption={displayedText.all}
          />
        </div>

        <div className="flex flex-row items-start gap-2">

          <AddTalentView append={append} setNameFilter={setNameFilter} />
          <AddBasicTalentButton talents={fields} append={append} />

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>

            <DialogTrigger asChild>
              <Button variant="destructive">
                {deleteIcon}
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Czy na pewno chce usunąć wszystkie talenty postaci?</DialogTitle>
              </DialogHeader>

              <Description className="text-sm text-muted-foreground">
                Później będzie i tak wymagane kliknięcie zapisz
              </Description>

              <DialogFooter>

                <div className="flex flex-col-reverse md:flex-row gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    <span className="first-letter:capitalize">{displayedText.cancel}</span>
                  </Button>

                  <Button type="button" onClick={() => replace([])} variant="destructive" >
                    {"Usuń wszystkie talenty"}
                  </Button>
                </div>
                
              </DialogFooter>
              
            </DialogContent>
          </Dialog>

        </div>

        <div className="flex flex-row place-items-center place-content-center gap-2">
          <PaginationButtons table={table} />
          <ColumnFilter table={table} />
        </div>

      </div>

      <Table>
        <DefaultTableHeader table={table} />

        <DefaultTableBody table={table} columns={columns} tableRowFactory=
        {
          row => (
            <EditTalentRow 
              key={row.original.id} 
              row={row} 
              index={row.index} 
              initialTalent={initialTalents.find(talent => talent.id === row.original.id)} 
              update={update} 
              remove={remove} 
            />
          )
        } />
      </Table>
    </div>
  )
}

type AddBasicTalentButtonProps =
{
  talents: Talent[];
  append: UseFieldArrayAppend<TalentsDto, "talents">;
}

function AddBasicTalentButton({ talents, append }: AddBasicTalentButtonProps) 
{
  const handleAddBasicTalent = () => 
  {
    for (const talent of basicTalents)
    {
      if (talents.some(t => t.name === talent.name)) continue;
      append(talent);
    }

    toast.success(`Dodano podstawowe talenty. Kliknij "zapisz" aby je utrwalić.`);
  };

  return (
    <Button variant="outline" onClick={handleAddBasicTalent} type="button">
      {"Dodaj podstawowe talenty"}
    </Button>
  )
} 
