import { Table, TableBody } from "@/ui/table";
import EmptyTable from "@/common/components/EmptyTable";
import DefaultTableHeader from "@/common/components/table/DefaultTableHeader";
import BestiaryTableRow from "@/application/bestiary/BestiaryTableRow";
import { Table as TableType } from "@tanstack/react-table";

type BestiaryTableBodyProps<TData> = 
{
    table: TableType<TData>;
    columns: { accessorKey: string }[];
}

export default function BestiaryTableBody<TData>({ table, columns }: BestiaryTableBodyProps<TData>)
{
  return (
    <div className="overflow-hidden rounded-md border">
        <Table>
            <DefaultTableHeader table={table} addBorders className="text-center" />

            <TableBody>
            {
                table.getRowModel().rows?.length <= 0
                    ? <EmptyTable colSpan={columns.length} />
                    : table.getRowModel().rows.map(row => <BestiaryTableRow key={row.id} row={row} /> )
            }
            </TableBody>
        </Table>
    </div>
  );
};