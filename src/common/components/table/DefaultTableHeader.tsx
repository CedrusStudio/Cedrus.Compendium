import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { flexRender, Table } from "@tanstack/react-table";

export default function DefaultTableHeader<TData>({ table }: { table: Table<TData> })
{
  return (
    <TableHeader>
    {
        table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
            {
            headerGroup.headers.map(header => (
                <TableHead key={header.id} className="">
                {
                header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())
                }
                </TableHead>
            ))
            }
            </TableRow>
        ))
    }
    </TableHeader>
  );
};