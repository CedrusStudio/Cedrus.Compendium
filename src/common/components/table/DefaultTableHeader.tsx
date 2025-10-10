import { cn } from "@/lib/utils";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import { flexRender, Table } from "@tanstack/react-table";

type DefaultTableHeaderProps<TData> =
{
  table: Table<TData>,
  className?: string,
  addBorders?: boolean
}

export default function DefaultTableHeader<TData>({ table, className, addBorders }: DefaultTableHeaderProps<TData>)
{
  const borderClass = addBorders ? "border-r first:border-r-0 last:border-r-0 [&:nth-last-child(2)]:border-r-0" : "";

  return (
    <TableHeader>
    {
      table.getHeaderGroups().map(headerGroup => (
        <TableRow key={headerGroup.id}>
        {
          headerGroup.headers.map(header => (
            <TableHead key={header.id} className={cn(borderClass, className)}>
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