import { Character } from "@/domain/characters/Character";
import { TableCell } from "@/ui/table";
import { Cell, flexRender } from "@tanstack/react-table";

export default function BestiaryTableCell({ cell }: { cell: Cell<Character, unknown> })
{
  return (
    <TableCell className="border-r first:border-r-0 last:border-r-0 [&:nth-last-child(2)]:border-r-0">
        <div className="flex justify-center text-center">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </div>
    </TableCell>
  );
};