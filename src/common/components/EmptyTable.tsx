import { TableCell, TableRow } from "@/ui/table"

export default function EmptyTable({ colSpan }: { colSpan: number })
{
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center">
        Brak wyników
      </TableCell>
    </TableRow>
  )
}