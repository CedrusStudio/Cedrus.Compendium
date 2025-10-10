import { Table } from "@/ui/table";
import DefaultTableHeader from "@/common/components/table/DefaultTableHeader";
import BestiaryTableRow from "@/application/bestiary/BestiaryTableRow";
import { Table as TableType } from "@tanstack/react-table";
import DefaultTableBody from "@/common/components/table/DefaultTableBody";

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
        <DefaultTableBody table={table} columns={columns} tableRowFactory={row => <BestiaryTableRow key={row.id} row={row} />} />
      </Table>
    </div>
  );
};