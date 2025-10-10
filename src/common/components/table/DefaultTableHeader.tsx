import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { flexRender, Table } from "@tanstack/react-table";

export default function DefaultTableHeader<TData>({ table, addBorders }: { table: Table<TData>, addBorders?: boolean })
{
  return (
    <TableHeader>
    {
      table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
          {
            headerGroup.headers.map(header => (
                <TableHead key={header.id} className={`${addBorders ? "border-r first:border-r-0 last:border-r-0 [&:nth-last-child(2)]:border-r-0" : ""}`}>
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