import { getTextFilterProps } from "@cedrusstudio/react-filters";
import { displayedText } from "@/common/translations";
import { Input } from "@/ui/input";
import { Table } from "@tanstack/react-table";

export default function NameInputSearch<TData>({ table , defaultColumnKeys }: { table: Table<TData>, defaultColumnKeys: { name: string } })
{
  return (
    <Input
      placeholder={displayedText.searchByName}
      {...getTextFilterProps(table.getColumn(defaultColumnKeys.name))}
      className="max-w-sm"
    />
  );
};