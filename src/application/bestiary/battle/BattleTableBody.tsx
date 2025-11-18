import { Table } from "@/ui/table";
import DefaultTableHeader from "@/common/components/table/DefaultTableHeader";
import BestiaryTableRow from "@/application/bestiary/BestiaryTableRow";
import { Table as TableType } from "@tanstack/react-table";
import { TableBody } from "@/ui/table";

type BestiaryTableBodyProps<TData> = 
{
  table: TableType<TData>;
}

export default function BattleTableBody<TData>({ table }: BestiaryTableBodyProps<TData>)
{
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <DefaultTableHeader table={table} addBorders className="text-center" />
        <TableBody>
        {
          table.getRowModel().rows.map(row => <BestiaryTableRow key={row.id} row={row} /> )
        }
        </TableBody>
      </Table>
    </div>
  );
};