import { TableRow } from "@/common/components/ui/table";
import { Row } from "@tanstack/react-table";
import BestiaryTableCell from "@/application/bestiary/BestiaryTableCell";

export default function BestiaryTableRow<TData>({ row }: { row: Row<TData>})
{
  return (
    <TableRow data-state={row.getIsSelected() && "selected"}>
    {
      row.getVisibleCells().map(cell => <BestiaryTableCell key={cell.id} cell={cell} />)
    }
    </TableRow>
  );
};