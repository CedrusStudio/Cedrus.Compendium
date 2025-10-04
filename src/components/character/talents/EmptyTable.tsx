import { AccessorKeyColumnDef, ColumnDef } from "@tanstack/react-table"
import { TableCell, TableRow } from "@/components/ui/table"
import { Talent } from "@/domain/Character"

export default function EmptyTable({ columns }: { columns: AccessorKeyColumnDef<Talent>[] | ColumnDef<Talent>[] })
{
  return (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-24 text-center">
        Brak umiejętności.
      </TableCell>
    </TableRow>
  )
}