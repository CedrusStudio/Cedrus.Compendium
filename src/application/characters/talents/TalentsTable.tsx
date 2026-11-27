"use client";

import { flexRender, type AccessorKeyColumnDef } from "@tanstack/react-table";
import { TableCell, TableRow } from "@/ui/table";
import { type Talent } from "@/domain/characters/Talent";
import { defaultColumnKeys } from "./defaultColumns";
import CharacterTalentTable from "./CharacterTalentTable";

interface DataTableProps
{ 
  columns: AccessorKeyColumnDef<Talent>[]
  data: Talent[],
}

const talentColumnClassName = (columnId: string) => {
  if (columnId === defaultColumnKeys.name) return 'whitespace-normal [overflow-wrap:anywhere] sm:whitespace-nowrap';
  if (columnId === 'roll') return 'w-44 sm:w-auto';
  if (columnId === defaultColumnKeys.grade || columnId === defaultColumnKeys.bonus) return 'hidden sm:table-cell';
  return undefined;
};

export function TalentsTable({ columns, data }: DataTableProps) 
{
  return (
    <CharacterTalentTable
      columns={columns}
      data={data}
      columnClassName={talentColumnClassName}
      renderRow={row => (
        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
          {row.getVisibleCells().map(cell => (
            <TableCell key={cell.id} className={talentColumnClassName(cell.column.id)}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      )}
    />
  );
}
