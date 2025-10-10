
import { TableBody } from "@/ui/table";
import { Row, Table } from "@tanstack/react-table";
import EmptyTable from "@/common/components/EmptyTable";

type DefaultTableBodyProps<TData> = 
{
    table: Table<TData>;
    columns: { accessorKey: string }[];
    tableRowFactory: (row: Row<TData>) => React.ReactNode;
}

export default function DefaultTableBody<TData>({ table, columns, tableRowFactory }: DefaultTableBodyProps<TData>)
{
  return (
    <TableBody>
    {
        table.getRowModel().rows?.length <= 0
            ? <EmptyTable colSpan={columns.length} /> 
            : table.getRowModel().rows.map(row => tableRowFactory(row))
    }
    </TableBody>
  );
};