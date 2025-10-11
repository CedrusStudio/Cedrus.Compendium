import { Input } from "@/ui/input";
import { Table } from "@tanstack/react-table";

export default function NameInputSearch<TData>({ table , defaultColumnKeys }: { table: Table<TData>, defaultColumnKeys: { name: string } })
{
  return (
    <Input
        placeholder="Szukaj po nazwie..."
        value={(table.getColumn(defaultColumnKeys.name)?.getFilterValue() as string) ?? ""}
        onChange={event => table.getColumn(defaultColumnKeys.name)?.setFilterValue(event.target.value)}
        className="max-w-sm"
    />
  );
};